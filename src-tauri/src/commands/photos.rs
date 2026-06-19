use crate::db::Database;
use chrono::Local;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Photo {
    pub id: i64,
    pub repair_id: String,
    pub filename: String,
    pub file_path: String,
    pub uploaded_at: String,
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

fn sanitize_repair_id(repair_id: &str) -> String {
    repair_id.replace('/', "-")
}

fn get_photos_dir(conn: &Connection) -> Result<PathBuf, String> {
    let custom = get_setting(conn, "photos_dir")?;
    if let Some(dir) = custom {
        if !dir.is_empty() {
            return Ok(PathBuf::from(dir));
        }
    }
    let app_data = std::env::var("APPDATA")
        .or_else(|_| std::env::var("HOME"))
        .map_err(|_| "Cannot determine home directory".to_string())?;
    Ok(PathBuf::from(app_data).join("saraatek").join("photos"))
}

fn ensure_photo_folder(conn: &Connection, repair_id: &str) -> Result<PathBuf, String> {
    let base = get_photos_dir(conn)?;
    let folder = base.join(sanitize_repair_id(repair_id));
    fs::create_dir_all(&folder).map_err(|e| format!("failed to create photo dir: {e}"))?;
    Ok(folder)
}

pub(crate) fn add_photos_inner(
    conn: &Connection,
    repair_id: &str,
    file_names: &[String],
) -> Result<Vec<Photo>, String> {
    let folder = ensure_photo_folder(conn, repair_id)?;
    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let mut photos = Vec::new();

    for fname in file_names {
        let src = PathBuf::from(fname);
        let stem = src.file_stem().and_then(|s| s.to_str()).unwrap_or("photo");
        let ext = src.extension().and_then(|s| s.to_str()).unwrap_or("jpg");
        let timestamp = Local::now().format("%Y%m%d_%H%M%S%3f").to_string();
        let dest_name = format!("{}_{}.{}", stem, timestamp, ext);
        let dest = folder.join(&dest_name);

        fs::copy(&src, &dest).map_err(|e| format!("failed to copy photo: {e}"))?;

        let dest_str = dest.to_string_lossy().to_string();
        conn.execute(
            "INSERT INTO photos (repair_id, filename, file_path, uploaded_at) VALUES (?, ?, ?, ?)",
            rusqlite::params![repair_id, dest_name, dest_str, now],
        )
        .map_err(|e| e.to_string())?;

        let id = conn.last_insert_rowid();
        photos.push(Photo {
            id,
            repair_id: repair_id.to_string(),
            filename: dest_name,
            file_path: dest_str,
            uploaded_at: now.clone(),
        });
    }

    Ok(photos)
}

pub(crate) fn get_photos_inner(conn: &Connection, repair_id: &str) -> Result<Vec<Photo>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, repair_id, filename, file_path, uploaded_at FROM photos WHERE repair_id = ? ORDER BY uploaded_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([repair_id], |row| {
            Ok(Photo {
                id: row.get(0)?,
                repair_id: row.get(1)?,
                filename: row.get(2)?,
                file_path: row.get(3)?,
                uploaded_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut photos = Vec::new();
    for row in rows {
        photos.push(row.map_err(|e| e.to_string())?);
    }
    Ok(photos)
}

pub(crate) fn delete_photo_inner(conn: &Connection, photo_id: i64) -> Result<(), String> {
    let (file_path,): (String,) = conn
        .query_row(
            "SELECT file_path FROM photos WHERE id = ?",
            rusqlite::params![photo_id],
            |row| Ok((row.get(0)?,)),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM photos WHERE id = ?",
        rusqlite::params![photo_id],
    )
    .map_err(|e| e.to_string())?;

    let _ = fs::remove_file(&file_path);

    Ok(())
}

pub(crate) fn open_photos_folder_inner(
    conn: &Connection,
    repair_id: &str,
) -> Result<String, String> {
    let folder = ensure_photo_folder(conn, repair_id)?;
    let path = folder.to_string_lossy().to_string();
    let _ = std::process::Command::new("explorer").arg(&path).spawn();
    Ok(path)
}

#[tauri::command]
pub fn add_photos(
    repair_id: String,
    file_names: Vec<String>,
    db: State<Database>,
) -> Result<Vec<Photo>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    add_photos_inner(&conn, &repair_id, &file_names)
}

#[tauri::command]
pub fn get_photos(repair_id: String, db: State<Database>) -> Result<Vec<Photo>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    get_photos_inner(&conn, &repair_id)
}

#[tauri::command]
pub fn delete_photo(photo_id: i64, db: State<Database>) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    delete_photo_inner(&conn, photo_id)
}

#[tauri::command]
pub fn open_photos_folder(repair_id: String, db: State<Database>) -> Result<String, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    open_photos_folder_inner(&conn, &repair_id)
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
                type TEXT NOT NULL, name TEXT NOT NULL, phone TEXT UNIQUE NOT NULL
            );
            CREATE TABLE repairs (
                id TEXT PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id),
                status TEXT NOT NULL DEFAULT 'Received', brand TEXT NOT NULL,
                reported_problem TEXT NOT NULL, received_at DATETIME NOT NULL
            );
            CREATE TABLE photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL REFERENCES repairs(id),
                filename TEXT NOT NULL, file_path TEXT NOT NULL,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE shop_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);",
        )
        .unwrap();
        conn
    }

    fn seed_repair(conn: &Connection) -> String {
        conn.execute(
            "INSERT INTO customers (type, name, phone) VALUES ('individual','Test','0000000000')",
            [],
        )
        .unwrap();
        conn.execute("INSERT INTO repairs (id, customer_id, brand, reported_problem, received_at) VALUES ('T/01/26', 1, 'Test', 'Issue', '2026-01-01')", []).unwrap();
        "T/01/26".into()
    }

    #[test]
    fn add_photos_should_copy_files_and_insert_rows() {
        let conn = setup();
        let rid = seed_repair(&conn);

        let tmp = std::env::temp_dir().join("test_photo.jpg");
        fs::write(&tmp, b"fake-image-data").unwrap();

        let photos = add_photos_inner(&conn, &rid, &[tmp.to_string_lossy().to_string()]).unwrap();
        assert_eq!(photos.len(), 1);
        assert_eq!(photos[0].repair_id, rid);

        let all = get_photos_inner(&conn, &rid).unwrap();
        assert_eq!(all.len(), 1);

        fs::remove_file(&tmp).ok();
    }

    #[test]
    fn get_photos_should_return_empty_when_none() {
        let conn = setup();
        let rid = seed_repair(&conn);
        let photos = get_photos_inner(&conn, &rid).unwrap();
        assert!(photos.is_empty());
    }
}
