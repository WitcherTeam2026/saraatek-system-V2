use crate::db::Database;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Customer {
    pub id: i64,
    pub r#type: String,
    pub name: String,
    pub phone: String,
    pub email: Option<String>,
    pub company_name: Option<String>,
    pub address: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCustomerInput {
    pub r#type: String,
    pub name: String,
    pub phone: String,
    pub email: Option<String>,
    pub company_name: Option<String>,
}

pub(crate) fn search_customer_inner(
    conn: &Connection,
    phone: &str,
) -> Result<Option<Customer>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, type, name, phone, email, company_name, address, created_at FROM customers WHERE phone = ?"
    ).map_err(|e| e.to_string())?;

    let result = stmt.query_row([phone], |row| {
        Ok(Customer {
            id: row.get(0)?,
            r#type: row.get(1)?,
            name: row.get(2)?,
            phone: row.get(3)?,
            email: row.get(4)?,
            company_name: row.get(5)?,
            address: row.get(6)?,
            created_at: row.get(7)?,
        })
    });

    match result {
        Ok(customer) => Ok(Some(customer)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

pub(crate) fn create_customer_inner(
    conn: &Connection,
    input: &CreateCustomerInput,
) -> Result<Customer, String> {
    conn.execute(
        "INSERT INTO customers (type, name, phone, email, company_name) VALUES (?, ?, ?, ?, ?)",
        rusqlite::params![
            input.r#type,
            input.name,
            input.phone,
            input.email,
            input.company_name
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    // Auto-sync business customers to companies table
    if input.r#type == "business" {
        let company_exists: bool = conn
            .query_row(
                "SELECT COUNT(*) FROM companies WHERE phone = ?",
                rusqlite::params![input.phone],
                |row| row.get(0),
            )
            .unwrap_or(0)
            > 0;

        if !company_exists {
            conn.execute(
                "INSERT INTO companies (name, phone, email, address) VALUES (?, ?, ?, ?)",
                rusqlite::params![
                    input.company_name.as_deref().unwrap_or(&input.name),
                    input.phone,
                    input.email,
                    None::<String>,
                ],
            )
            .map_err(|e| e.to_string())?;
        }
    }

    let mut stmt = conn.prepare(
        "SELECT id, type, name, phone, email, company_name, address, created_at FROM customers WHERE id = ?"
    ).map_err(|e| e.to_string())?;

    stmt.query_row([id], |row| {
        Ok(Customer {
            id: row.get(0)?,
            r#type: row.get(1)?,
            name: row.get(2)?,
            phone: row.get(3)?,
            email: row.get(4)?,
            company_name: row.get(5)?,
            address: row.get(6)?,
            created_at: row.get(7)?,
        })
    })
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_customer(phone: String, db: State<Database>) -> Result<Option<Customer>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    search_customer_inner(&conn, &phone)
}

#[tauri::command]
pub fn create_customer(
    input: CreateCustomerInput,
    db: State<Database>,
) -> Result<Customer, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    create_customer_inner(&conn, &input)
}

pub(crate) fn update_customer_address_inner(
    conn: &Connection,
    customer_id: i64,
    address: &str,
) -> Result<Customer, String> {
    let changed = conn
        .execute(
            "UPDATE customers SET address = ? WHERE id = ?",
            rusqlite::params![address, customer_id],
        )
        .map_err(|e| e.to_string())?;
    if changed == 0 {
        return Err(format!("Customer {customer_id} not found"));
    }

    let mut stmt = conn.prepare(
        "SELECT id, type, name, phone, email, company_name, address, created_at FROM customers WHERE id = ?"
    ).map_err(|e| e.to_string())?;

    stmt.query_row([customer_id], |row| {
        Ok(Customer {
            id: row.get(0)?,
            r#type: row.get(1)?,
            name: row.get(2)?,
            phone: row.get(3)?,
            email: row.get(4)?,
            company_name: row.get(5)?,
            address: row.get(6)?,
            created_at: row.get(7)?,
        })
    })
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_customer_address(
    customer_id: i64,
    address: String,
    db: State<Database>,
) -> Result<Customer, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    update_customer_address_inner(&conn, customer_id, &address)
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
            );",
        )
        .unwrap();
        conn
    }

    fn seed_customer(conn: &Connection) -> Customer {
        create_customer_inner(
            conn,
            &CreateCustomerInput {
                r#type: "individual".into(),
                name: "Alice".into(),
                phone: "0123456789".into(),
                email: Some("alice@test.com".into()),
                company_name: None,
            },
        )
        .unwrap()
    }

    #[test]
    fn search_should_return_customer_when_phone_matches() {
        let conn = setup();
        let created = seed_customer(&conn);

        let found = search_customer_inner(&conn, "0123456789").unwrap();

        assert!(found.is_some(), "expected customer to be found");
        assert_eq!(found.unwrap().id, created.id);
    }

    #[test]
    fn search_should_return_none_when_phone_not_found() {
        let conn = setup();
        seed_customer(&conn);

        let found = search_customer_inner(&conn, "9999999999").unwrap();

        assert!(found.is_none(), "expected no customer for unknown phone");
    }

    #[test]
    fn create_should_return_customer_with_generated_id() {
        let conn = setup();

        let customer = seed_customer(&conn);

        assert!(customer.id > 0);
        assert_eq!(customer.name, "Alice");
        assert_eq!(customer.phone, "0123456789");
    }

    #[test]
    fn update_address_should_set_customer_address() {
        let conn = setup();
        let customer = seed_customer(&conn);

        let updated =
            update_customer_address_inner(&conn, customer.id, "123 Main St, Colombo").unwrap();

        assert_eq!(updated.address.as_deref(), Some("123 Main St, Colombo"));
    }

    #[test]
    fn update_address_should_error_for_nonexistent_customer() {
        let conn = setup();

        let result = update_customer_address_inner(&conn, 999, "Some Address");

        assert!(result.is_err(), "should error for nonexistent customer");
    }

    #[test]
    fn create_should_error_on_duplicate_phone() {
        let conn = setup();
        seed_customer(&conn);

        let result = create_customer_inner(
            &conn,
            &CreateCustomerInput {
                r#type: "individual".into(),
                name: "Bob".into(),
                phone: "0123456789".into(),
                email: None,
                company_name: None,
            },
        );

        assert!(result.is_err(), "duplicate phone should error");
    }
}
