use crate::db::Database;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseStats {
    pub total_tables: usize,
    pub total_records: HashMap<String, i64>,
    pub database_size: String,
    pub last_backup: Option<String>,
    pub sync_status: Option<String>,
    pub cloud_status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableInfo {
    pub name: String,
    pub row_count: i64,
    pub size_bytes: i64,
    pub size_human: String,
    pub last_modified: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseHealth {
    pub is_healthy: bool,
    pub connection_count: i32,
    pub uptime_seconds: i64,
    pub warnings: Vec<String>,
    pub errors: Vec<String>,
}

#[tauri::command]
pub fn get_database_stats(db: tauri::State<Database>) -> Result<DatabaseStats, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    let mut total_records = HashMap::new();
    
    // Get all tables
    let tables = vec![
        "customers", "repairs", "payments", "quotations", 
        "quotation_items", "warranties", "photos", "notifications",
        "users", "sessions", "companies", "contacts", "communications",
        "campaigns", "campaign_recipients", "document_templates",
        "document_versions", "signatures", "letterhead_settings",
        "pdf_template_settings", "technicians", "shop_settings",
        "repair_condition", "repair_history", "field_audit_log",
        "audit_log", "device_registry", "sync_log", "cloud_backups"
    ];
    
    for table in &tables {
        let count: i64 = conn
            .query_row(
                &format!("SELECT COUNT(*) FROM {}", table),
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);
        total_records.insert(table.to_string(), count);
    }
    
    // Get database size (approximate)
    let total_records_sum: i64 = total_records.values().sum();
    let estimated_size = total_records_sum * 500; // Rough estimate: ~500 bytes per record
    let size_human = format_size(estimated_size);
    
    Ok(DatabaseStats {
        total_tables: tables.len(),
        total_records,
        database_size: size_human,
        last_backup: None,
        sync_status: Some("Connected".to_string()),
        cloud_status: Some("Supabase Connected".to_string()),
    })
}

#[tauri::command]
pub fn get_table_info(table_name: String, db: tauri::State<Database>) -> Result<TableInfo, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    let row_count: i64 = conn
        .query_row(
            &format!("SELECT COUNT(*) FROM {}", table_name),
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to count rows: {}", e))?;
    
    // Estimate size based on row count
    let estimated_size = row_count * 500; // Rough estimate
    let size_human = format_size(estimated_size);
    
    Ok(TableInfo {
        name: table_name,
        row_count,
        size_bytes: estimated_size,
        size_human,
        last_modified: None,
    })
}

#[tauri::command]
pub fn get_database_health(db: tauri::State<Database>) -> Result<DatabaseHealth, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    let mut warnings = Vec::new();
    let mut errors = Vec::new();
    
    // Check if database is accessible
    let test_query: i32 = conn
        .query_row("SELECT 1", [], |row| row.get(0))
        .map_err(|e| {
            errors.push(format!("Database connection failed: {}", e));
            e.to_string()
        })?;
    
    if test_query != 1 {
        errors.push("Database query test failed".to_string());
    }
    
    // Check for tables with no data
    let empty_tables = vec!["customers", "repairs", "payments"];
    for table in &empty_tables {
        let count: i64 = conn
            .query_row(
                &format!("SELECT COUNT(*) FROM {}", table),
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);
        
        if count == 0 {
            warnings.push(format!("Table '{}' has no records", table));
        }
    }
    
    // Check for orphaned records
    let orphaned_repairs: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM repairs WHERE customer_id NOT IN (SELECT id FROM customers)",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    if orphaned_repairs > 0 {
        warnings.push(format!("{} repairs with invalid customer references", orphaned_repairs));
    }
    
    let is_healthy = errors.is_empty();
    
    Ok(DatabaseHealth {
        is_healthy,
        connection_count: 1,
        uptime_seconds: 0,
        warnings,
        errors,
    })
}

#[tauri::command]
pub fn get_all_tables(db: tauri::State<Database>) -> Result<Vec<String>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = conn
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .map_err(|e| e.to_string())?;
    
    let tables: Vec<String> = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    
    Ok(tables)
}

#[tauri::command]
pub fn get_table_columns(table_name: String, db: tauri::State<Database>) -> Result<Vec<String>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = conn
        .prepare(&format!("PRAGMA table_info({})", table_name))
        .map_err(|e| e.to_string())?;
    
    let columns: Vec<String> = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    
    Ok(columns)
}

#[tauri::command]
pub fn get_recent_activity(limit: usize, db: tauri::State<Database>) -> Result<Vec<HashMap<String, String>>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    
    let mut activities = Vec::new();
    
    // Get recent repairs
    let mut stmt = conn
        .prepare("SELECT id, status, created_at FROM repairs ORDER BY created_at DESC LIMIT ?")
        .map_err(|e| e.to_string())?;
    
    let repairs: Vec<HashMap<String, String>> = stmt
        .query_map([limit as i64], |row| {
            let id: String = row.get(0)?;
            let status: String = row.get(1)?;
            let created_at: String = row.get(2)?;
            Ok((id, status, created_at))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .map(|(id, status, created_at)| {
            let mut activity = HashMap::new();
            activity.insert("type".to_string(), "repair".to_string());
            activity.insert("id".to_string(), id);
            activity.insert("status".to_string(), status);
            activity.insert("created_at".to_string(), created_at);
            activity
        })
        .collect();
    
    activities.extend(repairs);
    
    Ok(activities)
}

fn format_size(bytes: i64) -> String {
    if bytes < 1024 {
        format!("{} B", bytes)
    } else if bytes < 1024 * 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else if bytes < 1024 * 1024 * 1024 {
        format!("{:.1} MB", bytes as f64 / (1024.0 * 1024.0))
    } else {
        format!("{:.1} GB", bytes as f64 / (1024.0 * 1024.0 * 1024.0))
    }
}
