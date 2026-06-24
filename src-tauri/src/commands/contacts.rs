use crate::db::Database;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Contact {
    pub id: i64,
    pub company_id: i64,
    pub name: String,
    pub position: Option<String>,
    pub phone: String,
    pub email: Option<String>,
    pub is_primary: bool,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateContactInput {
    pub company_id: i64,
    pub name: String,
    pub position: Option<String>,
    pub phone: String,
    pub email: Option<String>,
    pub is_primary: Option<bool>,
    pub notes: Option<String>,
}

#[tauri::command]
pub fn create_contact(input: CreateContactInput, token: String, db: State<Database>) -> Result<Contact, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    conn.execute(
        "INSERT INTO contacts (company_id, name, position, phone, email, is_primary, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            input.company_id,
            input.name,
            input.position,
            input.phone,
            input.email,
            input.is_primary.unwrap_or(false) as i32,
            input.notes,
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    get_contact_by_id(id, &conn)
}

#[tauri::command]
pub fn list_contacts(company_id: i64, token: String, db: State<Database>) -> Result<Vec<Contact>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    let mut stmt = conn
        .prepare("SELECT * FROM contacts WHERE company_id = ?1 ORDER BY is_primary DESC, name ASC")
        .map_err(|e| e.to_string())?;

    let contacts = stmt
        .query_map(params![company_id], |row| {
            Ok(Contact {
                id: row.get(0)?,
                company_id: row.get(1)?,
                name: row.get(2)?,
                position: row.get(3)?,
                phone: row.get(4)?,
                email: row.get(5)?,
                is_primary: row.get::<_, i32>(6)? == 1,
                notes: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(contacts)
}

#[tauri::command]
pub fn update_contact(
    id: i64,
    name: Option<String>,
    position: Option<String>,
    phone: Option<String>,
    email: Option<String>,
    is_primary: Option<bool>,
    notes: Option<String>,
    token: String, db: State<Database>,
) -> Result<Contact, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;

    if let Some(name) = name {
        conn.execute(
            "UPDATE contacts SET name = ?1 WHERE id = ?2",
            params![name, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(position) = position {
        conn.execute(
            "UPDATE contacts SET position = ?1 WHERE id = ?2",
            params![position, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(phone) = phone {
        conn.execute(
            "UPDATE contacts SET phone = ?1 WHERE id = ?2",
            params![phone, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(email) = email {
        conn.execute(
            "UPDATE contacts SET email = ?1 WHERE id = ?2",
            params![email, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(is_primary) = is_primary {
        conn.execute(
            "UPDATE contacts SET is_primary = ?1 WHERE id = ?2",
            params![is_primary as i32, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(notes) = notes {
        conn.execute(
            "UPDATE contacts SET notes = ?1 WHERE id = ?2",
            params![notes, id],
        )
        .map_err(|e| e.to_string())?;
    }

    get_contact_by_id(id, &conn)
}

#[tauri::command]
pub fn delete_contact(id: i64, token: String, db: State<Database>) -> Result<(), String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    conn.execute("DELETE FROM contacts WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn get_contact_by_id(id: i64, conn: &rusqlite::Connection) -> Result<Contact, String> {
    conn.query_row("SELECT * FROM contacts WHERE id = ?1", params![id], |row| {
        Ok(Contact {
            id: row.get(0)?,
            company_id: row.get(1)?,
            name: row.get(2)?,
            position: row.get(3)?,
            phone: row.get(4)?,
            email: row.get(5)?,
            is_primary: row.get::<_, i32>(6)? == 1,
            notes: row.get(7)?,
            created_at: row.get(8)?,
        })
    })
    .map_err(|e| e.to_string())
}
