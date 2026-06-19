use crate::db::Database;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Technician {
    pub id: i64,
    pub name: String,
    pub phone: Option<String>,
    pub active: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateTechnicianInput {
    pub name: String,
    pub phone: Option<String>,
}

pub(crate) fn list_technicians_inner(conn: &Connection) -> Result<Vec<Technician>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, phone, active FROM technicians ORDER BY name")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Technician {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                active: row.get::<_, i32>(3)? == 1,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut technicians = Vec::new();
    for row in rows {
        technicians.push(row.map_err(|e| e.to_string())?);
    }
    Ok(technicians)
}

pub(crate) fn create_technician_inner(
    conn: &Connection,
    input: &CreateTechnicianInput,
) -> Result<Technician, String> {
    conn.execute(
        "INSERT INTO technicians (name, phone) VALUES (?, ?)",
        rusqlite::params![input.name, input.phone],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let mut stmt = conn
        .prepare("SELECT id, name, phone, active FROM technicians WHERE id = ?")
        .map_err(|e| e.to_string())?;

    stmt.query_row([id], |row| {
        Ok(Technician {
            id: row.get(0)?,
            name: row.get(1)?,
            phone: row.get(2)?,
            active: row.get::<_, i32>(3)? == 1,
        })
    })
    .map_err(|e| e.to_string())
}

pub(crate) fn toggle_technician_active_inner(conn: &Connection, id: i64) -> Result<(), String> {
    conn.execute(
        "UPDATE technicians SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END WHERE id = ?",
        rusqlite::params![id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn list_technicians(db: State<Database>) -> Result<Vec<Technician>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    list_technicians_inner(&conn)
}

#[tauri::command]
pub fn create_technician(
    input: CreateTechnicianInput,
    db: State<Database>,
) -> Result<Technician, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    create_technician_inner(&conn, &input)
}

#[tauri::command]
pub fn toggle_technician_active(id: i64, db: State<Database>) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    toggle_technician_active_inner(&conn, id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn setup() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys=ON;").unwrap();
        conn.execute_batch(
            "CREATE TABLE technicians (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT,
                active INTEGER DEFAULT 1
            );",
        )
        .unwrap();
        conn
    }

    fn seed(conn: &Connection) {
        create_technician_inner(
            conn,
            &CreateTechnicianInput {
                name: "John".into(),
                phone: Some("011-1111".into()),
            },
        )
        .unwrap();
        create_technician_inner(
            conn,
            &CreateTechnicianInput {
                name: "Jane".into(),
                phone: None,
            },
        )
        .unwrap();
    }

    #[test]
    fn list_should_return_empty_when_no_technicians() {
        let conn = setup();
        let list = list_technicians_inner(&conn).unwrap();
        assert!(list.is_empty());
    }

    #[test]
    fn list_should_return_all_technicians_ordered_by_name() {
        let conn = setup();
        seed(&conn);

        let list = list_technicians_inner(&conn).unwrap();
        assert_eq!(list.len(), 2);
        assert_eq!(list[0].name, "Jane");
        assert_eq!(list[1].name, "John");
    }

    #[test]
    fn create_should_return_technician_with_generated_id() {
        let conn = setup();

        let t = create_technician_inner(
            &conn,
            &CreateTechnicianInput {
                name: "Bob".into(),
                phone: None,
            },
        )
        .unwrap();

        assert!(t.id > 0);
        assert_eq!(t.name, "Bob");
        assert!(t.active);
    }

    #[test]
    fn toggle_active_should_flip_status() {
        let conn = setup();
        let t = create_technician_inner(
            &conn,
            &CreateTechnicianInput {
                name: "Bob".into(),
                phone: None,
            },
        )
        .unwrap();

        assert!(t.active);

        toggle_technician_active_inner(&conn, t.id).unwrap();
        let list = list_technicians_inner(&conn).unwrap();
        assert!(!list[0].active);

        toggle_technician_active_inner(&conn, t.id).unwrap();
        let list = list_technicians_inner(&conn).unwrap();
        assert!(list[0].active);
    }
}
