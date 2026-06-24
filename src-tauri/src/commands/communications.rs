use crate::db::Database;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Communication {
    pub id: i64,
    pub company_id: i64,
    pub contact_id: Option<i64>,
    pub repair_id: Option<String>,
    pub channel: String,
    pub direction: String,
    pub subject: Option<String>,
    pub message: String,
    pub status: Option<String>,
    pub sent_by: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct LogCommunicationInput {
    pub company_id: i64,
    pub contact_id: Option<i64>,
    pub repair_id: Option<String>,
    pub channel: String,
    pub direction: String,
    pub subject: Option<String>,
    pub message: String,
    pub status: Option<String>,
    pub sent_by: Option<String>,
}

#[tauri::command]
pub fn log_communication(
    input: LogCommunicationInput,
    token: String, db: State<Database>,
) -> Result<Communication, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    conn.execute(
        "INSERT INTO communications (company_id, contact_id, repair_id, channel, direction, subject, message, status, sent_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            input.company_id,
            input.contact_id,
            input.repair_id,
            input.channel,
            input.direction,
            input.subject,
            input.message,
            input.status,
            input.sent_by,
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    get_communication_by_id(id, &conn)
}

#[tauri::command]
pub fn get_communications(
    company_id: i64,
    token: String, db: State<Database>,
) -> Result<Vec<Communication>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    let mut stmt = conn
        .prepare("SELECT * FROM communications WHERE company_id = ?1 ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let communications = stmt
        .query_map(params![company_id], |row| {
            Ok(Communication {
                id: row.get(0)?,
                company_id: row.get(1)?,
                contact_id: row.get(2)?,
                repair_id: row.get(3)?,
                channel: row.get(4)?,
                direction: row.get(5)?,
                subject: row.get(6)?,
                message: row.get(7)?,
                status: row.get(8)?,
                sent_by: row.get(9)?,
                created_at: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(communications)
}

#[tauri::command]
pub fn get_communications_for_repair(
    repair_id: String,
    token: String, db: State<Database>,
) -> Result<Vec<Communication>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    let mut stmt = conn
        .prepare("SELECT * FROM communications WHERE repair_id = ?1 ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let communications = stmt
        .query_map(params![repair_id], |row| {
            Ok(Communication {
                id: row.get(0)?,
                company_id: row.get(1)?,
                contact_id: row.get(2)?,
                repair_id: row.get(3)?,
                channel: row.get(4)?,
                direction: row.get(5)?,
                subject: row.get(6)?,
                message: row.get(7)?,
                status: row.get(8)?,
                sent_by: row.get(9)?,
                created_at: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(communications)
}

fn get_communication_by_id(id: i64, conn: &rusqlite::Connection) -> Result<Communication, String> {
    conn.query_row(
        "SELECT * FROM communications WHERE id = ?1",
        params![id],
        |row| {
            Ok(Communication {
                id: row.get(0)?,
                company_id: row.get(1)?,
                contact_id: row.get(2)?,
                repair_id: row.get(3)?,
                channel: row.get(4)?,
                direction: row.get(5)?,
                subject: row.get(6)?,
                message: row.get(7)?,
                status: row.get(8)?,
                sent_by: row.get(9)?,
                created_at: row.get(10)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}
