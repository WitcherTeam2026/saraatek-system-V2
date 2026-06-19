use crate::db::Database;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FieldAuditEntry {
    pub id: i64,
    pub repair_id: String,
    pub field_name: String,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub changed_at: String,
}

pub(crate) fn insert_audit_entry(
    conn: &Connection,
    repair_id: &str,
    field_name: &str,
    old_value: Option<&str>,
    new_value: Option<&str>,
) -> Result<(), String> {
    conn.execute(
        "INSERT INTO field_audit_log (repair_id, field_name, old_value, new_value) VALUES (?, ?, ?, ?)",
        rusqlite::params![repair_id, field_name, old_value, new_value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub(crate) fn get_field_audit_log_inner(
    conn: &Connection,
    repair_id: &str,
) -> Result<Vec<FieldAuditEntry>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, repair_id, field_name, old_value, new_value, changed_at
             FROM field_audit_log WHERE repair_id = ? ORDER BY changed_at DESC, id DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([repair_id], |row| {
            Ok(FieldAuditEntry {
                id: row.get(0)?,
                repair_id: row.get(1)?,
                field_name: row.get(2)?,
                old_value: row.get(3)?,
                new_value: row.get(4)?,
                changed_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut entries = Vec::new();
    for row in rows {
        entries.push(row.map_err(|e| e.to_string())?);
    }
    Ok(entries)
}

#[tauri::command]
pub fn get_field_audit_log(
    repair_id: String,
    db: State<Database>,
) -> Result<Vec<FieldAuditEntry>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    get_field_audit_log_inner(&conn, &repair_id)
}
