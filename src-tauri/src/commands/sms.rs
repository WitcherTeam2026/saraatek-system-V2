use crate::db::Database;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SmsConfig {
    pub provider: String,
    pub api_key: String,
    pub api_url: String,
    pub sender_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SmsResult {
    pub success: bool,
    pub message_id: Option<String>,
    pub error: Option<String>,
}

pub(crate) fn get_sms_config_inner(conn: &rusqlite::Connection) -> Result<SmsConfig, String> {
    let provider = conn
        .query_row(
            "SELECT value FROM shop_settings WHERE key = 'sms_provider'",
            [],
            |row| row.get::<_, String>(0),
        )
        .unwrap_or_else(|_| "twilio".to_string());

    let api_key = conn
        .query_row(
            "SELECT value FROM shop_settings WHERE key = 'sms_api_key'",
            [],
            |row| row.get::<_, String>(0),
        )
        .unwrap_or_default();

    let api_url = conn
        .query_row(
            "SELECT value FROM shop_settings WHERE key = 'sms_api_url'",
            [],
            |row| row.get::<_, String>(0),
        )
        .unwrap_or_default();

    let sender_id = conn
        .query_row(
            "SELECT value FROM shop_settings WHERE key = 'sms_sender_id'",
            [],
            |row| row.get::<_, String>(0),
        )
        .unwrap_or_default();

    Ok(SmsConfig {
        provider,
        api_key,
        api_url,
        sender_id,
    })
}

pub(crate) fn send_sms_inner(
    conn: &rusqlite::Connection,
    to_phone: &str,
    message: &str,
) -> Result<SmsResult, String> {
    let config = get_sms_config_inner(conn)?;

    if config.api_key.is_empty() {
        return Err("SMS API key not configured. Set sms_api_key in Settings.".to_string());
    }

    // Build SMS based on provider
    let (url, body) = match config.provider.as_str() {
        "twilio" => {
            let url = format!(
                "https://api.twilio.com/2010-04-01/Accounts/{}/Messages.json",
                config.api_key.split(':').next().unwrap_or("")
            );
            let body = serde_json::json!({
                "To": to_phone,
                "From": config.sender_id,
                "Body": message,
            });
            (url, body)
        }
        "textlocal" => {
            let url = "https://api.textlocal.in/send/".to_string();
            let body = serde_json::json!({
                "apikey": config.api_key,
                "numbers": to_phone,
                "message": message,
                "sender": config.sender_id,
            });
            (url, body)
        }
        _ => {
            // Generic SMS API
            let url = if config.api_url.is_empty() {
                return Err("SMS API URL not configured. Set sms_api_url in Settings.".to_string());
            } else {
                config.api_url
            };
            let body = serde_json::json!({
                "to": to_phone,
                "message": message,
                "sender": config.sender_id,
            });
            (url, body)
        }
    };

    // Send SMS
    let response = ureq::post(&url)
        .header("Content-Type", "application/json")
        .send_json(&body);

    match response {
        Ok(resp) => {
            let body_text = resp.into_body().read_to_string().unwrap_or_default();
            let json: serde_json::Value = serde_json::from_str(&body_text).unwrap_or_default();

            let message_id = json["message_id"]
                .as_str()
                .or_else(|| json["sid"].as_str())
                .map(|s| s.to_string());

            Ok(SmsResult {
                success: true,
                message_id,
                error: None,
            })
        }
        Err(e) => Ok(SmsResult {
            success: false,
            message_id: None,
            error: Some(format!("SMS send failed: {}", e)),
        }),
    }
}

#[tauri::command]
pub fn send_sms(
    to_phone: String,
    message: String,
    db: State<Database>,
) -> Result<SmsResult, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    send_sms_inner(&conn, &to_phone, &message)
}

#[tauri::command]
pub fn get_sms_config(db: State<Database>) -> Result<SmsConfig, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    get_sms_config_inner(&conn)
}

#[tauri::command]
pub fn save_sms_config(
    provider: String,
    api_key: String,
    api_url: String,
    sender_id: String,
    db: State<Database>,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO shop_settings (key, value) VALUES ('sms_provider', ?1)",
        params![provider],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO shop_settings (key, value) VALUES ('sms_api_key', ?1)",
        params![api_key],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO shop_settings (key, value) VALUES ('sms_api_url', ?1)",
        params![api_url],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO shop_settings (key, value) VALUES ('sms_sender_id', ?1)",
        params![sender_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
