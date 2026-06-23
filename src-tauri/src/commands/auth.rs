use crate::db::Database;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub name: String,
    pub role: String,
    pub is_active: bool,
    pub last_login: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Session {
    pub id: i64,
    pub user_id: i64,
    pub token: String,
    pub expires_at: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginInput {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserInput {
    pub username: String,
    pub password: String,
    pub name: String,
    pub role: Option<String>,
    pub pin: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct LoginResult {
    pub user: User,
    pub session: Session,
}

// Simple password hashing (for demo - use bcrypt in production)
fn hash_password(password: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    password.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

fn verify_password(password: &str, hash: &str) -> bool {
    hash_password(password) == hash
}

#[tauri::command]
pub fn login(input: LoginInput, db: State<Database>) -> Result<LoginResult, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Find user
    let user = conn.query_row(
        "SELECT id, username, name, role, is_active, last_login, created_at FROM users WHERE username = ?1",
        params![input.username],
        |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                name: row.get(2)?,
                role: row.get(3)?,
                is_active: row.get::<_, i32>(4)? == 1,
                last_login: row.get(5)?,
                created_at: row.get(6)?,
            })
        },
    )
    .map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => "Invalid username or password".to_string(),
        _ => e.to_string(),
    })?;

    if !user.is_active {
        return Err("Account is disabled".to_string());
    }

    // Verify password
    let stored_hash: String = conn.query_row(
        "SELECT password_hash FROM users WHERE username = ?1",
        params![input.username],
        |row| row.get(0),
    )
    .map_err(|e| e.to_string())?;

    if !verify_password(&input.password, &stored_hash) {
        return Err("Invalid username or password".to_string());
    }

    // Create session
    let token = format!("{}-{}", user.id, chrono::Local::now().timestamp());
    let expires_at = chrono::Local::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .unwrap()
        .format("%Y-%m-%d %H:%M:%S")
        .to_string();

    conn.execute(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES (?1, ?2, ?3)",
        params![user.id, token, expires_at],
    )
    .map_err(|e| e.to_string())?;

    // Update last login
    conn.execute(
        "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?1",
        params![user.id],
    )
    .map_err(|e| e.to_string())?;

    let session_id = conn.last_insert_rowid();
    let user_clone = user.clone();

    Ok(LoginResult {
        user: user_clone,
        session: Session {
            id: session_id,
            user_id: user.id,
            token,
            expires_at,
            created_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        },
    })
}

#[tauri::command]
pub fn logout(token: String, db: State<Database>) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM sessions WHERE token = ?1", params![token])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn create_user(input: CreateUserInput, db: State<Database>) -> Result<User, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let password_hash = hash_password(&input.password);
    let role = input.role.unwrap_or_else(|| "technician".to_string());

    conn.execute(
        "INSERT INTO users (username, password_hash, name, role, pin) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![input.username, password_hash, input.name, role, input.pin],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    conn.query_row(
        "SELECT id, username, name, role, is_active, last_login, created_at FROM users WHERE id = ?1",
        params![id],
        |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                name: row.get(2)?,
                role: row.get(3)?,
                is_active: row.get::<_, i32>(4)? == 1,
                last_login: row.get(5)?,
                created_at: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_users(db: State<Database>) -> Result<Vec<User>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, username, name, role, is_active, last_login, created_at FROM users ORDER BY name")
        .map_err(|e| e.to_string())?;

    let users = stmt
        .query_map([], |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                name: row.get(2)?,
                role: row.get(3)?,
                is_active: row.get::<_, i32>(4)? == 1,
                last_login: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(users)
}

#[tauri::command]
pub fn update_user(
    id: i64,
    name: Option<String>,
    role: Option<String>,
    is_active: Option<bool>,
    db: State<Database>,
) -> Result<User, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    if let Some(name) = name {
        conn.execute("UPDATE users SET name = ?1 WHERE id = ?2", params![name, id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(role) = role {
        conn.execute("UPDATE users SET role = ?1 WHERE id = ?2", params![role, id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(is_active) = is_active {
        conn.execute("UPDATE users SET is_active = ?1 WHERE id = ?2", params![is_active as i32, id])
            .map_err(|e| e.to_string())?;
    }

    conn.query_row(
        "SELECT id, username, name, role, is_active, last_login, created_at FROM users WHERE id = ?1",
        params![id],
        |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                name: row.get(2)?,
                role: row.get(3)?,
                is_active: row.get::<_, i32>(4)? == 1,
                last_login: row.get(5)?,
                created_at: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_user(id: i64, db: State<Database>) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM sessions WHERE user_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM users WHERE id = ?1", params![id])
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
            "CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'technician',
                pin TEXT,
                is_active INTEGER DEFAULT 1,
                last_login DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                token TEXT UNIQUE NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );",
        )
        .unwrap();
        conn
    }

    #[test]
    fn test_hash_password() {
        let hash = hash_password("test123");
        assert!(verify_password("test123", &hash));
        assert!(!verify_password("wrong", &hash));
    }
}
