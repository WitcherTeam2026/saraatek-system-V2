use crate::db::Database;
use chrono::Utc;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Payment {
    pub id: i64,
    pub repair_id: String,
    pub amount: f64,
    pub method: String,
    pub paid_at: String,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RecordPaymentInput {
    pub repair_id: String,
    pub amount: f64,
    pub method: String,
    pub note: Option<String>,
}

pub(crate) fn record_payment_inner(
    conn: &Connection,
    input: &RecordPaymentInput,
) -> Result<Payment, String> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let today = Utc::now().format("%Y-%m-%d").to_string();

    conn.execute(
        "INSERT INTO payments (repair_id, amount, method, paid_at, note) VALUES (?, ?, ?, ?, ?)",
        rusqlite::params![input.repair_id, input.amount, input.method, now, input.note],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    // Create journal entry: Dr Cash/Bank, Cr Repair Revenue
    let asset_account_code = match input.method.as_str() {
        "cash" => "1000",
        _ => "1100", // bank_transfer, card, etc.
    };

    let asset_account_id: i64 = conn
        .query_row(
            "SELECT id FROM chart_of_accounts WHERE code = ?",
            rusqlite::params![asset_account_code],
            |row| row.get(0),
        )
        .map_err(|e| format!("Account {} not found: {}", asset_account_code, e))?;

    let revenue_account_id: i64 = conn
        .query_row(
            "SELECT id FROM chart_of_accounts WHERE code = '4000'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Revenue account not found: {}", e))?;

    conn.execute(
        "INSERT INTO journal_entries (entry_date, description, source_type, source_id, is_posted) VALUES (?1, ?2, 'payment', ?3, 1)",
        rusqlite::params![today, format!("Payment received for {}", input.repair_id), input.repair_id],
    )
    .map_err(|e| e.to_string())?;

    let entry_id = conn.last_insert_rowid();

    conn.execute(
        "INSERT INTO journal_items (entry_id, account_id, debit, credit, note) VALUES (?1, ?2, ?3, 0, ?4)",
        rusqlite::params![entry_id, asset_account_id, input.amount, "Cash received"],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO journal_items (entry_id, account_id, debit, credit, note) VALUES (?1, ?2, 0, ?3, ?4)",
        rusqlite::params![entry_id, revenue_account_id, input.amount, "Repair revenue"],
    )
    .map_err(|e| e.to_string())?;

    let has_warranty: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM warranties WHERE repair_id = ?",
            rusqlite::params![input.repair_id],
            |r| r.get::<_, i64>(0),
        )
        .map(|c| c > 0)
        .unwrap_or(false);

    let (new_status, status_label) = if has_warranty {
        (
            "Completed \u{2014} Under Warranty",
            "Completed \u{2014} Under Warranty",
        )
    } else {
        ("Completed", "Completed")
    };

    let note = format!(
        "Payment recorded: LKR {:.2} via {}",
        input.amount, input.method
    );
    conn.execute(
        "UPDATE repairs SET status = ?, completed_at = ?, updated_at = ? WHERE id = ? AND status NOT IN ('Completed', 'Completed \u{2014} Under Warranty')",
        rusqlite::params![new_status, now, now, input.repair_id],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO repair_history (repair_id, status, note, changed_at) VALUES (?, ?, ?, ?)",
        rusqlite::params![input.repair_id, status_label, note, now],
    )
    .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, repair_id, amount, method, paid_at, note FROM payments WHERE id = ?")
        .map_err(|e| e.to_string())?;

    stmt.query_row([id], |row| {
        Ok(Payment {
            id: row.get(0)?,
            repair_id: row.get(1)?,
            amount: row.get(2)?,
            method: row.get(3)?,
            paid_at: row.get(4)?,
            note: row.get(5)?,
        })
    })
    .map_err(|e| e.to_string())
}

pub(crate) fn get_payment_inner(
    conn: &Connection,
    repair_id: &str,
) -> Result<Option<Payment>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, repair_id, amount, method, paid_at, note FROM payments WHERE repair_id = ? ORDER BY id DESC LIMIT 1",
        )
        .map_err(|e| e.to_string())?;

    match stmt.query_row([repair_id], |row| {
        Ok(Payment {
            id: row.get(0)?,
            repair_id: row.get(1)?,
            amount: row.get(2)?,
            method: row.get(3)?,
            paid_at: row.get(4)?,
            note: row.get(5)?,
        })
    }) {
        Ok(p) => Ok(Some(p)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn record_payment(input: RecordPaymentInput, token: String, db: State<Database>) -> Result<Payment, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    record_payment_inner(&conn, &input)
}

#[tauri::command]
pub fn get_payment(repair_id: String, token: String, db: State<Database>) -> Result<Option<Payment>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    get_payment_inner(&conn, &repair_id)
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
            CREATE TABLE payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL REFERENCES repairs(id),
                amount REAL NOT NULL,
                method TEXT NOT NULL,
                paid_at DATETIME NOT NULL,
                note TEXT
            );
            CREATE TABLE warranties (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL UNIQUE REFERENCES repairs(id),
                duration_label TEXT NOT NULL,
                start_date DATE NOT NULL,
                expiry_date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE chart_of_accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('asset','liability','equity','income','cogs','expense'))
            );
            CREATE TABLE journal_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_date DATE NOT NULL,
                description TEXT NOT NULL,
                source_type TEXT,
                source_id TEXT,
                is_posted INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE journal_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
                account_id INTEGER NOT NULL REFERENCES chart_of_accounts(id),
                debit REAL DEFAULT 0,
                credit REAL DEFAULT 0,
                note TEXT
            );",
        )
        .unwrap();
        conn
    }

    fn seed_repair(conn: &Connection) -> String {
        conn.execute(
            "INSERT INTO chart_of_accounts (code, name, type) VALUES ('1000', 'Cash', 'asset')",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO chart_of_accounts (code, name, type) VALUES ('1100', 'Bank Account', 'asset')",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO chart_of_accounts (code, name, type) VALUES ('4000', 'Repair Revenue', 'income')",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO customers (type, name, phone) VALUES ('individual', 'Test', '0000000000')",
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
    fn record_payment_should_update_repair_status() {
        let conn = setup();
        let rid = seed_repair(&conn);

        let payment = record_payment_inner(
            &conn,
            &RecordPaymentInput {
                repair_id: rid.clone(),
                amount: 300.0,
                method: "cash".into(),
                note: Some("Paid in full".into()),
            },
        )
        .unwrap();

        assert_eq!(payment.amount, 300.0);
        assert_eq!(payment.method, "cash");

        let status: String = conn
            .query_row("SELECT status FROM repairs WHERE id = ?", [&rid], |r| {
                r.get(0)
            })
            .unwrap();
        assert_eq!(status, "Completed");
    }

    #[test]
    fn get_payment_should_return_none_if_no_payment() {
        let conn = setup();
        let rid = seed_repair(&conn);
        let payment = get_payment_inner(&conn, &rid).unwrap();
        assert!(payment.is_none());
    }

    #[test]
    fn get_payment_should_return_recorded_payment() {
        let conn = setup();
        let rid = seed_repair(&conn);

        record_payment_inner(
            &conn,
            &RecordPaymentInput {
                repair_id: rid.clone(),
                amount: 150.0,
                method: "bank_transfer".into(),
                note: None,
            },
        )
        .unwrap();

        let payment = get_payment_inner(&conn, &rid).unwrap();
        assert!(payment.is_some());
        assert_eq!(payment.unwrap().method, "bank_transfer");
    }
}
