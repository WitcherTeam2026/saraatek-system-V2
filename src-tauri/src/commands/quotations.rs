use crate::db::Database;
use chrono::Utc;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Quotation {
    pub id: i64,
    pub repair_id: String,
    pub status: String,
    pub subtotal: f64,
    pub tax: f64,
    pub grand_total: f64,
    pub generated_at: String,
    pub responded_at: Option<String>,
    pub response_note: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuotationItem {
    pub id: i64,
    pub repair_id: String,
    pub document_type: String,
    pub sort_order: i32,
    pub description: String,
    pub item_type: String,
    pub device_name: Option<String>,
    pub serial_number: Option<String>,
    pub unit_price: f64,
    pub qty: i32,
    pub total: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuotationWithItems {
    pub quotation: Quotation,
    pub items: Vec<QuotationItem>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CreateQuotationItemInput {
    pub sort_order: i32,
    pub description: String,
    pub item_type: String,
    pub device_name: Option<String>,
    pub serial_number: Option<String>,
    pub unit_price: f64,
    pub qty: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateQuotationInput {
    pub repair_id: String,
    pub items: Vec<CreateQuotationItemInput>,
}

fn get_quotation_inner(conn: &Connection, id: i64) -> Result<QuotationWithItems, String> {
    let mut stmt = conn.prepare(
        "SELECT id, repair_id, status, subtotal, tax, grand_total, generated_at, responded_at, response_note FROM quotations WHERE id = ?"
    ).map_err(|e| e.to_string())?;

    let quotation = stmt
        .query_row([id], |row| {
            Ok(Quotation {
                id: row.get(0)?,
                repair_id: row.get(1)?,
                status: row.get(2)?,
                subtotal: row.get(3)?,
                tax: row.get(4)?,
                grand_total: row.get(5)?,
                generated_at: row.get(6)?,
                responded_at: row.get(7)?,
                response_note: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    drop(stmt);

    let mut istmt = conn
        .prepare(
            "SELECT id, repair_id, document_type, sort_order, description, item_type, device_name, serial_number, unit_price, qty, total FROM quotation_items WHERE repair_id = ? AND document_type = 'quotation' ORDER BY sort_order",
        )
        .map_err(|e| e.to_string())?;

    let items: Vec<QuotationItem> = istmt
        .query_map([&quotation.repair_id], |row| {
            Ok(QuotationItem {
                id: row.get(0)?,
                repair_id: row.get(1)?,
                document_type: row.get(2)?,
                sort_order: row.get(3)?,
                description: row.get(4)?,
                item_type: row.get(5)?,
                device_name: row.get(6)?,
                serial_number: row.get(7)?,
                unit_price: row.get(8)?,
                qty: row.get(9)?,
                total: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(QuotationWithItems { quotation, items })
}

pub(crate) fn get_quotation_by_repair_inner(
    conn: &Connection,
    repair_id: &str,
) -> Result<Option<QuotationWithItems>, String> {
    let id: i64 = match conn.query_row(
        "SELECT id FROM quotations WHERE repair_id = ?",
        rusqlite::params![repair_id],
        |r| r.get(0),
    ) {
        Ok(id) => id,
        Err(rusqlite::Error::QueryReturnedNoRows) => return Ok(None),
        Err(e) => return Err(e.to_string()),
    };
    get_quotation_inner(conn, id).map(Some)
}

pub(crate) fn create_quotation_inner(
    conn: &Connection,
    input: &CreateQuotationInput,
) -> Result<QuotationWithItems, String> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let subtotal: f64 = input
        .items
        .iter()
        .map(|i| i.qty as f64 * i.unit_price)
        .sum();
    let tax = 0.0;
    let grand_total = subtotal + tax;

    conn.execute(
        "INSERT INTO quotations (repair_id, status, subtotal, tax, grand_total, generated_at) VALUES (?, 'pending', ?, ?, ?, ?)",
        rusqlite::params![input.repair_id, subtotal, tax, grand_total, now],
    )
    .map_err(|e| e.to_string())?;

    let quote_id: i64 = conn.last_insert_rowid();

    for item in &input.items {
        let total = item.qty as f64 * item.unit_price;
        conn.execute(
            "INSERT INTO quotation_items (repair_id, document_type, sort_order, description, item_type, device_name, serial_number, unit_price, qty, total) VALUES (?, 'quotation', ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params![
                input.repair_id, item.sort_order, item.description, item.item_type,
                item.device_name, item.serial_number, item.unit_price, item.qty, total
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    conn.execute(
        "UPDATE repairs SET status = 'Awaiting Approval' WHERE id = ? AND status = 'Received'",
        rusqlite::params![input.repair_id],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO repair_history (repair_id, status, note, changed_at) VALUES (?, 'Awaiting Approval', ?, ?)",
        rusqlite::params![input.repair_id, format!("Quotation {} created", quote_id), now],
    )
    .map_err(|e| e.to_string())?;

    get_quotation_inner(conn, quote_id)
}

fn set_repair_status(
    conn: &Connection,
    repair_id: &str,
    status: &str,
    note: &str,
) -> Result<(), String> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    conn.execute(
        "UPDATE repairs SET status = ?, updated_at = ? WHERE id = ?",
        rusqlite::params![status, now, repair_id],
    )
    .map_err(|e| e.to_string())?;

    if status == "Completed" {
        conn.execute(
            "UPDATE repairs SET completed_at = ? WHERE id = ?",
            rusqlite::params![now, repair_id],
        )
        .map_err(|e| e.to_string())?;
    }

    conn.execute(
        "INSERT INTO repair_history (repair_id, status, note, changed_at) VALUES (?, ?, ?, ?)",
        rusqlite::params![repair_id, status, note, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

pub(crate) fn approve_quotation_inner(
    conn: &Connection,
    id: i64,
    response_note: Option<&str>,
) -> Result<QuotationWithItems, String> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    conn.execute(
        "UPDATE quotations SET status = 'approved', responded_at = ?, response_note = ? WHERE id = ? AND status = 'pending'",
        rusqlite::params![now, response_note, id],
    )
    .map_err(|e| e.to_string())?;

    if conn.changes() == 0 {
        return Err(format!("Quotation {} not found or not pending", id));
    }

    let q = get_quotation_inner(conn, id)?;
    set_repair_status(
        conn,
        &q.quotation.repair_id,
        "Repairing",
        &format!("Quotation {} approved", id),
    )?;

    get_quotation_inner(conn, id)
}

pub(crate) fn decline_quotation_inner(
    conn: &Connection,
    id: i64,
    response_note: Option<&str>,
) -> Result<QuotationWithItems, String> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    conn.execute(
        "UPDATE quotations SET status = 'declined', responded_at = ?, response_note = ? WHERE id = ? AND status = 'pending'",
        rusqlite::params![now, response_note, id],
    )
    .map_err(|e| e.to_string())?;

    if conn.changes() == 0 {
        return Err(format!("Quotation {} not found or not pending", id));
    }

    let q = get_quotation_inner(conn, id)?;
    set_repair_status(
        conn,
        &q.quotation.repair_id,
        "Declined",
        &format!("Quotation {} declined", id),
    )?;

    get_quotation_inner(conn, id)
}

pub(crate) fn create_invoice_items_inner(
    conn: &Connection,
    repair_id: &str,
    items: &[CreateQuotationItemInput],
) -> Result<Vec<QuotationItem>, String> {
    for item in items {
        let total = item.qty as f64 * item.unit_price;
        conn.execute(
            "INSERT INTO quotation_items (repair_id, document_type, sort_order, description, item_type, device_name, serial_number, unit_price, qty, total) VALUES (?, 'invoice', ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params![
                repair_id, item.sort_order, item.description, item.item_type,
                item.device_name, item.serial_number, item.unit_price, item.qty, total
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    let mut istmt = conn
        .prepare(
            "SELECT id, repair_id, document_type, sort_order, description, item_type, device_name, serial_number, unit_price, qty, total FROM quotation_items WHERE repair_id = ? AND document_type = 'invoice' ORDER BY sort_order",
        )
        .map_err(|e| e.to_string())?;

    let invoice_items: Vec<QuotationItem> = istmt
        .query_map([repair_id], |row| {
            Ok(QuotationItem {
                id: row.get(0)?,
                repair_id: row.get(1)?,
                document_type: row.get(2)?,
                sort_order: row.get(3)?,
                description: row.get(4)?,
                item_type: row.get(5)?,
                device_name: row.get(6)?,
                serial_number: row.get(7)?,
                unit_price: row.get(8)?,
                qty: row.get(9)?,
                total: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(invoice_items)
}

pub(crate) fn get_invoice_items_inner(
    conn: &Connection,
    repair_id: &str,
) -> Result<Vec<QuotationItem>, String> {
    let mut istmt = conn
        .prepare(
            "SELECT id, repair_id, document_type, sort_order, description, item_type, device_name, serial_number, unit_price, qty, total FROM quotation_items WHERE repair_id = ? AND document_type = 'invoice' ORDER BY sort_order",
        )
        .map_err(|e| e.to_string())?;

    let items: Vec<QuotationItem> = istmt
        .query_map([repair_id], |row| {
            Ok(QuotationItem {
                id: row.get(0)?,
                repair_id: row.get(1)?,
                document_type: row.get(2)?,
                sort_order: row.get(3)?,
                description: row.get(4)?,
                item_type: row.get(5)?,
                device_name: row.get(6)?,
                serial_number: row.get(7)?,
                unit_price: row.get(8)?,
                qty: row.get(9)?,
                total: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(items)
}

#[tauri::command]
pub fn create_quotation(
    input: CreateQuotationInput,
    token: String, db: State<Database>,
) -> Result<QuotationWithItems, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    create_quotation_inner(&conn, &input)
}

#[tauri::command]
pub fn get_quotation(id: i64, token: String, db: State<Database>) -> Result<Option<QuotationWithItems>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    match get_quotation_inner(&conn, id) {
        Ok(q) => Ok(Some(q)),
        Err(_) => Ok(None),
    }
}

#[tauri::command]
pub fn get_quotation_by_repair(
    repair_id: String,
    token: String, db: State<Database>,
) -> Result<Option<QuotationWithItems>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    get_quotation_by_repair_inner(&conn, &repair_id)
}

#[tauri::command]
pub fn approve_quotation(
    id: i64,
    response_note: Option<String>,
    token: String, db: State<Database>,
) -> Result<QuotationWithItems, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    approve_quotation_inner(&conn, id, response_note.as_deref())
}

#[tauri::command]
pub fn decline_quotation(
    id: i64,
    response_note: Option<String>,
    token: String, db: State<Database>,
) -> Result<QuotationWithItems, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    decline_quotation_inner(&conn, id, response_note.as_deref())
}

#[tauri::command]
pub fn create_invoice_items(
    repair_id: String,
    items: Vec<CreateQuotationItemInput>,
    token: String, db: State<Database>,
) -> Result<Vec<QuotationItem>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    create_invoice_items_inner(&conn, &repair_id, &items)
}

#[tauri::command]
pub fn get_invoice_items(
    repair_id: String,
    token: String, db: State<Database>,
) -> Result<Vec<QuotationItem>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    get_invoice_items_inner(&conn, &repair_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys=ON;").unwrap();
        conn.execute_batch(
            "CREATE TABLE customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL CHECK(type IN ('individual','business')),
                name TEXT NOT NULL,
                phone TEXT UNIQUE NOT NULL
            );
            CREATE TABLE repairs (
                id TEXT PRIMARY KEY,
                customer_id INTEGER NOT NULL REFERENCES customers(id),
                status TEXT NOT NULL DEFAULT 'Received',
                brand TEXT NOT NULL,
                reported_problem TEXT NOT NULL,
                received_at DATETIME NOT NULL,
                updated_at DATETIME,
                completed_at DATETIME
            );
            CREATE TABLE repair_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL REFERENCES repairs(id),
                status TEXT NOT NULL,
                note TEXT,
                changed_at DATETIME NOT NULL
            );
            CREATE TABLE quotations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL UNIQUE REFERENCES repairs(id),
                status TEXT NOT NULL DEFAULT 'pending',
                subtotal REAL NOT NULL DEFAULT 0,
                tax REAL NOT NULL DEFAULT 0,
                grand_total REAL NOT NULL DEFAULT 0,
                generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                responded_at DATETIME,
                response_note TEXT
            );
            CREATE TABLE quotation_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL REFERENCES repairs(id),
                document_type TEXT NOT NULL CHECK(document_type IN ('quotation','invoice')),
                sort_order INTEGER NOT NULL CHECK(sort_order IN (1,2)),
                description TEXT NOT NULL,
                item_type TEXT NOT NULL CHECK(item_type IN ('labour','part')),
                device_name TEXT,
                serial_number TEXT,
                unit_price REAL NOT NULL,
                qty INTEGER NOT NULL DEFAULT 1,
                total REAL NOT NULL
            );",
        )
        .unwrap();
        conn
    }

    fn seed_repair(conn: &Connection) -> String {
        conn.execute(
            "INSERT INTO customers (type, name, phone) VALUES ('business', 'Biz', '0000000000')",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO repairs (id, customer_id, brand, reported_problem, received_at) VALUES ('T/01/26', 1, 'Test', 'Issue', '2026-01-01')",
            [],
        )
        .unwrap();
        "T/01/26".into()
    }

    #[test]
    fn create_quotation_should_return_with_items() {
        let conn = setup();
        let rid = seed_repair(&conn);

        let input = CreateQuotationInput {
            repair_id: rid.clone(),
            items: vec![
                CreateQuotationItemInput {
                    sort_order: 1,
                    description: "Screen Replacement".into(),
                    item_type: "labour".into(),
                    device_name: Some("iPhone 13".into()),
                    serial_number: Some("SN001".into()),
                    unit_price: 250.0,
                    qty: 1,
                },
                CreateQuotationItemInput {
                    sort_order: 2,
                    description: "LCD Panel".into(),
                    item_type: "part".into(),
                    device_name: None,
                    serial_number: None,
                    unit_price: 50.0,
                    qty: 1,
                },
            ],
        };

        let result = create_quotation_inner(&conn, &input).unwrap();
        assert_eq!(result.quotation.status, "pending");
        assert_eq!(result.items.len(), 2);
        assert!((result.quotation.grand_total - 300.0).abs() < 0.01);
        assert_eq!(result.items[0].item_type, "labour");

        let status: String = conn
            .query_row("SELECT status FROM repairs WHERE id = ?", [&rid], |r| {
                r.get(0)
            })
            .unwrap();
        assert_eq!(status, "Awaiting Approval");
    }

    #[test]
    fn get_quotation_should_return_none_for_missing() {
        let conn = setup();
        let result = get_quotation_inner(&conn, 999);
        assert!(result.is_err());
    }

    #[test]
    fn approve_quotation_should_set_status() {
        let conn = setup();
        let _rid = seed_repair(&conn);
        conn.execute(
            "INSERT INTO repairs (id, customer_id, brand, reported_problem, received_at, status) VALUES ('T/02/26', 1, 'Test', 'Issue', '2026-01-01', 'Awaiting Approval')",
            [],
        ).unwrap();
        conn.execute(
            "INSERT INTO quotations (repair_id, status) VALUES ('T/01/26', 'pending')",
            [],
        )
        .unwrap();
        let qid: i64 = conn.last_insert_rowid();

        let result =
            approve_quotation_inner(&conn, qid, Some("Customer called to approve")).unwrap();
        assert_eq!(result.quotation.status, "approved");
        assert_eq!(
            result.quotation.response_note.as_deref(),
            Some("Customer called to approve")
        );

        let status: String = conn
            .query_row(
                "SELECT status FROM repairs WHERE id = ?",
                ["T/01/26"],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(status, "Repairing");
    }

    #[test]
    fn approve_should_fail_if_not_pending() {
        let conn = setup();
        let rid = seed_repair(&conn);
        conn.execute(
            "INSERT INTO quotations (repair_id, status) VALUES (?, 'approved')",
            [&rid],
        )
        .unwrap();
        let qid: i64 = conn.last_insert_rowid();
        let result = approve_quotation_inner(&conn, qid, None);
        assert!(result.is_err());
    }

    #[test]
    fn decline_quotation_should_set_status() {
        let conn = setup();
        let rid = seed_repair(&conn);
        conn.execute(
            "INSERT INTO quotations (repair_id, status) VALUES (?, 'pending')",
            [&rid],
        )
        .unwrap();
        let qid: i64 = conn.last_insert_rowid();

        let result = decline_quotation_inner(&conn, qid, None).unwrap();
        assert_eq!(result.quotation.status, "declined");

        let status: String = conn
            .query_row("SELECT status FROM repairs WHERE id = ?", [&rid], |r| {
                r.get(0)
            })
            .unwrap();
        assert_eq!(status, "Declined");
    }

    #[test]
    fn create_invoice_items_should_insert_and_return() {
        let conn = setup();
        let rid = seed_repair(&conn);

        let items = vec![CreateQuotationItemInput {
            sort_order: 1,
            description: "Labour".into(),
            item_type: "labour".into(),
            device_name: None,
            serial_number: None,
            unit_price: 80.0,
            qty: 1,
        }];

        let result = create_invoice_items_inner(&conn, &rid, &items).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].document_type, "invoice");
        assert_eq!(result[0].item_type, "labour");
    }

    #[test]
    fn get_invoice_items_should_return_empty_if_none() {
        let conn = setup();
        let rid = seed_repair(&conn);
        let result = get_invoice_items_inner(&conn, &rid).unwrap();
        assert!(result.is_empty());
    }
}
