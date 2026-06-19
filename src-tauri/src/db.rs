use rusqlite::{Connection, Result};
use std::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
        Ok(Database {
            conn: Mutex::new(conn),
        })
    }

    pub fn run_migrations(&self) -> Result<(), String> {
        let conn = self
            .conn
            .lock()
            .map_err(|e| format!("db lock poisoned in run_migrations: {e}"))?;
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL CHECK(type IN ('individual','business')),
                name TEXT NOT NULL,
                phone TEXT UNIQUE NOT NULL,
                email TEXT,
                company_name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS technicians (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT,
                active INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS shop_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS repairs (
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

            CREATE INDEX IF NOT EXISTS idx_repairs_customer_id ON repairs(customer_id);
            CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);

            CREATE TABLE IF NOT EXISTS repair_condition (
                repair_id TEXT PRIMARY KEY REFERENCES repairs(id),
                screen TEXT CHECK(screen IN ('fine','scratched','cracked')),
                keyboard TEXT CHECK(keyboard IN ('fine','keys missing','damaged')),
                body TEXT CHECK(body IN ('fine','dented','cracked')),
                battery_present INTEGER,
                charger_included INTEGER,
                accessories_included INTEGER,
                accessories_notes TEXT,
                extra_notes TEXT
            );

            CREATE TABLE IF NOT EXISTS repair_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL REFERENCES repairs(id),
                status TEXT NOT NULL,
                note TEXT,
                changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_repair_history_repair_id ON repair_history(repair_id);

            CREATE TABLE IF NOT EXISTS quotations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL UNIQUE REFERENCES repairs(id),
                status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','declined')),
                subtotal REAL NOT NULL DEFAULT 0,
                tax REAL NOT NULL DEFAULT 0,
                grand_total REAL NOT NULL DEFAULT 0,
                generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                responded_at DATETIME,
                response_note TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_quotations_repair_id ON quotations(repair_id);

            CREATE TABLE IF NOT EXISTS quotation_items (
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
            );

            CREATE INDEX IF NOT EXISTS idx_quotation_items_repair ON quotation_items(repair_id);

            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL UNIQUE REFERENCES repairs(id),
                amount REAL NOT NULL,
                method TEXT NOT NULL CHECK(method IN ('cash','bank_transfer')),
                paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                note TEXT
            );

            INSERT OR IGNORE INTO shop_settings (key, value) VALUES
                ('shop_name', 'SaraaTEK'),
                ('shop_address', ''),
                ('shop_phone', ''),
                ('shop_email', 'saraatek25@gmail.com'),
                ('shop_whatsapp', '+9472 2828 100'),
                ('shop_facebook', 'saraa tek'),
                ('shop_logo_path', ''),
                ('month_counter', '0'),
                ('counter_month', ''),
                ('pdf_template_path', ''),
                ('pdf_output_dir', ''),
                ('photos_dir', ''),
                ('fonnte_api_token', ''),
                ('default_country_code', '94'),
                ('openrouter_api_key', ''),
                ('openrouter_model', 'meta-llama/llama-3.1-8b-instruct:free');
        ",).map_err(|e| e.to_string())?;

        let has_address: bool = conn
            .prepare("SELECT COUNT(*) FROM pragma_table_info('customers') WHERE name = ?")
            .map_err(|e| e.to_string())?
            .query_row(["address"], |r| r.get::<_, i64>(0))
            .map_err(|e| e.to_string())?
            > 0;
        if !has_address {
            conn.execute_batch("ALTER TABLE customers ADD COLUMN address TEXT;")
                .map_err(|e| e.to_string())?;
        }

        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL REFERENCES repairs(id),
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_photos_repair_id ON photos(repair_id);

            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL REFERENCES repairs(id),
                type TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('sent','failed')),
                fonnte_response TEXT,
                sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_notifications_repair_id ON notifications(repair_id);

            CREATE TABLE IF NOT EXISTS warranties (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL UNIQUE REFERENCES repairs(id),
                duration_label TEXT NOT NULL,
                start_date DATE NOT NULL,
                expiry_date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS field_audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL REFERENCES repairs(id),
                field_name TEXT NOT NULL,
                old_value TEXT,
                new_value TEXT,
                changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_field_audit_repair_id ON field_audit_log(repair_id);
            ",
        )
        .map_err(|e| e.to_string())?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_db() -> Database {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
            .unwrap();
        Database {
            conn: Mutex::new(conn),
        }
    }

    #[test]
    fn run_migrations_should_create_all_tables() {
        let db = setup_db();
        db.run_migrations().unwrap();

        let conn = db.conn.lock().unwrap();
        let tables: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();

        let expected = [
            "customers",
            "field_audit_log",
            "notifications",
            "payments",
            "photos",
            "quotations",
            "quotation_items",
            "repair_condition",
            "repair_history",
            "repairs",
            "shop_settings",
            "technicians",
            "warranties",
        ];
        for name in &expected {
            assert!(
                tables.contains(&name.to_string()),
                "table {} not found: {:?}",
                name,
                tables
            );
        }
        assert!(!tables.contains(&"invoices".to_string()));
        assert!(!tables.contains(&"invoice_items".to_string()));
    }

    #[test]
    fn run_migrations_should_be_idempotent() {
        let db = setup_db();
        db.run_migrations().unwrap();
        db.run_migrations().unwrap();

        let conn = db.conn.lock().unwrap();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM shop_settings", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 16, "shop_settings should have exactly 16 seed rows");
    }

    #[test]
    fn run_migrations_should_seed_shop_settings() {
        let db = setup_db();
        db.run_migrations().unwrap();

        let conn = db.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT key, value FROM shop_settings ORDER BY key")
            .unwrap();
        let rows: Vec<(String, String)> = stmt
            .query_map([], |r| Ok((r.get(0)?, r.get(1)?)))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();

        assert_eq!(rows.len(), 16, "expected 16 seed settings");
        assert!(rows.contains(&("shop_name".into(), "SaraaTEK".into())));
        assert!(rows.contains(&("default_country_code".into(), "94".into())));
        assert!(rows.contains(&(
            "openrouter_model".into(),
            "meta-llama/llama-3.1-8b-instruct:free".into()
        )));
    }

    #[test]
    fn foreign_keys_should_be_enforced() {
        let db = setup_db();
        db.run_migrations().unwrap();

        let conn = db.conn.lock().unwrap();
        let result = conn.execute(
            "INSERT INTO repairs (id, customer_id, brand, reported_problem, received_at) VALUES (?, 999, ?, ?, ?)",
            rusqlite::params!["X/99/99", "Test", "Problem", "2025-01-01"],
        );
        assert!(result.is_err(), "should reject invalid customer_id");
    }
}
