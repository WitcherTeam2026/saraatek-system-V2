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
    pub must_change_password: bool,
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

#[derive(Debug, Deserialize)]
pub struct ChangePasswordInput {
    pub old_password: String,
    pub new_password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResult {
    pub user: User,
    pub session: Session,
}

fn hash_password(password: &str) -> String {
    bcrypt::hash(password, 12).expect("failed to hash password with bcrypt")
}

fn verify_password(password: &str, hash: &str) -> bool {
    bcrypt::verify(password, hash).unwrap_or(false)
}

fn is_legacy_hash(hash: &str) -> bool {
    !hash.starts_with('$')
}

fn verify_legacy_password(password: &str, hash: &str) -> bool {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    password.hash(&mut hasher);
    format!("{:x}", hasher.finish()) == hash
}

pub fn require_auth(token: &str, db: &Database) -> Result<User, String> {
    if token.is_empty() {
        return Err("Authentication required".to_string());
    }

    let conn = db.get_conn()?;

    let session: Session = conn
        .query_row(
            "SELECT id, user_id, token, expires_at, created_at FROM sessions WHERE token = ?1",
            params![token],
            |row| {
                Ok(Session {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    token: row.get(2)?,
                    expires_at: row.get(3)?,
                    created_at: row.get(4)?,
                })
            },
        )
        .map_err(|_| "Invalid or expired session".to_string())?;

    let now = chrono::Utc::now()
        .format("%Y-%m-%d %H:%M:%S")
        .to_string();
    if session.expires_at < now {
        return Err("Session expired".to_string());
    }

    let user = conn
        .query_row(
            "SELECT id, username, name, role, is_active, must_change_password, last_login, created_at FROM users WHERE id = ?1",
            params![session.user_id],
            |row| {
                Ok(User {
                    id: row.get(0)?,
                    username: row.get(1)?,
                    name: row.get(2)?,
                    role: row.get(3)?,
                    is_active: row.get::<_, i32>(4)? == 1,
                    must_change_password: row.get::<_, i32>(5)? == 1,
                    last_login: row.get(6)?,
                    created_at: row.get(7)?,
                })
            },
        )
        .map_err(|_| "User not found or disabled".to_string())?;

    if !user.is_active {
        return Err("Account is disabled".to_string());
    }

    Ok(user)
}

#[tauri::command]
pub fn login(input: LoginInput, db: State<Database>) -> Result<LoginResult, String> {
    let conn = db.get_conn()?;

    let user = conn
        .query_row(
            "SELECT id, username, name, role, is_active, must_change_password, last_login, created_at FROM users WHERE username = ?1",
            params![input.username],
            |row| {
                Ok(User {
                    id: row.get(0)?,
                    username: row.get(1)?,
                    name: row.get(2)?,
                    role: row.get(3)?,
                    is_active: row.get::<_, i32>(4)? == 1,
                    must_change_password: row.get::<_, i32>(5)? == 1,
                    last_login: row.get(6)?,
                    created_at: row.get(7)?,
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

    let stored_hash: String = conn
        .query_row(
            "SELECT password_hash FROM users WHERE username = ?1",
            params![input.username],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let password_valid = if is_legacy_hash(&stored_hash) {
        verify_legacy_password(&input.password, &stored_hash)
    } else {
        verify_password(&input.password, &stored_hash)
    };

    if !password_valid {
        return Err("Invalid username or password".to_string());
    }

    if is_legacy_hash(&stored_hash) {
        let new_hash = hash_password(&input.password);
        conn.execute(
            "UPDATE users SET password_hash = ?1 WHERE username = ?2",
            params![new_hash, input.username],
        )
        .map_err(|e| e.to_string())?;
    }

    let token = uuid::Uuid::new_v4().to_string();
    let expires_at = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .unwrap()
        .format("%Y-%m-%d %H:%M:%S")
        .to_string();

    conn.execute(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES (?1, ?2, ?3)",
        params![user.id, token, expires_at],
    )
    .map_err(|e| e.to_string())?;

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
            created_at: chrono::Utc::now()
                .format("%Y-%m-%d %H:%M:%S")
                .to_string(),
        },
    })
}

#[tauri::command]
pub fn logout(token: String, db: State<Database>) -> Result<(), String> {
    let _user = require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    conn.execute("DELETE FROM sessions WHERE token = ?1", params![token])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn create_user(input: CreateUserInput, token: String, db: State<Database>) -> Result<User, String> {
    let _user = require_auth(&token, &db)?;
    if _user.role != "admin" {
        return Err("Only admins can create users".into());
    }
    if input.password.len() < 8 {
        return Err("Password must be at least 8 characters".into());
    }
    let conn = db.get_conn()?;

    let password_hash = hash_password(&input.password);
    let role = input.role.unwrap_or_else(|| "technician".to_string());

    conn.execute(
        "INSERT INTO users (username, password_hash, name, role, pin) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![input.username, password_hash, input.name, role, input.pin],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    conn.query_row(
        "SELECT id, username, name, role, is_active, must_change_password, last_login, created_at FROM users WHERE id = ?1",
        params![id],
        |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                name: row.get(2)?,
                role: row.get(3)?,
                is_active: row.get::<_, i32>(4)? == 1,
                must_change_password: row.get::<_, i32>(5)? == 1,
                last_login: row.get(6)?,
                created_at: row.get(7)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_users(token: String, db: State<Database>) -> Result<Vec<User>, String> {
    let _user = require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    let mut stmt = conn
        .prepare("SELECT id, username, name, role, is_active, must_change_password, last_login, created_at FROM users ORDER BY name")
        .map_err(|e| e.to_string())?;

    let users = stmt
        .query_map([], |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                name: row.get(2)?,
                role: row.get(3)?,
                is_active: row.get::<_, i32>(4)? == 1,
                must_change_password: row.get::<_, i32>(5)? == 1,
                last_login: row.get(6)?,
                created_at: row.get(7)?,
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
    token: String,
    db: State<Database>,
) -> Result<User, String> {
    let _user = require_auth(&token, &db)?;
    let conn = db.get_conn()?;

    // Only admins can change roles or active status
    if role.is_some() || is_active.is_some() {
        if _user.role != "admin" {
            return Err("Only admins can change user roles or active status".into());
        }
    }

    // Users can only update their own name; other users require admin
    if id != _user.id && _user.role != "admin" {
        return Err("Only admins can modify other users".into());
    }

    // Build dynamic SET clause — only update provided fields
    let mut sets = Vec::new();
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(name) = &name {
        sets.push("name = ?");
        values.push(Box::new(name.clone()));
    }
    if let Some(role) = &role {
        sets.push("role = ?");
        values.push(Box::new(role.clone()));
    }
    if let Some(is_active) = is_active {
        sets.push("is_active = ?");
        values.push(Box::new(is_active as i32));
    }

    if !sets.is_empty() {
        values.push(Box::new(id));
        let sql = format!("UPDATE users SET {} WHERE id = ?", sets.join(", "));
        conn.execute(&sql, rusqlite::params_from_iter(values.iter()))
            .map_err(|e| e.to_string())?;
    }

    conn.query_row(
        "SELECT id, username, name, role, is_active, must_change_password, last_login, created_at FROM users WHERE id = ?1",
        params![id],
        |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                name: row.get(2)?,
                role: row.get(3)?,
                is_active: row.get::<_, i32>(4)? == 1,
                must_change_password: row.get::<_, i32>(5)? == 1,
                last_login: row.get(6)?,
                created_at: row.get(7)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_user(id: i64, token: String, db: State<Database>) -> Result<(), String> {
    let _user = require_auth(&token, &db)?;
    if _user.role != "admin" {
        return Err("Only admins can delete users".into());
    }
    if id == _user.id {
        return Err("Cannot delete your own account".into());
    }
    let conn = db.get_conn()?;
    conn.execute("DELETE FROM sessions WHERE user_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM users WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn change_password(input: ChangePasswordInput, token: String, db: State<Database>) -> Result<(), String> {
    let user = require_auth(&token, &db)?;
    let conn = db.get_conn()?;

    let stored_hash: String = conn
        .query_row(
            "SELECT password_hash FROM users WHERE id = ?1",
            params![user.id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let valid = if is_legacy_hash(&stored_hash) {
        verify_legacy_password(&input.old_password, &stored_hash)
    } else {
        verify_password(&input.old_password, &stored_hash)
    };

    if !valid {
        return Err("Current password is incorrect".to_string());
    }

    if input.new_password.len() < 8 {
        return Err("New password must be at least 8 characters".into());
    }

    let new_hash = hash_password(&input.new_password);
    conn.execute(
        "UPDATE users SET password_hash = ?1, must_change_password = 0 WHERE id = ?2",
        params![new_hash, user.id],
    )
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

    #[test]
    fn test_bcrypt_hash_starts_with_dollar() {
        let hash = hash_password("test123");
        assert!(hash.starts_with('$'));
    }

    #[test]
    fn test_is_legacy_hash() {
        assert!(is_legacy_hash("a1b2c3d4e5f6"));
        assert!(!is_legacy_hash("$2b$12$LJ3m4ys3Lz2YlQN4S9RzOu"));
    }
}
