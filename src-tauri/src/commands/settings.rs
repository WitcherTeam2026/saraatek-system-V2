use crate::db::Database;
use rusqlite::Connection;
use std::collections::HashMap;
use tauri::State;

pub(crate) fn get_all_settings_inner(conn: &Connection) -> Result<HashMap<String, String>, String> {
    let mut stmt = conn
        .prepare("SELECT key, value FROM shop_settings")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?;

    let mut map = HashMap::new();
    for row in rows {
        let (k, v) = row.map_err(|e| e.to_string())?;
        map.insert(k, v);
    }
    Ok(map)
}

pub(crate) fn save_setting_inner(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    conn.execute(
        "INSERT OR REPLACE INTO shop_settings (key, value) VALUES (?, ?)",
        rusqlite::params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_all_settings(db: State<Database>) -> Result<HashMap<String, String>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    get_all_settings_inner(&conn)
}

#[tauri::command]
pub fn save_setting(key: String, value: String, db: State<Database>) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    save_setting_inner(&conn, &key, &value)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn setup() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "CREATE TABLE shop_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
             INSERT INTO shop_settings (key, value) VALUES
                ('shop_name', 'SaraaTEK'),
                ('shop_address', ''),
                ('shop_phone', ''),
                ('shop_email', 'saraatek25@gmail.com'),
                ('shop_whatsapp', '+9472 2828 100'),
                ('shop_facebook', 'saraa tek'),
                ('month_counter', '0'),
                ('counter_month', ''),
                ('pdf_output_dir', '');",
        )
        .unwrap();
        conn
    }

    #[test]
    fn get_all_should_return_seeded_defaults() {
        let conn = setup();
        let settings = get_all_settings_inner(&conn).unwrap();
        assert_eq!(settings.get("shop_name").unwrap(), "SaraaTEK");
        assert_eq!(settings.get("month_counter").unwrap(), "0");
        assert!(settings.contains_key("pdf_output_dir"));
    }

    #[test]
    fn save_and_retrieve_setting() {
        let conn = setup();
        save_setting_inner(&conn, "shop_name", "Test Shop").unwrap();
        let settings = get_all_settings_inner(&conn).unwrap();
        assert_eq!(settings.get("shop_name").unwrap(), "Test Shop");
    }
}
