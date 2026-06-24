use crate::db::Database;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IncomingMessage {
    pub id: i64,
    pub repair_id: Option<String>,
    pub customer_phone: String,
    pub customer_name: Option<String>,
    pub message: String,
    pub channel: String,
    pub direction: String,
    pub status: Option<String>,
    pub received_at: String,
}

#[derive(Debug, Deserialize)]
pub struct ProcessIncomingInput {
    pub customer_phone: String,
    pub message: String,
    pub channel: String,
    pub repair_id: Option<String>,
}

pub(crate) fn get_repair_id_for_phone(
    conn: &rusqlite::Connection,
    phone: &str,
) -> Result<Option<String>, String> {
    let result = conn.query_row(
        "SELECT r.id FROM repairs r 
         JOIN customers c ON r.customer_id = c.id 
         WHERE c.phone = ?1 AND r.status NOT IN ('Completed', 'Completed — Under Warranty', 'Cancelled')
         ORDER BY r.received_at DESC LIMIT 1",
        params![phone],
        |row| row.get(0),
    );
    match result {
        Ok(id) => Ok(Some(id)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

pub(crate) fn process_incoming_message_inner(
    conn: &rusqlite::Connection,
    input: &ProcessIncomingInput,
) -> Result<IncomingMessage, String> {
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    // Try to find repair_id from phone if not provided
    let repair_id = match &input.repair_id {
        Some(id) => Some(id.clone()),
        None => get_repair_id_for_phone(conn, &input.customer_phone)?,
    };

    // Get customer info
    let customer_info: Option<(String, i64)> = conn
        .query_row(
            "SELECT name, id FROM customers WHERE phone = ?1",
            params![input.customer_phone],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .ok();

    let (customer_name, customer_id) = customer_info.unwrap_or_default();

    // Store incoming message
    conn.execute(
        "INSERT INTO communications (company_id, contact_id, repair_id, channel, direction, message, status, sent_by)
         VALUES (?1, NULL, ?2, ?3, 'inbound', ?4, 'sent', ?5)",
        params![customer_id, repair_id, input.channel, input.message, input.customer_phone],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(IncomingMessage {
        id,
        repair_id,
        customer_phone: input.customer_phone.clone(),
        customer_name: Some(customer_name),
        message: input.message.clone(),
        channel: input.channel.clone(),
        direction: "inbound".to_string(),
        status: Some("sent".to_string()),
        received_at: now,
    })
}

#[tauri::command]
pub fn process_incoming_message(
    input: ProcessIncomingInput,
    token: String, db: State<Database>,
) -> Result<IncomingMessage, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    process_incoming_message_inner(&conn, &input)
}

#[tauri::command]
pub fn get_incoming_messages(
    repair_id: Option<String>,
    limit: Option<i64>,
    token: String, db: State<Database>,
) -> Result<Vec<IncomingMessage>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    let limit = limit.unwrap_or(50);

    let mut messages = Vec::new();

    if let Some(ref rid) = repair_id {
        let mut stmt = conn.prepare(
            "SELECT c.id, c.repair_id, cu.phone, cu.name, c.message, c.channel, c.direction, c.status, c.created_at
             FROM communications c
             LEFT JOIN customers cu ON cu.phone = c.sent_by
             WHERE c.direction = 'inbound' AND c.repair_id = ?1
             ORDER BY c.created_at DESC LIMIT ?2",
        )
        .map_err(|e| e.to_string())?;

        let rows = stmt.query_map(params![rid, limit], |row| {
            Ok(IncomingMessage {
                id: row.get(0)?,
                repair_id: row.get(1)?,
                customer_phone: row.get(2)?,
                customer_name: row.get(3)?,
                message: row.get(4)?,
                channel: row.get(5)?,
                direction: row.get(6)?,
                status: row.get(7)?,
                received_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

        for row in rows {
            messages.push(row.map_err(|e| e.to_string())?);
        }
    } else {
        let mut stmt = conn.prepare(
            "SELECT c.id, c.repair_id, cu.phone, cu.name, c.message, c.channel, c.direction, c.status, c.created_at
             FROM communications c
             LEFT JOIN customers cu ON cu.phone = c.sent_by
             WHERE c.direction = 'inbound'
             ORDER BY c.created_at DESC LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;

        let rows = stmt.query_map(params![limit], |row| {
            Ok(IncomingMessage {
                id: row.get(0)?,
                repair_id: row.get(1)?,
                customer_phone: row.get(2)?,
                customer_name: row.get(3)?,
                message: row.get(4)?,
                channel: row.get(5)?,
                direction: row.get(6)?,
                status: row.get(7)?,
                received_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

        for row in rows {
            messages.push(row.map_err(|e| e.to_string())?);
        }
    }

    Ok(messages)
}

#[tauri::command]
pub fn get_conversation(
    customer_phone: String,
    limit: Option<i64>,
    token: String, db: State<Database>,
) -> Result<Vec<IncomingMessage>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    let limit = limit.unwrap_or(50);

    let mut stmt = conn
        .prepare(
            "SELECT c.id, c.repair_id, cu.phone, cu.name, c.message, c.channel, c.direction, c.status, c.created_at
             FROM communications c
             LEFT JOIN customers cu ON cu.phone = c.sent_by
             WHERE c.sent_by = ?1
             ORDER BY c.created_at DESC
             LIMIT ?2",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![customer_phone, limit], |row| {
            Ok(IncomingMessage {
                id: row.get(0)?,
                repair_id: row.get(1)?,
                customer_phone: row.get(2)?,
                customer_name: row.get(3)?,
                message: row.get(4)?,
                channel: row.get(5)?,
                direction: row.get(6)?,
                status: row.get(7)?,
                received_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut messages = Vec::new();
    for row in rows {
        messages.push(row.map_err(|e| e.to_string())?);
    }

    Ok(messages)
}
