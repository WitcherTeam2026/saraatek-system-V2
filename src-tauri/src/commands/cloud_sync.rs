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
pub fn get_supabase_settings(token: String, db: State<Database>) -> Result<SupabaseSettings, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("saraatek");
    let settings_file = config_dir.join("supabase_settings.json");
    
    if settings_file.exists() {
        let data = std::fs::read_to_string(&settings_file)
            .map_err(|e| format!("Failed to read settings: {}", e))?;
        serde_json::from_str(&data)
            .map_err(|e| format!("Failed to parse settings: {}", e))
    } else {
        Ok(SupabaseSettings {
            url: String::new(),
            anon_key: String::new(),
            service_role_key: String::new(),
            database_password: String::new(),
            is_enabled: false,
        })
    }
}

#[tauri::command]
pub fn save_supabase_settings(settings: SupabaseSettings, token: String, db: State<Database>) -> Result<(), String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("saraatek");
    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config dir: {}", e))?;
    
    let settings_file = config_dir.join("supabase_settings.json");
    let data = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    
    std::fs::write(&settings_file, data)
        .map_err(|e| format!("Failed to write settings: {}", e))?;
    
    Ok(())
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
    db_path: String,
    token: String,
    db: State<'_, Database>,
) -> Result<String, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
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
