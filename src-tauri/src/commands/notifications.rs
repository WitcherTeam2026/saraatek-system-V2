use crate::db::Database;
use chrono::Local;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Notification {
    pub id: i64,
    pub repair_id: String,
    #[serde(rename = "type")]
    pub notif_type: String,
    pub status: String,
    pub fonnte_response: Option<String>,
    pub sent_at: String,
    #[serde(default = "default_channel")]
    pub channel: String,
}

fn default_channel() -> String {
    "whatsapp".to_string()
}

fn get_setting(conn: &Connection, key: &str) -> Result<Option<String>, String> {
    match conn.query_row(
        "SELECT value FROM shop_settings WHERE key = ?",
        rusqlite::params![key],
        |row| row.get(0),
    ) {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("failed to read setting '{key}': {e}")),
    }
}

pub(crate) fn format_phone(raw: &str, default_country_code: &str) -> Result<String, String> {
    let digits: String = raw.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.is_empty() {
        return Err("Phone number has no digits".to_string());
    }
    let result = if let Some(rest) = digits.strip_prefix('0') {
        format!("{}{}", default_country_code, rest)
    } else if digits.starts_with(default_country_code) {
        digits
    } else {
        format!("{}{}", default_country_code, digits)
    };
    let len = result.len();
    if !(8..=12).contains(&len) {
        return Err(format!(
            "Invalid phone number — final result has {} digits (expected 8–12)",
            len
        ));
    }
    Ok(result)
}

pub(crate) fn send_ready_notification_inner(
    conn: &Connection,
    repair_id: &str,
) -> Result<Notification, String> {
    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let (customer_name, customer_phone, device_brand, device_model, device_type): (
        String,
        String,
        String,
        Option<String>,
        Option<String>,
    ) = conn
        .query_row(
            "SELECT c.name, c.phone, r.brand, r.model, r.device_type
             FROM repairs r JOIN customers c ON r.customer_id = c.id WHERE r.id = ?",
            rusqlite::params![repair_id],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                ))
            },
        )
        .map_err(|e| format!("failed to load repair data: {e}"))?;

    let shop_name = get_setting(conn, "shop_name")?.unwrap_or_else(|| "SaraaTEK".into());
    let shop_address = get_setting(conn, "shop_address")?.unwrap_or_default();
    let shop_phone = get_setting(conn, "shop_phone")?.unwrap_or_default();
    let default_cc = get_setting(conn, "default_country_code")?.unwrap_or_else(|| "94".into());

    let fonnte_token = get_setting(conn, "fonnte_api_token")?
        .ok_or_else(|| "Fonnte API token not configured".to_string())?;
    if fonnte_token.is_empty() {
        return Err("Fonnte API token is empty".to_string());
    }

    let formatted_phone = format_phone(&customer_phone, &default_cc)?;

    let model_str = device_model.as_deref().unwrap_or("");
    let type_str = device_type.as_deref().unwrap_or("");
    let device_line = if model_str.is_empty() {
        if type_str.is_empty() {
            device_brand.clone()
        } else {
            format!("{} ({})", device_brand, type_str)
        }
    } else {
        format!("{} {} ({})", device_brand, model_str, type_str)
    };

    let message = format!(
        "Hi {}, your device is ready for collection at {}!\n\n\
         \u{1f527} Repair ID: {}\n\
         \u{1f4bb} Device: {}\n\n\
         Please visit us at your convenience to collect it.\n\n\
         \u{1f4cd} {}\n\
         \u{1f4de} {}\n\n\
         Thank you for choosing {}!",
        customer_name, shop_name, repair_id, device_line, shop_address, shop_phone, shop_name
    );

    let url = "https://api.fonnte.com/send";
    let body = serde_json::json!({
        "target": formatted_phone,
        "message": message,
        "countryCode": default_cc,
    });

    let response = ureq::post(url)
        .header("Authorization", &fonnte_token)
        .send_json(&body);

    let (status, raw_response) = match response {
        Ok(resp) => match resp.into_body().read_to_string() {
            Ok(body_text) => ("sent".to_string(), Some(body_text)),
            Err(e) => ("sent".to_string(), Some(format!("read error: {e}"))),
        },
        Err(e) => {
            let err_msg = format!("Fonnte API error: {e}");
            ("failed".to_string(), Some(err_msg))
        }
    };

    conn.execute(
        "INSERT INTO notifications (repair_id, type, status, fonnte_response, sent_at, channel) VALUES (?, ?, ?, ?, ?, 'whatsapp')",
        rusqlite::params![repair_id, "ready_for_collection", status, raw_response, now],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(Notification {
        id,
        repair_id: repair_id.to_string(),
        notif_type: "ready_for_collection".into(),
        status,
        fonnte_response: raw_response,
        sent_at: now,
        channel: "whatsapp".into(),
    })
}

pub(crate) fn get_notification_history_inner(
    conn: &Connection,
    repair_id: &str,
) -> Result<Vec<Notification>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, repair_id, type, status, fonnte_response, sent_at, channel
             FROM notifications WHERE repair_id = ? ORDER BY sent_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([repair_id], |row| {
            Ok(Notification {
                id: row.get(0)?,
                repair_id: row.get(1)?,
                notif_type: row.get(2)?,
                status: row.get(3)?,
                fonnte_response: row.get(4)?,
                sent_at: row.get(5)?,
                channel: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for row in rows {
        list.push(row.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn send_ready_notification(
    repair_id: String,
    db: State<Database>,
) -> Result<Notification, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    send_ready_notification_inner(&conn, &repair_id)
}

#[tauri::command]
pub fn get_notification_history(
    repair_id: String,
    db: State<Database>,
) -> Result<Vec<Notification>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    get_notification_history_inner(&conn, &repair_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn setup() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys=ON;").unwrap();
        conn.execute_batch(
            "CREATE TABLE customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL,
                name TEXT NOT NULL, phone TEXT UNIQUE NOT NULL
            );
            CREATE TABLE repairs (
                id TEXT PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id),
                status TEXT NOT NULL DEFAULT 'Received', brand TEXT NOT NULL,
                reported_problem TEXT NOT NULL, received_at DATETIME NOT NULL
            );
            CREATE TABLE notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL REFERENCES repairs(id),
                type TEXT NOT NULL, status TEXT NOT NULL,
                fonnte_response TEXT, sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                channel TEXT NOT NULL DEFAULT 'whatsapp'
            );
            CREATE TABLE shop_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);",
        )
        .unwrap();
        conn
    }

    fn seed(conn: &Connection) -> String {
        conn.execute(
            "INSERT INTO customers (type, name, phone) VALUES ('individual','Test','0771234567')",
            [],
        )
        .unwrap();
        conn.execute("INSERT INTO repairs (id, customer_id, brand, reported_problem, received_at) VALUES ('T/01/26', 1, 'Samsung', 'Screen issue', '2026-01-01')", []).unwrap();
        conn.execute("INSERT OR IGNORE INTO shop_settings (key, value) VALUES ('default_country_code', '94')", []).unwrap();
        "T/01/26".into()
    }

    #[test]
    fn format_phone_should_strip_leading_zero_and_prepend_cc() {
        let result = format_phone("0771234567", "94").unwrap();
        assert_eq!(result, "94771234567");
    }

    #[test]
    fn format_phone_should_keep_already_formatted() {
        let result = format_phone("94771234567", "94").unwrap();
        assert_eq!(result, "94771234567");
    }

    #[test]
    fn format_phone_should_reject_empty_input() {
        let result = format_phone("", "94");
        assert!(result.is_err());
    }

    #[test]
    fn format_phone_should_reject_only_special_chars() {
        let result = format_phone("+() -", "94");
        assert!(result.is_err());
    }

    #[test]
    fn format_phone_should_strip_non_digits() {
        let result = format_phone("+94 77 123 4567", "94").unwrap();
        assert_eq!(result, "94771234567");
    }

    #[test]
    fn format_phone_should_reject_short_numbers() {
        let result = format_phone("123", "94");
        assert!(result.is_err());
    }

    #[test]
    fn get_notification_history_should_return_empty_when_none() {
        let conn = setup();
        let rid = seed(&conn);
        let list = get_notification_history_inner(&conn, &rid).unwrap();
        assert!(list.is_empty());
    }
}
