use crate::commands::audit;
use crate::db::Database;
use chrono::Utc;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Repair {
    pub id: String,
    pub customer_id: i64,
    pub status: String,
    pub device_type: Option<String>,
    pub brand: Option<String>,
    pub model: Option<String>,
    pub serial_number: Option<String>,
    pub color_desc: Option<String>,
    pub reported_problem: Option<String>,
    pub technician_id: Option<i64>,
    pub tech_findings: Option<String>,
    pub recommended_action: Option<String>,
    pub parts_required: Option<String>,
    pub estimated_cost: Option<f64>,
    pub repair_notes: Option<String>,
    pub parts_used: Option<String>,
    pub received_at: String,
    pub updated_at: Option<String>,
    pub completed_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RepairWithCustomer {
    pub repair: Repair,
    pub customer_name: String,
    pub customer_phone: String,
    pub customer_address: String,
    pub customer_type: String,
    pub technician_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRepairInput {
    pub customer_id: i64,
    pub device_type: Option<String>,
    pub brand: String,
    pub model: Option<String>,
    pub serial_number: Option<String>,
    pub color_desc: Option<String>,
    pub reported_problem: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStatusInput {
    pub repair_id: String,
    pub new_status: String,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTechnicianFieldsInput {
    pub repair_id: String,
    pub technician_id: Option<i64>,
    pub tech_findings: Option<String>,
    pub recommended_action: Option<String>,
    pub parts_required: Option<String>,
    pub estimated_cost: Option<f64>,
    pub repair_notes: Option<String>,
    pub parts_used: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RepairHistory {
    pub id: i64,
    pub repair_id: String,
    pub status: String,
    pub note: Option<String>,
    pub changed_at: String,
}

#[derive(Debug, Deserialize)]
pub struct RepairFilter {
    pub search: Option<String>,
    pub status: Option<Vec<String>>,
    pub technician_id: Option<i64>,
    pub customer_type: Option<String>,
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
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

pub(crate) fn generate_repair_id_inner(conn: &Connection) -> Result<String, String> {
    let now = Utc::now();
    let current_month = now.format("%m").to_string();
    let current_day = now.format("%d").to_string();

    let counter_str = get_setting(conn, "month_counter")?;
    let counter: i64 = counter_str.and_then(|s| s.parse().ok()).unwrap_or(0);

    let stored_month = get_setting(conn, "counter_month")?.unwrap_or_default();

    let new_counter = if stored_month == current_month {
        counter + 1
    } else {
        1
    };

    conn.execute(
        "INSERT OR REPLACE INTO shop_settings (key, value) VALUES ('month_counter', ?)",
        rusqlite::params![new_counter.to_string()],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO shop_settings (key, value) VALUES ('counter_month', ?)",
        rusqlite::params![current_month],
    )
    .map_err(|e| e.to_string())?;

    Ok(format!(
        "{:05}/{}/{}",
        new_counter, current_month, current_day
    ))
}

pub(crate) fn create_repair_inner(
    conn: &Connection,
    input: &CreateRepairInput,
) -> Result<Repair, String> {
    let repair_id = generate_repair_id_inner(conn)?;
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "INSERT INTO repairs (id, customer_id, status, device_type, brand, model, serial_number, color_desc, reported_problem, received_at) VALUES (?, ?, 'Received', ?, ?, ?, ?, ?, ?, ?)",
        rusqlite::params![repair_id, input.customer_id, input.device_type, input.brand, input.model, input.serial_number, input.color_desc, input.reported_problem, now],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO repair_history (repair_id, status, note, changed_at) VALUES (?, 'Received', ?, ?)",
        rusqlite::params![repair_id, Option::<String>::None, now],
    )
    .map_err(|e| e.to_string())?;

    get_repair_inner(conn, &repair_id)?
        .ok_or_else(|| "repair not found after insert".to_string())
        .map(|rwc| rwc.repair)
}

pub(crate) fn get_repair_inner(
    conn: &Connection,
    id: &str,
) -> Result<Option<RepairWithCustomer>, String> {
    let mut stmt = conn.prepare(
        "SELECT r.id, r.customer_id, r.status, r.device_type, r.brand, r.model, r.serial_number, r.color_desc, r.reported_problem, r.technician_id, r.tech_findings, r.recommended_action, r.parts_required, r.estimated_cost, r.repair_notes, r.parts_used, r.received_at, r.updated_at, r.completed_at, c.name, c.phone, COALESCE(c.address,''), c.type, t.name FROM repairs r JOIN customers c ON r.customer_id = c.id LEFT JOIN technicians t ON r.technician_id = t.id WHERE r.id = ?"
    ).map_err(|e| e.to_string())?;

    let result = stmt.query_row([id], |row| {
        Ok(RepairWithCustomer {
            repair: Repair {
                id: row.get(0)?,
                customer_id: row.get(1)?,
                status: row.get(2)?,
                device_type: row.get(3)?,
                brand: row.get(4)?,
                model: row.get(5)?,
                serial_number: row.get(6)?,
                color_desc: row.get(7)?,
                reported_problem: row.get(8)?,
                technician_id: row.get(9)?,
                tech_findings: row.get(10)?,
                recommended_action: row.get(11)?,
                parts_required: row.get(12)?,
                estimated_cost: row.get(13)?,
                repair_notes: row.get(14)?,
                parts_used: row.get(15)?,
                received_at: row.get(16)?,
                updated_at: row.get(17)?,
                completed_at: row.get(18)?,
            },
            customer_name: row.get(19)?,
            customer_phone: row.get(20)?,
            customer_address: row.get(21)?,
            customer_type: row.get(22)?,
            technician_name: row.get(23)?,
        })
    });

    match result {
        Ok(r) => Ok(Some(r)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

pub(crate) fn list_repairs_inner(
    conn: &Connection,
    filter: &RepairFilter,
) -> Result<Vec<RepairWithCustomer>, String> {
    let mut sql = String::from(
        "SELECT r.id, r.customer_id, r.status, r.device_type, r.brand, r.model, r.serial_number, r.color_desc, r.reported_problem, r.technician_id, r.tech_findings, r.recommended_action, r.parts_required, r.estimated_cost, r.repair_notes, r.parts_used, r.received_at, r.updated_at, r.completed_at, c.name, c.phone, COALESCE(c.address,''), c.type, t.name FROM repairs r JOIN customers c ON r.customer_id = c.id LEFT JOIN technicians t ON r.technician_id = t.id WHERE 1=1"
    );
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref search) = filter.search {
        if !search.is_empty() {
            sql.push_str(" AND (r.id LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)");
            let s = format!("%{}%", search);
            params.push(Box::new(s.clone()));
            params.push(Box::new(s.clone()));
            params.push(Box::new(s));
        }
    }

    if let Some(ref statuses) = filter.status {
        if !statuses.is_empty() {
            let placeholders: Vec<String> = statuses.iter().map(|_| "?".to_string()).collect();
            sql.push_str(&format!(" AND r.status IN ({})", placeholders.join(",")));
            for s in statuses {
                params.push(Box::new(s.clone()));
            }
        }
    }

    if let Some(tech_id) = filter.technician_id {
        sql.push_str(" AND r.technician_id = ?");
        params.push(Box::new(tech_id));
    }

    if let Some(ref ct) = filter.customer_type {
        if !ct.is_empty() {
            sql.push_str(" AND c.type = ?");
            params.push(Box::new(ct.clone()));
        }
    }

    if let Some(ref df) = filter.date_from {
        if !df.is_empty() {
            sql.push_str(" AND r.received_at >= ?");
            params.push(Box::new(df.clone()));
        }
    }

    if let Some(ref dt) = filter.date_to {
        if !dt.is_empty() {
            sql.push_str(" AND r.received_at <= DATE(?, '+1 day')");
            params.push(Box::new(dt.clone()));
        }
    }

    let sort_col = match filter.sort_by.as_deref() {
        Some("status") => "r.status",
        _ => "r.received_at",
    };
    let sort_order = match filter.sort_order.as_deref() {
        Some("asc") => "ASC",
        _ => "DESC",
    };
    sql.push_str(&format!(" ORDER BY {} {}", sort_col, sort_order));

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    let rows = stmt
        .query_map(param_refs.as_slice(), |row| {
            Ok(RepairWithCustomer {
                repair: Repair {
                    id: row.get(0)?,
                    customer_id: row.get(1)?,
                    status: row.get(2)?,
                    device_type: row.get(3)?,
                    brand: row.get(4)?,
                    model: row.get(5)?,
                    serial_number: row.get(6)?,
                    color_desc: row.get(7)?,
                    reported_problem: row.get(8)?,
                    technician_id: row.get(9)?,
                    tech_findings: row.get(10)?,
                    recommended_action: row.get(11)?,
                    parts_required: row.get(12)?,
                    estimated_cost: row.get(13)?,
                    repair_notes: row.get(14)?,
                    parts_used: row.get(15)?,
                    received_at: row.get(16)?,
                    updated_at: row.get(17)?,
                    completed_at: row.get(18)?,
                },
                customer_name: row.get(19)?,
                customer_phone: row.get(20)?,
                customer_address: row.get(21)?,
                customer_type: row.get(22)?,
                technician_name: row.get(23)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut repairs = Vec::new();
    for row in rows {
        repairs.push(row.map_err(|e| e.to_string())?);
    }
    Ok(repairs)
}

pub(crate) fn update_repair_status_inner(
    conn: &Connection,
    input: &UpdateStatusInput,
) -> Result<(), String> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    println!("Updating repair status: repair_id={}, new_status={}", input.repair_id, input.new_status);

    conn.execute(
        "UPDATE repairs SET status = ?, updated_at = ? WHERE id = ?",
        rusqlite::params![input.new_status, now, input.repair_id],
    )
    .map_err(|e| e.to_string())?;

    println!("Inserting repair history for repair_id={}", input.repair_id);
    conn.execute(
        "INSERT INTO repair_history (repair_id, status, note, changed_at) VALUES (?, ?, ?, ?)",
        rusqlite::params![input.repair_id, input.new_status, input.note, now],
    )
    .map_err(|e| e.to_string())?;

    if input.new_status == "Completed" {
        conn.execute(
            "UPDATE repairs SET completed_at = ? WHERE id = ?",
            rusqlite::params![now, input.repair_id],
        )
        .map_err(|e| e.to_string())?;
    }

    println!("Status update completed successfully");
    Ok(())
}

pub(crate) fn update_technician_fields_inner(
    conn: &Connection,
    input: &UpdateTechnicianFieldsInput,
) -> Result<(), String> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let old: Vec<(String, Option<String>)> = conn
        .prepare(
            "SELECT tech_findings, recommended_action, parts_required, estimated_cost, repair_notes, parts_used FROM repairs WHERE id = ?",
        )
        .map_err(|e| e.to_string())?
        .query_row([&input.repair_id], |row| {
            Ok(vec![
                ("tech_findings".into(), row.get::<_, Option<String>>(0)?),
                ("recommended_action".into(), row.get::<_, Option<String>>(1)?),
                ("parts_required".into(), row.get::<_, Option<String>>(2)?),
                ("estimated_cost".into(), row.get::<_, Option<String>>(3)?.map(|v| v.to_string())),
                ("repair_notes".into(), row.get::<_, Option<String>>(4)?),
                ("parts_used".into(), row.get::<_, Option<String>>(5)?),
            ])
        })
        .map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE repairs SET technician_id = ?, tech_findings = ?, recommended_action = ?, parts_required = ?, estimated_cost = ?, repair_notes = ?, parts_used = ?, updated_at = ? WHERE id = ?",
        rusqlite::params![input.technician_id, input.tech_findings, input.recommended_action, input.parts_required, input.estimated_cost, input.repair_notes, input.parts_used, now, input.repair_id],
    ).map_err(|e| e.to_string())?;

    let new_vals: Vec<(&str, Option<String>)> = vec![
        ("tech_findings", input.tech_findings.clone()),
        ("recommended_action", input.recommended_action.clone()),
        ("parts_required", input.parts_required.clone()),
        (
            "estimated_cost",
            input.estimated_cost.map(|v| v.to_string()),
        ),
        ("repair_notes", input.repair_notes.clone()),
        ("parts_used", input.parts_used.clone()),
    ];

    for (field_name, old_val) in old {
        if let Some((_, new_val)) = new_vals.iter().find(|(name, _)| *name == field_name) {
            if old_val.as_deref() != new_val.as_deref() {
                audit::insert_audit_entry(
                    conn,
                    &input.repair_id,
                    &field_name,
                    old_val.as_deref(),
                    new_val.as_deref(),
                )?;
            }
        }
    }

    Ok(())
}

pub(crate) fn get_repair_history_inner(
    conn: &Connection,
    repair_id: &str,
) -> Result<Vec<RepairHistory>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, repair_id, status, note, changed_at FROM repair_history WHERE repair_id = ? ORDER BY changed_at DESC, id DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([repair_id], |row| {
            Ok(RepairHistory {
                id: row.get(0)?,
                repair_id: row.get(1)?,
                status: row.get(2)?,
                note: row.get(3)?,
                changed_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut history = Vec::new();
    for row in rows {
        history.push(row.map_err(|e| e.to_string())?);
    }
    Ok(history)
}

#[derive(Debug, Serialize)]
pub struct DashboardCounts {
    pub open_repairs: i64,
    pub awaiting_approval: i64,
    pub repairing: i64,
    pub ready_for_collection: i64,
}

pub(crate) fn get_dashboard_counts_inner(conn: &Connection) -> Result<DashboardCounts, String> {
    let open: i64 = conn.query_row(
        "SELECT COUNT(*) FROM repairs WHERE status NOT IN ('Completed', 'Declined', 'Cancelled', 'Closed')",
        [], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let awaiting: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM repairs WHERE status = 'Awaiting Approval'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let repairing: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM repairs WHERE status = 'Repairing'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let ready: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM repairs WHERE status = 'Ready for Collection'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(DashboardCounts {
        open_repairs: open,
        awaiting_approval: awaiting,
        repairing,
        ready_for_collection: ready,
    })
}

#[tauri::command]
pub fn generate_new_repair_id(token: String, db: State<Database>) -> Result<String, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    generate_repair_id_inner(&conn)
}

#[tauri::command]
pub fn create_repair(input: CreateRepairInput, token: String, db: State<Database>) -> Result<Repair, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    create_repair_inner(&conn, &input)
}

#[tauri::command]
pub fn get_repair(id: String, token: String, db: State<Database>) -> Result<Option<RepairWithCustomer>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    get_repair_inner(&conn, &id)
}

#[tauri::command]
pub fn list_repairs(
    filter: RepairFilter,
    token: String, db: State<Database>,
) -> Result<Vec<RepairWithCustomer>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    list_repairs_inner(&conn, &filter)
}

#[tauri::command]
pub fn update_repair_status(input: UpdateStatusInput, token: String, db: State<Database>) -> Result<(), String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    update_repair_status_inner(&conn, &input)
}

#[tauri::command]
pub fn update_technician_fields(
    input: UpdateTechnicianFieldsInput,
    token: String, db: State<Database>,
) -> Result<(), String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    update_technician_fields_inner(&conn, &input)
}

#[tauri::command]
pub fn get_repair_history(
    repair_id: String,
    token: String, db: State<Database>,
) -> Result<Vec<RepairHistory>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    get_repair_history_inner(&conn, &repair_id)
}

#[tauri::command]
pub fn get_dashboard_counts(token: String, db: State<Database>) -> Result<DashboardCounts, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    get_dashboard_counts_inner(&conn)
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
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL CHECK(type IN ('individual','business')),
                name TEXT NOT NULL,
                phone TEXT UNIQUE NOT NULL,
                email TEXT,
                company_name TEXT,
                address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE technicians (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT,
                active INTEGER DEFAULT 1
            );
            CREATE TABLE shop_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE TABLE repairs (
                id TEXT PRIMARY KEY,
                customer_id INTEGER NOT NULL REFERENCES customers(id),
                status TEXT NOT NULL DEFAULT 'Received',
                device_type TEXT,
                brand TEXT NOT NULL,
                model TEXT,
                serial_number TEXT,
                color_desc TEXT,
                reported_problem TEXT NOT NULL,
                technician_id INTEGER REFERENCES technicians(id),
                tech_findings TEXT,
                recommended_action TEXT,
                parts_required TEXT,
                estimated_cost REAL,
                repair_notes TEXT,
                parts_used TEXT,
                received_at DATETIME NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME
            );
            CREATE TABLE repair_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL REFERENCES repairs(id),
                status TEXT NOT NULL,
                note TEXT,
                changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE repair_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL REFERENCES repairs(id),
                description TEXT NOT NULL,
                device_name TEXT,
                serial_number TEXT,
                qty INTEGER NOT NULL DEFAULT 1,
                unit_price REAL NOT NULL DEFAULT 0
            );
            CREATE TABLE field_audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL REFERENCES repairs(id),
                field_name TEXT NOT NULL,
                old_value TEXT,
                new_value TEXT,
                changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
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

    fn seed_customer(conn: &Connection, suffix: &str) -> i64 {
        conn.execute(
            &format!("INSERT INTO customers (type, name, phone) VALUES ('individual', 'Alice{suffix}', '0123456789{suffix}')"),
            [],
        ).unwrap();
        conn.last_insert_rowid()
    }

    fn seed_technician(conn: &Connection) -> i64 {
        conn.execute(
            "INSERT INTO technicians (name, phone) VALUES ('John', '011-1111')",
            [],
        )
        .unwrap();
        conn.last_insert_rowid()
    }

    static REPAIR_COUNTER: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);

    fn seed_repair(conn: &Connection) -> Repair {
        let n = REPAIR_COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
        let cust_id = seed_customer(conn, &n.to_string());
        create_repair_inner(
            conn,
            &CreateRepairInput {
                customer_id: cust_id,
                device_type: Some("Laptop".into()),
                brand: "Dell".into(),
                model: Some("Inspiron".into()),
                serial_number: Some("SN123".into()),
                color_desc: Some("Black".into()),
                reported_problem: "Won't boot".into(),
            },
        )
        .unwrap()
    }

    mod generate_repair_id {
        use super::*;

        #[test]
        fn should_start_at_00001_for_first_repair() {
            let conn = setup();
            let id = generate_repair_id_inner(&conn).unwrap();
            assert!(id.starts_with("00001/"), "expected 00001, got {id}");
        }

        #[test]
        fn increment_on_subsequent_calls_same_day() {
            let conn = setup();
            let id1 = generate_repair_id_inner(&conn).unwrap();
            let id2 = generate_repair_id_inner(&conn).unwrap();
            assert_ne!(id1, id2, "IDs should be different");
            let num1: u32 = id1[..5].parse().unwrap();
            let num2: u32 = id2[..5].parse().unwrap();
            assert_eq!(num2, num1 + 1);
        }
    }

    mod create_repair {
        use super::*;

        #[test]
        fn should_insert_row_and_return_repair() {
            let conn = setup();
            let repair = seed_repair(&conn);
            assert!(repair.id.starts_with("00001/"), "got id: {}", repair.id);
            assert_eq!(repair.status, "Received");
            assert_eq!(repair.brand, Some("Dell".into()));
        }

        #[test]
        fn should_insert_history_entry() {
            let conn = setup();
            let repair = seed_repair(&conn);
            let history = get_repair_history_inner(&conn, &repair.id).unwrap();
            assert_eq!(history.len(), 1);
            assert_eq!(history[0].status, "Received");
        }
    }

    mod get_repair {
        use super::*;

        #[test]
        fn should_return_repair_with_customer_info() {
            let conn = setup();
            let repair = seed_repair(&conn);

            let found = get_repair_inner(&conn, &repair.id).unwrap();
            assert!(found.is_some());
            let rwc = found.unwrap();
            assert!(
                rwc.customer_name.starts_with("Alice"),
                "expected Alice*, got {}",
                rwc.customer_name
            );
            assert!(
                rwc.customer_phone.starts_with("0123456789"),
                "expected 0123456789*, got {}",
                rwc.customer_phone
            );
            assert_eq!(rwc.repair.brand, Some("Dell".into()));
        }

        #[test]
        fn should_return_none_for_missing_id() {
            let conn = setup();
            let found = get_repair_inner(&conn, "99999/99/99").unwrap();
            assert!(found.is_none());
        }
    }

    mod list_repairs {
        use super::*;

        #[test]
        fn should_return_empty_when_no_repairs() {
            let conn = setup();
            let list = list_repairs_inner(
                &conn,
                &RepairFilter {
                    search: None,
                    status: None,
                    technician_id: None,
                    customer_type: None,
                    date_from: None,
                    date_to: None,
                    sort_by: None,
                    sort_order: None,
                },
            )
            .unwrap();
            assert!(list.is_empty());
        }

        #[test]
        fn should_return_all_repairs_with_no_filters() {
            let conn = setup();
            seed_repair(&conn);
            seed_repair(&conn);

            let list = list_repairs_inner(
                &conn,
                &RepairFilter {
                    search: None,
                    status: None,
                    technician_id: None,
                    customer_type: None,
                    date_from: None,
                    date_to: None,
                    sort_by: None,
                    sort_order: None,
                },
            )
            .unwrap();
            assert_eq!(list.len(), 2);
        }

        #[test]
        fn should_filter_by_search_text() {
            let conn = setup();
            seed_repair(&conn);

            let list = list_repairs_inner(
                &conn,
                &RepairFilter {
                    search: Some("Alice".into()),
                    status: None,
                    technician_id: None,
                    customer_type: None,
                    date_from: None,
                    date_to: None,
                    sort_by: None,
                    sort_order: None,
                },
            )
            .unwrap();
            assert_eq!(list.len(), 1, "should find Alice");

            let list = list_repairs_inner(
                &conn,
                &RepairFilter {
                    search: Some("Nobody".into()),
                    status: None,
                    technician_id: None,
                    customer_type: None,
                    date_from: None,
                    date_to: None,
                    sort_by: None,
                    sort_order: None,
                },
            )
            .unwrap();
            assert!(list.is_empty(), "should not find Nobody");
        }

        #[test]
        fn should_filter_by_status() {
            let conn = setup();
            seed_repair(&conn);

            let list = list_repairs_inner(
                &conn,
                &RepairFilter {
                    search: None,
                    status: Some(vec!["Received".into()]),
                    technician_id: None,
                    customer_type: None,
                    date_from: None,
                    date_to: None,
                    sort_by: None,
                    sort_order: None,
                },
            )
            .unwrap();
            assert_eq!(list.len(), 1);

            let list = list_repairs_inner(
                &conn,
                &RepairFilter {
                    search: None,
                    status: Some(vec!["Completed".into()]),
                    technician_id: None,
                    customer_type: None,
                    date_from: None,
                    date_to: None,
                    sort_by: None,
                    sort_order: None,
                },
            )
            .unwrap();
            assert!(list.is_empty());
        }
    }

    mod update_repair_status {
        use super::*;

        #[test]
        fn should_change_status_and_add_history() {
            let conn = setup();
            let repair = seed_repair(&conn);

            update_repair_status_inner(
                &conn,
                &UpdateStatusInput {
                    repair_id: repair.id.clone(),
                    new_status: "Repairing".into(),
                    note: Some("Started work".into()),
                },
            )
            .unwrap();

            let found = get_repair_inner(&conn, &repair.id).unwrap().unwrap();
            assert_eq!(found.repair.status, "Repairing");

            let history = get_repair_history_inner(&conn, &repair.id).unwrap();
            assert_eq!(history.len(), 2);
            assert_eq!(history[0].status, "Repairing");
            assert_eq!(history[0].note.as_deref(), Some("Started work"));
        }

        #[test]
        fn should_set_completed_at_when_completed() {
            let conn = setup();
            let repair = seed_repair(&conn);

            update_repair_status_inner(
                &conn,
                &UpdateStatusInput {
                    repair_id: repair.id.clone(),
                    new_status: "Repairing".into(),
                    note: None,
                },
            )
            .unwrap();
            update_repair_status_inner(
                &conn,
                &UpdateStatusInput {
                    repair_id: repair.id.clone(),
                    new_status: "Ready for Collection".into(),
                    note: None,
                },
            )
            .unwrap();
            update_repair_status_inner(
                &conn,
                &UpdateStatusInput {
                    repair_id: repair.id.clone(),
                    new_status: "Completed".into(),
                    note: None,
                },
            )
            .unwrap();

            let found = get_repair_inner(&conn, &repair.id).unwrap().unwrap();
            assert_eq!(found.repair.status, "Completed");
            assert!(
                found.repair.completed_at.is_some(),
                "completed_at should be set"
            );
        }
    }

    mod update_technician_fields {
        use super::*;

        #[test]
        fn should_update_all_fields() {
            let conn = setup();
            let repair = seed_repair(&conn);
            let tech_id = seed_technician(&conn);

            update_technician_fields_inner(
                &conn,
                &UpdateTechnicianFieldsInput {
                    repair_id: repair.id.clone(),
                    technician_id: Some(tech_id),
                    tech_findings: Some("Found faulty RAM".into()),
                    recommended_action: Some("Replace RAM module".into()),
                    parts_required: Some("DDR4 8GB".into()),
                    estimated_cost: Some(150.0),
                    repair_notes: Some("Replaced RAM, testing".into()),
                    parts_used: Some("1x DDR4 8GB".into()),
                },
            )
            .unwrap();

            let found = get_repair_inner(&conn, &repair.id).unwrap().unwrap();
            assert_eq!(found.technician_name, Some("John".into()));
            assert_eq!(
                found.repair.tech_findings.as_deref(),
                Some("Found faulty RAM")
            );
            assert_eq!(
                found.repair.recommended_action.as_deref(),
                Some("Replace RAM module")
            );
            assert_eq!(found.repair.parts_required.as_deref(), Some("DDR4 8GB"));
            assert_eq!(found.repair.estimated_cost, Some(150.0));
        }
    }

    mod get_repair_history {
        use super::*;

        #[test]
        fn should_return_ordered_by_changed_at_desc() {
            let conn = setup();
            let repair = seed_repair(&conn);

            update_repair_status_inner(
                &conn,
                &UpdateStatusInput {
                    repair_id: repair.id.clone(),
                    new_status: "Repairing".into(),
                    note: None,
                },
            )
            .unwrap();
            update_repair_status_inner(
                &conn,
                &UpdateStatusInput {
                    repair_id: repair.id.clone(),
                    new_status: "Ready for Collection".into(),
                    note: None,
                },
            )
            .unwrap();

            let history = get_repair_history_inner(&conn, &repair.id).unwrap();
            assert_eq!(history.len(), 3);
            assert_eq!(history[0].status, "Ready for Collection");
            assert_eq!(history[2].status, "Received");
        }
    }

    mod get_dashboard_counts {
        use super::*;

        #[test]
        fn should_reflect_current_repair_state() {
            let conn = setup();
            let r1 = seed_repair(&conn);
            let r2 = seed_repair(&conn);

            update_repair_status_inner(
                &conn,
                &UpdateStatusInput {
                    repair_id: r1.id.clone(),
                    new_status: "Repairing".into(),
                    note: None,
                },
            )
            .unwrap();
            update_repair_status_inner(
                &conn,
                &UpdateStatusInput {
                    repair_id: r2.id.clone(),
                    new_status: "Ready for Collection".into(),
                    note: None,
                },
            )
            .unwrap();

            let counts = get_dashboard_counts_inner(&conn).unwrap();
            assert_eq!(counts["open_repairs"], 2);
            assert_eq!(counts["repairing"], 1);
            assert_eq!(counts["ready_for_collection"], 1);
            assert_eq!(counts["awaiting_approval"], 0);
        }
    }
}
