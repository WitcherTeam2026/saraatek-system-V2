use crate::db::Database;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Company {
    pub id: i64,
    pub name: String,
    pub phone: String,
    pub email: Option<String>,
    pub address: Option<String>,
    pub tax_id: Option<String>,
    pub registration_number: Option<String>,
    pub website: Option<String>,
    pub industry: Option<String>,
    pub notes: Option<String>,
    pub tags: Option<String>,
    pub credit_terms: Option<String>,
    pub credit_limit: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCompanyInput {
    pub name: String,
    pub phone: String,
    pub email: Option<String>,
    pub address: Option<String>,
    pub tax_id: Option<String>,
    pub registration_number: Option<String>,
    pub website: Option<String>,
    pub industry: Option<String>,
    pub notes: Option<String>,
    pub tags: Option<String>,
    pub credit_terms: Option<String>,
    pub credit_limit: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCompanyInput {
    pub id: i64,
    pub name: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub tax_id: Option<String>,
    pub registration_number: Option<String>,
    pub website: Option<String>,
    pub industry: Option<String>,
    pub notes: Option<String>,
    pub tags: Option<String>,
    pub credit_terms: Option<String>,
    pub credit_limit: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CompanyFilter {
    pub search: Option<String>,
    pub industry: Option<String>,
    pub tags: Option<String>,
}

#[tauri::command]
pub fn create_company(input: CreateCompanyInput, token: String, db: State<Database>) -> Result<Company, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    conn.execute(
        "INSERT INTO companies (name, phone, email, address, tax_id, registration_number, website, industry, notes, tags, credit_terms, credit_limit) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            input.name,
            input.phone,
            input.email,
            input.address,
            input.tax_id,
            input.registration_number,
            input.website,
            input.industry,
            input.notes,
            input.tags,
            input.credit_terms,
            input.credit_limit.unwrap_or(0.0),
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    get_company_by_id(id, &conn)
}

#[tauri::command]
pub fn update_company(input: UpdateCompanyInput, token: String, db: State<Database>) -> Result<Company, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;

    if let Some(name) = input.name {
        conn.execute(
            "UPDATE companies SET name = ?1 WHERE id = ?2",
            params![name, input.id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(phone) = input.phone {
        conn.execute(
            "UPDATE companies SET phone = ?1 WHERE id = ?2",
            params![phone, input.id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(email) = input.email {
        conn.execute(
            "UPDATE companies SET email = ?1 WHERE id = ?2",
            params![email, input.id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(address) = input.address {
        conn.execute(
            "UPDATE companies SET address = ?1 WHERE id = ?2",
            params![address, input.id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(tax_id) = input.tax_id {
        conn.execute(
            "UPDATE companies SET tax_id = ?1 WHERE id = ?2",
            params![tax_id, input.id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(registration_number) = input.registration_number {
        conn.execute(
            "UPDATE companies SET registration_number = ?1 WHERE id = ?2",
            params![registration_number, input.id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(website) = input.website {
        conn.execute(
            "UPDATE companies SET website = ?1 WHERE id = ?2",
            params![website, input.id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(industry) = input.industry {
        conn.execute(
            "UPDATE companies SET industry = ?1 WHERE id = ?2",
            params![industry, input.id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(notes) = input.notes {
        conn.execute(
            "UPDATE companies SET notes = ?1 WHERE id = ?2",
            params![notes, input.id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(tags) = input.tags {
        conn.execute(
            "UPDATE companies SET tags = ?1 WHERE id = ?2",
            params![tags, input.id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(credit_terms) = input.credit_terms {
        conn.execute(
            "UPDATE companies SET credit_terms = ?1 WHERE id = ?2",
            params![credit_terms, input.id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(credit_limit) = input.credit_limit {
        conn.execute(
            "UPDATE companies SET credit_limit = ?1 WHERE id = ?2",
            params![credit_limit, input.id],
        )
        .map_err(|e| e.to_string())?;
    }

    conn.execute(
        "UPDATE companies SET updated_at = CURRENT_TIMESTAMP WHERE id = ?1",
        params![input.id],
    )
    .map_err(|e| e.to_string())?;

    get_company_by_id(input.id, &conn)
}

#[tauri::command]
pub fn list_companies(filter: CompanyFilter, token: String, db: State<Database>) -> Result<Vec<Company>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    let mut query = "SELECT * FROM companies WHERE 1=1".to_string();

    if let Some(search) = filter.search {
        if !search.is_empty() {
            query.push_str(&format!(
                " AND (name LIKE '%{}%' OR phone LIKE '%{}%' OR email LIKE '%{}%')",
                search, search, search
            ));
        }
    }
    if let Some(industry) = filter.industry {
        if !industry.is_empty() {
            query.push_str(&format!(" AND industry = '{}'", industry));
        }
    }
    if let Some(tags) = filter.tags {
        if !tags.is_empty() {
            query.push_str(&format!(" AND tags LIKE '%{}%'", tags));
        }
    }

    query.push_str(" ORDER BY name ASC");

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let companies = stmt
        .query_map([], |row| {
            Ok(Company {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                email: row.get(3)?,
                address: row.get(4)?,
                tax_id: row.get(5)?,
                registration_number: row.get(6)?,
                website: row.get(7)?,
                industry: row.get(8)?,
                notes: row.get(9)?,
                tags: row.get(10)?,
                credit_terms: row.get(11)?,
                credit_limit: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(companies)
}

#[tauri::command]
pub fn get_company(id: i64, token: String, db: State<Database>) -> Result<Option<Company>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    get_company_by_id(id, &conn).map(Some)
}

fn get_company_by_id(id: i64, conn: &rusqlite::Connection) -> Result<Company, String> {
    conn.query_row(
        "SELECT * FROM companies WHERE id = ?1",
        params![id],
        |row| {
            Ok(Company {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                email: row.get(3)?,
                address: row.get(4)?,
                tax_id: row.get(5)?,
                registration_number: row.get(6)?,
                website: row.get(7)?,
                industry: row.get(8)?,
                notes: row.get(9)?,
                tags: row.get(10)?,
                credit_terms: row.get(11)?,
                credit_limit: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_company_by_phone(
    phone: String,
    token: String, db: State<Database>,
) -> Result<Option<Company>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    let result = conn.query_row(
        "SELECT * FROM companies WHERE phone = ?1",
        params![phone],
        |row| {
            Ok(Company {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                email: row.get(3)?,
                address: row.get(4)?,
                tax_id: row.get(5)?,
                registration_number: row.get(6)?,
                website: row.get(7)?,
                industry: row.get(8)?,
                notes: row.get(9)?,
                tags: row.get(10)?,
                credit_terms: row.get(11)?,
                credit_limit: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        },
    );

    match result {
        Ok(company) => Ok(Some(company)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn delete_company(id: i64, token: String, db: State<Database>) -> Result<(), String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    conn.execute("DELETE FROM companies WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn setup() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys=ON;").unwrap();
        conn.execute_batch(
            "CREATE TABLE companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT UNIQUE NOT NULL,
                email TEXT,
                address TEXT,
                tax_id TEXT,
                registration_number TEXT,
                website TEXT,
                industry TEXT,
                notes TEXT,
                tags TEXT,
                credit_terms TEXT,
                credit_limit REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );",
        )
        .unwrap();
        conn
    }

    #[test]
    fn test_create_company() {
        let conn = setup();
        conn.execute(
            "INSERT INTO companies (name, phone) VALUES ('Test Corp', '0771234567')",
            [],
        )
        .unwrap();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM companies", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 1);
    }
}
