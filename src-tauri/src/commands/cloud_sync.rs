use crate::commands::supabase_sync::{SupabaseClient, SupabaseConfig, SyncStatus};
use crate::db::Database;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupabaseSettings {
    pub url: String,
    pub anon_key: String,
    pub service_role_key: String,
    pub database_password: String,
    pub is_enabled: bool,
}

#[tauri::command]
pub async fn test_supabase_connection(settings: SupabaseSettings, token: String, db: State<'_, Database>) -> Result<bool, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let config = SupabaseConfig {
        url: settings.url,
        anon_key: settings.anon_key,
        service_role_key: settings.service_role_key,
        database_password: settings.database_password,
    };
    
    let client = SupabaseClient::new(config);
    client.test_connection().await
}

#[tauri::command]
pub async fn sync_to_cloud(
    settings: SupabaseSettings,
    table_name: String,
    records: Vec<serde_json::Value>,
    token: String,
    db: State<'_, Database>,
) -> Result<SyncStatus, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let config = SupabaseConfig {
        url: settings.url,
        anon_key: settings.anon_key,
        service_role_key: settings.service_role_key,
        database_password: settings.database_password,
    };
    
    let client = SupabaseClient::new(config);
    client.sync_table(&table_name, records).await
}

#[tauri::command]
pub async fn sync_from_cloud(
    settings: SupabaseSettings,
    table_name: String,
    token: String,
    db: State<'_, Database>,
) -> Result<Vec<serde_json::Value>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let config = SupabaseConfig {
        url: settings.url,
        anon_key: settings.anon_key,
        service_role_key: settings.service_role_key,
        database_password: settings.database_password,
    };
    
    let client = SupabaseClient::new(config);
    client.pull_changes(&table_name, None).await
}

#[tauri::command]
pub async fn backup_to_cloud(
    settings: SupabaseSettings,
    token: String,
    db: State<'_, Database>,
) -> Result<String, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;

    // Get actual database path from SQLite — never trust frontend input
    let conn = db.get_conn()?;
    let db_path: String = conn
        .query_row("PRAGMA database_list", [], |row| {
            let _: String = row.get(0)?;
            row.get::<_, String>(1)
        })
        .map_err(|e| e.to_string())?;
    drop(conn);

    let config = SupabaseConfig {
        url: settings.url,
        anon_key: settings.anon_key,
        service_role_key: settings.service_role_key,
        database_password: settings.database_password,
    };
    
    let client = SupabaseClient::new(config);
    client.backup_database(&db_path).await
}

#[tauri::command]
pub fn get_sync_status(token: String, db: State<Database>) -> Result<SyncStatus, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("saraatek");
    let device_file = config_dir.join("device_id");
    
    let device_id = if device_file.exists() {
        std::fs::read_to_string(&device_file)
            .unwrap_or_else(|_| "unknown".to_string())
    } else {
        "unknown".to_string()
    };
    
    Ok(SyncStatus {
        device_id,
        last_sync: None,
        pending_changes: 0,
        is_connected: false,
    })
}
