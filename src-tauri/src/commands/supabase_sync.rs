use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use reqwest::Client;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupabaseConfig {
    pub url: String,
    pub anon_key: String,
    pub service_role_key: String,
    pub database_password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatus {
    pub device_id: String,
    pub last_sync: Option<String>,
    pub pending_changes: i64,
    pub is_connected: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncRecord {
    pub id: String,
    pub table_name: String,
    pub record_id: String,
    pub action: String,
    pub old_value: Option<serde_json::Value>,
    pub new_value: Option<serde_json::Value>,
    pub synced_at: String,
    pub sync_status: String,
}

pub struct SupabaseClient {
    config: SupabaseConfig,
    client: Client,
    device_id: String,
}

impl SupabaseClient {
    pub fn new(config: SupabaseConfig) -> Self {
        let device_id = Self::get_or_create_device_id();
        Self {
            config,
            client: Client::new(),
            device_id,
        }
    }

    fn get_or_create_device_id() -> String {
        let config_dir = dirs::config_dir()
            .unwrap_or_else(|| std::path::PathBuf::from("."))
            .join("saraatek");
        let device_file = config_dir.join("device_id");
        
        if device_file.exists() {
            std::fs::read_to_string(&device_file)
                .unwrap_or_else(|_| Uuid::new_v4().to_string())
        } else {
            let id = Uuid::new_v4().to_string();
            let _ = std::fs::create_dir_all(&config_dir);
            let _ = std::fs::write(&device_file, &id);
            id
        }
    }

    pub fn get_headers(&self, use_service_role: bool) -> HashMap<String, String> {
        let mut headers = HashMap::new();
        headers.insert("Content-Type".to_string(), "application/json".to_string());
        headers.insert(
            "apikey".to_string(),
            if use_service_role {
                self.config.service_role_key.clone()
            } else {
                self.config.anon_key.clone()
            },
        );
        if use_service_role {
            headers.insert(
                "Authorization".to_string(),
                format!("Bearer {}", self.config.service_role_key),
            );
        }
        headers
    }

    pub async fn test_connection(&self) -> Result<bool, String> {
        let url = format!("{}/rest/v1/", self.config.url);
        let response = self.client
            .get(&url)
            .headers(self.get_headers(false).into_iter().map(|(k, v)| {
                (k.parse().unwrap(), v.parse().unwrap())
            }).collect())
            .send()
            .await
            .map_err(|e| format!("Connection failed: {}", e))?;
        
        Ok(response.status().is_success())
    }

    pub async fn register_device(&self, device_name: &str, user_id: Option<i32>) -> Result<(), String> {
        let url = format!("{}/rest/v1/device_registry", self.config.url);
        let body = serde_json::json!({
            "id": self.device_id,
            "device_name": device_name,
            "device_type": std::env::consts::OS,
            "user_id": user_id,
            "is_active": true
        });

        self.client
            .post(&url)
            .headers(self.get_headers(true).into_iter().map(|(k, v)| {
                (k.parse().unwrap(), v.parse().unwrap())
            }).collect())
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Failed to register device: {}", e))?;

        Ok(())
    }

    pub async fn get_pending_sync(&self) -> Result<Vec<SyncRecord>, String> {
        let url = format!(
            "{}/rest/v1/sync_log?device_id=eq.{}&sync_status=eq.pending&order=synced_at.asc",
            self.config.url, self.device_id
        );

        let response: Vec<SyncRecord> = self.client
            .get(&url)
            .headers(self.get_headers(false).into_iter().map(|(k, v)| {
                (k.parse().unwrap(), v.parse().unwrap())
            }).collect())
            .send()
            .await
            .map_err(|e| format!("Failed to get pending sync: {}", e))?
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        Ok(response)
    }

    pub async fn mark_sync_complete(&self, table_name: &str) -> Result<(), String> {
        let url = format!(
            "{}/rest/v1/sync_log?device_id=eq.{}&table_name=eq.{}&sync_status=eq.pending",
            self.config.url, self.device_id, table_name
        );

        self.client
            .patch(&url)
            .headers(self.get_headers(true).into_iter().map(|(k, v)| {
                (k.parse().unwrap(), v.parse().unwrap())
            }).collect())
            .json(&serde_json::json!({
                "sync_status": "synced",
                "synced_at": chrono::Utc::now().to_rfc3339()
            }))
            .send()
            .await
            .map_err(|e| format!("Failed to mark sync complete: {}", e))?;

        Ok(())
    }

    pub async fn push_changes(&self, table_name: &str, records: Vec<serde_json::Value>) -> Result<(), String> {
        let url = format!("{}/rest/v1/{}", self.config.url, table_name);

        self.client
            .post(&url)
            .headers(self.get_headers(true).into_iter().map(|(k, v)| {
                (k.parse().unwrap(), v.parse().unwrap())
            }).collect())
            .header("Prefer", "return=minimal")
            .json(&records)
            .send()
            .await
            .map_err(|e| format!("Failed to push changes: {}", e))?;

        Ok(())
    }

    pub async fn pull_changes(&self, table_name: &str, since: Option<&str>) -> Result<Vec<serde_json::Value>, String> {
        let mut url = format!("{}/rest/v1/{}", self.config.url, table_name);
        
        if let Some(timestamp) = since {
            url = format!("{}?created_at=gt.{}", url, timestamp);
        }

        let response: Vec<serde_json::Value> = self.client
            .get(&url)
            .headers(self.get_headers(false).into_iter().map(|(k, v)| {
                (k.parse().unwrap(), v.parse().unwrap())
            }).collect())
            .send()
            .await
            .map_err(|e| format!("Failed to pull changes: {}", e))?
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        Ok(response)
    }

    pub async fn sync_table(&self, table_name: &str, local_records: Vec<serde_json::Value>) -> Result<SyncStatus, String> {
        // Pull remote changes
        let _remote_records = self.pull_changes(table_name, None).await?;
        
        // Push local changes
        if !local_records.is_empty() {
            self.push_changes(table_name, local_records).await?;
        }

        // Mark sync complete
        self.mark_sync_complete(table_name).await?;

        Ok(SyncStatus {
            device_id: self.device_id.clone(),
            last_sync: Some(chrono::Utc::now().to_rfc3339()),
            pending_changes: 0,
            is_connected: true,
        })
    }

    pub async fn backup_database(&self, db_path: &str) -> Result<String, String> {
        // Read local SQLite database
        let db_data = std::fs::read(db_path)
            .map_err(|e| format!("Failed to read database: {}", e))?;
        
        // Upload to Supabase Storage (simplified)
        let backup_name = format!("backup_{}.db", chrono::Utc::now().format("%Y%m%d_%H%M%S"));
        let url = format!("{}/storage/v1/object/backups/{}", self.config.url, backup_name);

        self.client
            .post(&url)
            .headers(self.get_headers(true).into_iter().map(|(k, v)| {
                (k.parse().unwrap(), v.parse().unwrap())
            }).collect())
            .header("Content-Type", "application/octet-stream")
            .body(db_data)
            .send()
            .await
            .map_err(|e| format!("Failed to upload backup: {}", e))?;

        Ok(backup_name)
    }

    pub fn get_device_id(&self) -> &str {
        &self.device_id
    }
}
