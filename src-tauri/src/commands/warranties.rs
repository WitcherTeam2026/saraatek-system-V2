use crate::db::Database;
use chrono::Datelike;
use chrono::Local;
use chrono::NaiveDate;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Warranty {
    pub id: i64,
    pub repair_id: String,
    pub duration_label: String,
    pub start_date: String,
    pub expiry_date: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WarrantyWithRepair {
    pub warranty: Warranty,
    pub customer_name: String,
    pub device_brand: String,
    pub device_model: Option<String>,
    pub serial_number: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWarrantyInput {
    pub repair_id: String,
    pub duration_label: String,
    pub start_date: String,
    pub expiry_date: String,
}

fn parse_duration_months(duration_label: &str) -> i64 {
    let d = duration_label.to_lowercase();
    let n = d
        .split(|c: char| !c.is_numeric())
        .find_map(|s| s.parse::<i64>().ok());
    if d.contains("year") || (d.contains('y') && !d.contains("month")) {
        n.unwrap_or(1) * 12
    } else if d.contains("month") || d.contains('m') {
        n.unwrap_or(3)
    } else {
        3
    }
}

pub(crate) fn create_warranty_inner(
    conn: &Connection,
    input: &CreateWarrantyInput,
) -> Result<Warranty, String> {
    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let start = NaiveDate::parse_from_str(&input.start_date, "%Y-%m-%d")
        .map_err(|e| format!("invalid start_date: {e}"))?;
    let expiry = NaiveDate::parse_from_str(&input.expiry_date, "%Y-%m-%d")
        .map_err(|e| format!("invalid expiry_date: {e}"))?;

    let existing = get_warranty_inner(conn, &input.repair_id)?;
    if let Some(w) = existing {
        return Ok(w);
    }

    conn.execute(
        "INSERT INTO warranties (repair_id, duration_label, start_date, expiry_date, created_at) VALUES (?, ?, ?, ?, ?)",
        rusqlite::params![input.repair_id, input.duration_label, start.format("%Y-%m-%d").to_string(), expiry.format("%Y-%m-%d").to_string(), now],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    let mut stmt = conn
        .prepare("SELECT id, repair_id, duration_label, start_date, expiry_date, created_at FROM warranties WHERE id = ?")
        .map_err(|e| e.to_string())?;

    stmt.query_row([id], |row| {
        Ok(Warranty {
            id: row.get(0)?,
            repair_id: row.get(1)?,
            duration_label: row.get(2)?,
            start_date: row.get(3)?,
            expiry_date: row.get(4)?,
            created_at: row.get(5)?,
        })
    })
    .map_err(|e| e.to_string())
}

pub(crate) fn get_warranty_inner(
    conn: &Connection,
    repair_id: &str,
) -> Result<Option<Warranty>, String> {
    let mut stmt = conn
        .prepare("SELECT id, repair_id, duration_label, start_date, expiry_date, created_at FROM warranties WHERE repair_id = ?")
        .map_err(|e| e.to_string())?;

    match stmt.query_row([repair_id], |row| {
        Ok(Warranty {
            id: row.get(0)?,
            repair_id: row.get(1)?,
            duration_label: row.get(2)?,
            start_date: row.get(3)?,
            expiry_date: row.get(4)?,
            created_at: row.get(5)?,
        })
    }) {
        Ok(w) => Ok(Some(w)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

pub(crate) fn search_repair_by_serial_inner(
    conn: &Connection,
    serial_number: &str,
) -> Result<Vec<WarrantyWithRepair>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT w.id, w.repair_id, w.duration_label, w.start_date, w.expiry_date, w.created_at,
                    c.name, r.brand, r.model, r.serial_number
             FROM warranties w
             JOIN repairs r ON w.repair_id = r.id
             JOIN customers c ON r.customer_id = c.id
             WHERE r.serial_number LIKE ? AND r.status = 'Completed \u{2014} Under Warranty'
             ORDER BY w.expiry_date DESC",
        )
        .map_err(|e| e.to_string())?;

    let pattern = format!("%{}%", serial_number);
    let rows = stmt
        .query_map(rusqlite::params![pattern], |row| {
            Ok(WarrantyWithRepair {
                warranty: Warranty {
                    id: row.get(0)?,
                    repair_id: row.get(1)?,
                    duration_label: row.get(2)?,
                    start_date: row.get(3)?,
                    expiry_date: row.get(4)?,
                    created_at: row.get(5)?,
                },
                customer_name: row.get(6)?,
                device_brand: row.get(7)?,
                device_model: row.get(8)?,
                serial_number: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }
    Ok(results)
}

pub(crate) fn reopen_warranty_claim_inner(
    conn: &Connection,
    repair_id: &str,
) -> Result<(), String> {
    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "UPDATE repairs SET status = 'Repairing', updated_at = ? WHERE id = ?",
        rusqlite::params![now, repair_id],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO repair_history (repair_id, status, note, changed_at) VALUES (?, 'Repairing', ?, ?)",
        rusqlite::params![repair_id, "Reopened for warranty claim", now],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

pub(crate) fn check_expired_warranties_inner(conn: &mut Connection) -> Result<i64, String> {
    let today = Local::now().format("%Y-%m-%d").to_string();

    let expired: Vec<String> = conn
        .prepare(
            "SELECT w.repair_id FROM warranties w
             JOIN repairs r ON w.repair_id = r.id
             WHERE r.status = 'Completed \u{2014} Under Warranty' AND w.expiry_date < ?",
        )
        .map_err(|e| e.to_string())?
        .query_map(rusqlite::params![today], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    if expired.is_empty() {
        return Ok(0);
    }

    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    for rid in &expired {
        tx.execute(
            "UPDATE repairs SET status = 'Closed', updated_at = ? WHERE id = ?",
            rusqlite::params![now, rid],
        )
        .map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO repair_history (repair_id, status, note, changed_at) VALUES (?, 'Closed', ?, ?)",
            rusqlite::params![rid, "Warranty expired \u{2014} automatically closed", now],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(expired.len() as i64)
}

pub(crate) fn calculate_expiry_date(start: &str, duration_label: &str) -> Result<String, String> {
    let start_date =
        NaiveDate::parse_from_str(start, "%Y-%m-%d").map_err(|e| format!("invalid date: {e}"))?;
    let months = parse_duration_months(duration_label);

    let mut year = start_date.year();
    let mut month = start_date.month() as i32 + months as i32;
    let day = start_date.day();

    while month > 12 {
        month -= 12;
        year += 1;
    }
    while month < 1 {
        month += 12;
        year -= 1;
    }

    let expiry = NaiveDate::from_ymd_opt(year, month as u32, day)
        .or_else(|| NaiveDate::from_ymd_opt(year, month as u32, 28))
        .unwrap_or(NaiveDate::MAX);
    Ok(expiry.format("%Y-%m-%d").to_string())
}

#[tauri::command]
pub fn create_warranty(
    input: CreateWarrantyInput,
    db: State<Database>,
) -> Result<Warranty, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    create_warranty_inner(&conn, &input)
}

#[tauri::command]
pub fn get_warranty(repair_id: String, db: State<Database>) -> Result<Option<Warranty>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    get_warranty_inner(&conn, &repair_id)
}

#[tauri::command]
pub fn search_repair_by_serial(
    serial_number: String,
    db: State<Database>,
) -> Result<Vec<WarrantyWithRepair>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    search_repair_by_serial_inner(&conn, &serial_number)
}

#[tauri::command]
pub fn reopen_warranty_claim(repair_id: String, db: State<Database>) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    reopen_warranty_claim_inner(&conn, &repair_id)
}

#[tauri::command]
pub fn check_expired_warranties(db: State<Database>) -> Result<i64, String> {
    let mut conn = db.conn.lock().map_err(|e| e.to_string())?;
    check_expired_warranties_inner(&mut conn)
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
                serial_number TEXT, reported_problem TEXT NOT NULL,
                received_at DATETIME NOT NULL, updated_at DATETIME
            );
            CREATE TABLE repair_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL REFERENCES repairs(id),
                status TEXT NOT NULL, note TEXT, changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE warranties (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL UNIQUE REFERENCES repairs(id),
                duration_label TEXT NOT NULL,
                start_date DATE NOT NULL, expiry_date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE shop_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);",
        )
        .unwrap();
        conn
    }

    fn seed_warranty_repair(
        conn: &Connection,
        status: &str,
        serial: &str,
        start: &str,
        expiry: &str,
    ) -> String {
        conn.execute(
            "INSERT INTO customers (type, name, phone) VALUES ('individual','Test','0000000000')",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO repairs (id, customer_id, status, brand, serial_number, reported_problem, received_at) VALUES (?, 1, ?, 'Samsung', ?, 'Issue', '2026-01-01')",
            rusqlite::params![serial, status, serial],
        ).unwrap();
        conn.execute(
            "INSERT INTO warranties (repair_id, duration_label, start_date, expiry_date) VALUES (?, '3 Months', ?, ?)",
            rusqlite::params![serial, start, expiry],
        ).unwrap();
        serial.to_string()
    }

    #[test]
    fn check_expired_warranties_should_return_zero_when_none_expired() {
        let mut conn = setup();
        seed_warranty_repair(
            &conn,
            "Completed \u{2014} Under Warranty",
            "T/01/26",
            "2026-06-01",
            "3026-06-01",
        );
        let count = check_expired_warranties_inner(&mut conn).unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn check_expired_warranties_should_close_expired() {
        let mut conn = setup();
        seed_warranty_repair(
            &conn,
            "Completed \u{2014} Under Warranty",
            "T/01/26",
            "2020-01-01",
            "2020-02-01",
        );
        let count = check_expired_warranties_inner(&mut conn).unwrap();
        assert_eq!(count, 1);
        let status: String = conn
            .query_row("SELECT status FROM repairs WHERE id = 'T/01/26'", [], |r| {
                r.get(0)
            })
            .unwrap();
        assert_eq!(status, "Closed");
    }

    #[test]
    fn check_expired_warranties_should_not_close_non_warranty() {
        let mut conn = setup();
        conn.execute(
            "INSERT INTO customers (type, name, phone) VALUES ('individual','Test','0000000000')",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO repairs (id, customer_id, status, brand, reported_problem, received_at) VALUES ('T/01/26', 1, 'Completed', 'Samsung', 'Issue', '2026-01-01')",
            [],
        ).unwrap();
        let count = check_expired_warranties_inner(&mut conn).unwrap();
        assert_eq!(count, 0);
    }
}
