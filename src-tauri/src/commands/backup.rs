use crate::db::Database;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupInfo {
    pub path: String,
    pub size: u64,
    pub created_at: String,
}

#[tauri::command]
pub fn backup_database(db: State<Database>, backup_path: Option<String>) -> Result<BackupInfo, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Determine backup path
    let final_path = if let Some(path) = backup_path {
        path
    } else {
        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
        let app_data = dirs::data_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("saraatek");
        fs::create_dir_all(&app_data).ok();
        app_data
            .join(format!("saraatek_backup_{}.db", timestamp))
            .to_string_lossy()
            .to_string()
    };

    // Create backup by copying the database file
    conn.execute_batch("PRAGMA wal_checkpoint(FULL)")
        .map_err(|e| e.to_string())?;

    // Get the original database path
    let original_path: String = conn
        .query_row("PRAGMA database_list", [], |row| {
            let _: String = row.get(0)?;
            row.get::<_, String>(1)
        })
        .map_err(|e| e.to_string())?;

    fs::copy(&original_path, &final_path)
        .map_err(|e| format!("Failed to copy database: {}", e))?;

    let metadata = fs::metadata(&final_path).map_err(|e| e.to_string())?;

    Ok(BackupInfo {
        path: final_path,
        size: metadata.len(),
        created_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
    })
}

#[tauri::command]
pub fn restore_database(backup_path: String, db: State<Database>) -> Result<(), String> {
    // Verify backup exists
    if !std::path::Path::new(&backup_path).exists() {
        return Err("Backup file not found".to_string());
    }

    // Get current database path
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let original_path = conn
        .query_row("PRAGMA database_list", [], |row| {
            let _: String = row.get(0)?;
            row.get::<_, String>(1)
        })
        .map_err(|e| e.to_string())?;
    drop(conn);

    // Create a backup of current database before restore
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let pre_restore_backup = format!("{}.pre_restore_{}", original_path, timestamp);
    fs::copy(&original_path, &pre_restore_backup).ok();

    // Restore by copying backup over current database
    fs::copy(&backup_path, &original_path)
        .map_err(|e| format!("Failed to restore database: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn list_backups() -> Result<Vec<BackupInfo>, String> {
    let app_data = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("saraatek");

    if !app_data.exists() {
        return Ok(vec![]);
    }

    let mut backups = Vec::new();
    let entries = fs::read_dir(&app_data).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let filename = path.file_name().unwrap_or_default().to_string_lossy();

        if filename.starts_with("saraatek_backup_") && filename.ends_with(".db") {
            let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
            let created = metadata
                .modified()
                .map(|t| {
                    let datetime: chrono::DateTime<chrono::Local> = t.into();
                    datetime.format("%Y-%m-%d %H:%M:%S").to_string()
                })
                .unwrap_or_else(|_| "Unknown".to_string());

            backups.push(BackupInfo {
                path: path.to_string_lossy().to_string(),
                size: metadata.len(),
                created_at: created,
            });
        }
    }

    backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(backups)
}

#[tauri::command]
pub fn get_database_path(db: State<Database>) -> Result<String, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.query_row("PRAGMA database_list", [], |row| {
        let _: String = row.get(0)?;
        row.get::<_, String>(1)
    })
    .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_backup_info_structure() {
        let info = BackupInfo {
            path: "/test/backup.db".to_string(),
            size: 1024,
            created_at: "2026-01-01 12:00:00".to_string(),
        };
        assert_eq!(info.size, 1024);
    }
}
