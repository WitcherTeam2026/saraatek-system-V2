use crate::db::Database;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocumentTemplate {
    pub id: i64,
    pub name: String,
    pub template_type: String,
    pub content: String,
    pub is_default: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocumentVersion {
    pub id: i64,
    pub document_type: String,
    pub document_id: i64,
    pub version: i64,
    pub content: String,
    pub changes: Option<String>,
    pub created_by: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Signature {
    pub id: i64,
    pub repair_id: Option<String>,
    pub customer_name: String,
    pub signature_data: String,
    pub signed_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LetterheadSettings {
    pub id: i64,
    pub logo_path: Option<String>,
    pub company_name: Option<String>,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub website: Option<String>,
    pub primary_color: String,
    pub secondary_color: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTemplateInput {
    pub name: String,
    pub template_type: String,
    pub content: String,
    pub is_default: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct SaveSignatureInput {
    pub repair_id: Option<String>,
    pub customer_name: String,
    pub signature_data: String,
}

// ── Templates ──────────────────────────────────────────────────────

#[tauri::command]
pub fn list_templates(token: String, db: State<Database>) -> Result<Vec<DocumentTemplate>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    let mut stmt = conn
        .prepare("SELECT id, name, type, content, is_default, created_at, updated_at FROM document_templates ORDER BY name")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(DocumentTemplate {
                id: row.get(0)?,
                name: row.get(1)?,
                template_type: row.get(2)?,
                content: row.get(3)?,
                is_default: row.get::<_, i32>(4)? == 1,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut templates = Vec::new();
    for row in rows {
        templates.push(row.map_err(|e| e.to_string())?);
    }
    Ok(templates)
}

#[tauri::command]
pub fn create_template(
    input: CreateTemplateInput,
    token: String, db: State<Database>,
) -> Result<DocumentTemplate, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "INSERT INTO document_templates (name, type, content, is_default, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)",
        params![input.name, input.template_type, input.content, input.is_default.unwrap_or(false) as i32, now],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(DocumentTemplate {
        id,
        name: input.name,
        template_type: input.template_type,
        content: input.content,
        is_default: input.is_default.unwrap_or(false),
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_template(
    id: i64,
    name: String,
    content: String,
    token: String, db: State<Database>,
) -> Result<(), String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "UPDATE document_templates SET name = ?1, content = ?2, updated_at = ?3 WHERE id = ?4",
        params![name, content, now, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_template(id: i64, token: String, db: State<Database>) -> Result<(), String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    conn.execute("DELETE FROM document_templates WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ── Signatures ─────────────────────────────────────────────────────

#[tauri::command]
pub fn save_signature(
    input: SaveSignatureInput,
    token: String, db: State<Database>,
) -> Result<Signature, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "INSERT INTO signatures (repair_id, customer_name, signature_data, signed_at) VALUES (?1, ?2, ?3, ?4)",
        params![input.repair_id, input.customer_name, input.signature_data, now],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(Signature {
        id,
        repair_id: input.repair_id,
        customer_name: input.customer_name,
        signature_data: input.signature_data,
        signed_at: now,
    })
}

#[tauri::command]
pub fn get_signature(repair_id: String, token: String, db: State<Database>) -> Result<Option<Signature>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;

    let result = conn.query_row(
        "SELECT id, repair_id, customer_name, signature_data, signed_at FROM signatures WHERE repair_id = ?1 ORDER BY signed_at DESC LIMIT 1",
        params![repair_id],
        |row| {
            Ok(Signature {
                id: row.get(0)?,
                repair_id: row.get(1)?,
                customer_name: row.get(2)?,
                signature_data: row.get(3)?,
                signed_at: row.get(4)?,
            })
        },
    );

    match result {
        Ok(sig) => Ok(Some(sig)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// ── Letterhead ─────────────────────────────────────────────────────

#[tauri::command]
pub fn get_letterhead(token: String, db: State<Database>) -> Result<LetterheadSettings, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;

    let result = conn.query_row(
        "SELECT id, logo_path, company_name, address, phone, email, website, primary_color, secondary_color FROM letterhead_settings LIMIT 1",
        [],
        |row| {
            Ok(LetterheadSettings {
                id: row.get(0)?,
                logo_path: row.get(1)?,
                company_name: row.get(2)?,
                address: row.get(3)?,
                phone: row.get(4)?,
                email: row.get(5)?,
                website: row.get(6)?,
                primary_color: row.get(7)?,
                secondary_color: row.get(8)?,
            })
        },
    );

    match result {
        Ok(settings) => Ok(settings),
        Err(_) => Ok(LetterheadSettings {
            id: 0,
            logo_path: None,
            company_name: None,
            address: None,
            phone: None,
            email: None,
            website: None,
            primary_color: "#7C4DFF".to_string(),
            secondary_color: "#3B82F6".to_string(),
        }),
    }
}

#[tauri::command]
pub fn save_letterhead(
    logo_path: Option<String>,
    company_name: Option<String>,
    address: Option<String>,
    phone: Option<String>,
    email: Option<String>,
    website: Option<String>,
    primary_color: Option<String>,
    secondary_color: Option<String>,
    token: String, db: State<Database>,
) -> Result<(), String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let exists: bool = conn
        .query_row("SELECT COUNT(*) FROM letterhead_settings", [], |row| row.get::<_, i64>(0))
        .map(|c| c > 0)
        .unwrap_or(false);

    if exists {
        conn.execute(
            "UPDATE letterhead_settings SET logo_path = ?1, company_name = ?2, address = ?3, phone = ?4, email = ?5, website = ?6, primary_color = ?7, secondary_color = ?8, updated_at = ?9",
            params![logo_path, company_name, address, phone, email, website, primary_color.unwrap_or_else(|| "#7C4DFF".to_string()), secondary_color.unwrap_or_else(|| "#3B82F6".to_string()), now],
        )
        .map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "INSERT INTO letterhead_settings (logo_path, company_name, address, phone, email, website, primary_color, secondary_color, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![logo_path, company_name, address, phone, email, website, primary_color.unwrap_or_else(|| "#7C4DFF".to_string()), secondary_color.unwrap_or_else(|| "#3B82F6".to_string()), now],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

// ── Document Versions ──────────────────────────────────────────────

#[tauri::command]
pub fn save_document_version(
    document_type: String,
    document_id: i64,
    content: String,
    changes: Option<String>,
    token: String, db: State<Database>,
) -> Result<DocumentVersion, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    // Get next version number
    let version: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) + 1 FROM document_versions WHERE document_type = ?1 AND document_id = ?2",
            params![document_type, document_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO document_versions (document_type, document_id, version, content, changes, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![document_type, document_id, version, content, changes, now],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(DocumentVersion {
        id,
        document_type,
        document_id,
        version,
        content,
        changes,
        created_by: None,
        created_at: now,
    })
}

#[tauri::command]
pub fn get_document_versions(
    document_type: String,
    document_id: i64,
    token: String, db: State<Database>,
) -> Result<Vec<DocumentVersion>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;

    let mut stmt = conn
        .prepare(
            "SELECT id, document_type, document_id, version, content, changes, created_by, created_at
             FROM document_versions WHERE document_type = ?1 AND document_id = ?2 ORDER BY version DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![document_type, document_id], |row| {
            Ok(DocumentVersion {
                id: row.get(0)?,
                document_type: row.get(1)?,
                document_id: row.get(2)?,
                version: row.get(3)?,
                content: row.get(4)?,
                changes: row.get(5)?,
                created_by: row.get(6)?,
                created_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut versions = Vec::new();
    for row in rows {
        versions.push(row.map_err(|e| e.to_string())?);
    }
    Ok(versions)
}
