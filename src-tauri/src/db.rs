use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::{params, Connection, Result};
use std::collections::HashSet;

pub struct Database {
    pub pool: Pool<SqliteConnectionManager>,
}

struct Migration {
    version: i64,
    description: &'static str,
    sql: &'static str,
}

const MIGRATIONS: &[Migration] = &[
    // ── v1: Base schema — core repair tables ──────────────────────────
    Migration { version: 1, description: "Base schema — core tables", sql: "
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
            sort_order INTEGER NOT NULL,
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
            repair_id TEXT NOT NULL REFERENCES repairs(id),
            amount REAL NOT NULL,
            method TEXT NOT NULL CHECK(method IN ('cash','bank_transfer')),
            paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            note TEXT
        );
    " },

    // ── v2: Seed shop settings ────────────────────────────────────────
    Migration { version: 2, description: "Seed shop settings", sql: "
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
            ('openrouter_model', 'meta-llama/llama-3.1-8b-instruct:free'),
            ('gemini_api_key', ''),
            ('gemini_model', 'gemini-2.0-flash'),
            ('smtp_host', ''),
            ('smtp_port', '587'),
            ('smtp_username', ''),
            ('smtp_password', ''),
            ('smtp_from_name', 'SaraaTEK'),
            ('smtp_from_email', '');
    " },

    // ── v3: Add customers.address column ──────────────────────────────
    Migration { version: 3, description: "Add customers.address column", sql: "
        ALTER TABLE customers ADD COLUMN address TEXT;
    " },

    // ── v4: Photos, notifications, warranties, audit ──────────────────
    Migration { version: 4, description: "Photos, notifications, warranties, audit tables", sql: "
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
    " },

    // ── v5: CRM tables ───────────────────────────────────────────────
    Migration { version: 5, description: "CRM tables — companies, contacts, communications", sql: "
        CREATE TABLE IF NOT EXISTS companies (
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
        );
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL REFERENCES companies(id),
            name TEXT NOT NULL,
            position TEXT,
            phone TEXT NOT NULL,
            email TEXT,
            is_primary INTEGER DEFAULT 0,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
        CREATE TABLE IF NOT EXISTS communications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL REFERENCES companies(id),
            contact_id INTEGER REFERENCES contacts(id),
            repair_id TEXT REFERENCES repairs(id),
            channel TEXT NOT NULL CHECK(channel IN ('whatsapp','email','sms','phone','in_person')),
            direction TEXT NOT NULL CHECK(direction IN ('inbound','outbound')),
            subject TEXT,
            message TEXT NOT NULL,
            status TEXT CHECK(status IN ('sent','delivered','read','failed')),
            sent_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_communications_company_id ON communications(company_id);
        CREATE INDEX IF NOT EXISTS idx_communications_repair_id ON communications(repair_id);
    " },

    // ── v6: Add notifications.channel column ──────────────────────────
    Migration { version: 6, description: "Add notifications.channel column", sql: "
        ALTER TABLE notifications ADD COLUMN channel TEXT NOT NULL DEFAULT 'whatsapp';
    " },

    // ── v7: Security tables ──────────────────────────────────────────
    Migration { version: 7, description: "Security tables — users, sessions, audit_log", sql: "
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'technician' CHECK(role IN ('admin','manager','technician','front_desk')),
            pin TEXT,
            is_active INTEGER DEFAULT 1,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            token TEXT UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            field_name TEXT,
            old_value TEXT,
            new_value TEXT,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
    " },

    // ── v8: Accounting tables ────────────────────────────────────────
    Migration { version: 8, description: "Accounting tables — chart of accounts, journal", sql: "
        CREATE TABLE IF NOT EXISTS chart_of_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('asset','liability','equity','income','cogs','expense')),
            parent_id INTEGER REFERENCES chart_of_accounts(id),
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS journal_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_date DATE NOT NULL,
            description TEXT NOT NULL,
            source_type TEXT CHECK(source_type IN ('payment','parts_purchase','parts_used','pay_supplier','manual','opening')),
            source_id TEXT,
            is_posted INTEGER DEFAULT 1,
            created_by INTEGER REFERENCES users(id),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS journal_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
            account_id INTEGER NOT NULL REFERENCES chart_of_accounts(id),
            debit REAL DEFAULT 0,
            credit REAL DEFAULT 0,
            note TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
        CREATE INDEX IF NOT EXISTS idx_journal_entries_source ON journal_entries(source_type, source_id);
        CREATE INDEX IF NOT EXISTS idx_journal_items_account ON journal_items(account_id);
        CREATE INDEX IF NOT EXISTS idx_journal_items_entry ON journal_items(entry_id);
    " },

    // ── v9: Seed chart of accounts ───────────────────────────────────
    Migration { version: 9, description: "Seed default chart of accounts", sql: "
        INSERT OR IGNORE INTO chart_of_accounts (code, name, type) VALUES
            ('1000', 'Cash', 'asset'),
            ('1100', 'Bank Account', 'asset'),
            ('1200', 'Accounts Receivable', 'asset'),
            ('1300', 'Parts Inventory', 'asset'),
            ('2000', 'Accounts Payable', 'liability'),
            ('3000', 'Owner''s Equity', 'equity'),
            ('4000', 'Repair Revenue', 'income'),
            ('5000', 'Parts Cost', 'cogs');
    " },

    // ── v10: Campaigns tables ────────────────────────────────────────
    Migration { version: 10, description: "Campaigns tables", sql: "
        CREATE TABLE IF NOT EXISTS campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            message TEXT NOT NULL,
            channel TEXT NOT NULL CHECK(channel IN ('whatsapp','email','sms')),
            status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sending','completed','failed')),
            total_recipients INTEGER DEFAULT 0,
            sent_count INTEGER DEFAULT 0,
            failed_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS campaign_recipients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
            customer_id INTEGER NOT NULL REFERENCES customers(id),
            customer_name TEXT,
            customer_phone TEXT,
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','failed')),
            sent_at DATETIME
        );
        CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
    " },

    // ── v11: Document management tables + PDF settings seed ──────────
    Migration { version: 11, description: "Document management tables + PDF settings", sql: "
        CREATE TABLE IF NOT EXISTS document_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('quotation','invoice','receipt','letter')),
            content TEXT NOT NULL,
            is_default INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS document_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_type TEXT NOT NULL,
            document_id INTEGER NOT NULL,
            version INTEGER NOT NULL,
            content TEXT NOT NULL,
            changes TEXT,
            created_by INTEGER REFERENCES users(id),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_document_versions_doc ON document_versions(document_type, document_id);
        CREATE TABLE IF NOT EXISTS signatures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            repair_id TEXT REFERENCES repairs(id),
            customer_name TEXT NOT NULL,
            signature_data TEXT NOT NULL,
            signed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_signatures_repair ON signatures(repair_id);
        CREATE TABLE IF NOT EXISTS letterhead_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            logo_path TEXT,
            company_name TEXT,
            address TEXT,
            phone TEXT,
            email TEXT,
            website TEXT,
            primary_color TEXT DEFAULT '#7C4DFF',
            secondary_color TEXT DEFAULT '#3B82F6',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS pdf_template_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key TEXT UNIQUE NOT NULL,
            setting_value TEXT NOT NULL DEFAULT '',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT OR IGNORE INTO pdf_template_settings (setting_key, setting_value) VALUES
            ('company_name', 'saraa TEK'),
            ('company_address', '539/8 Madamandiya, Dedigamuwa'),
            ('company_email', 'saraatek25@gmail.com'),
            ('company_phone', '+94 72 2828 100'),
            ('bank_name', 'Commercial Bank'),
            ('bank_account_name', 'N.G.C.N Ariyarathna'),
            ('bank_account_number', '8117011598'),
            ('bank_branch', 'Pitakotte'),
            ('tagline', 'your dead device has a second life'),
            ('terms_line1', '60% Needed in Advance'),
            ('terms_line2', 'Warranty period one year less 15 working days. (1 yr = 350 days, 2 yr = 700 days, 3 yr = 1050 days)'),
            ('terms_line3', 'Warranty covers only manufacturer''s defects. Damage or defect due to other causes such as'),
            ('terms_line4', 'negligence, misuses, improper operation, power fluctuation, lightning or other natural disasters, sabotage or accident etc.'),
            ('terms_line5', 'No warranty for: - key board, Mouse, Speakers, Power adapters, Toners, Ink Cartridges, Printer heads.'),
            ('terms_line6', 'For other items if there is BURN MARKS, PHYSICAL DAMAGES and CORROSION no warranty.'),
            ('terms_line7', 'Goods once sold are not returnable under any circumstances'),
            ('warranty_box', 'WARRANTY CLAIM ONE YEAR LESS 17 DAYS, NO WARRANTY FOR CHIP BURNS OR PHYSICAL DAMAGE &amp; PLEASE PRODUCE THE INVOICE FOR WARRANTY CLAIMS'),
            ('authorized_label', 'Authorized signature'),
            ('customer_sig_label', 'Customer signature'),
            ('footer_address', '539/8'),
            ('footer_phone', '+94 72 2828 100'),
            ('footer_email', 'saraatek25@gmail.com'),
            ('footer_company', 'saraa tek'),
            ('footer_location', 'Madamandiya, Dedigamuwa'),
            ('custom_css', ''),
            ('background_image', '');
    " },

    // ── v12: Add must_change_password column ─────────────────────────
    Migration { version: 12, description: "Add must_change_password column", sql: "
        ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
    " },

    // ── v13: Seed default admin user ─────────────────────────────────
    Migration { version: 13, description: "Seed default admin user", sql: "
        INSERT OR IGNORE INTO users (username, password_hash, name, role, must_change_password)
        SELECT 'admin', '', 'Administrator', 'admin', 1
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
    " },
];

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let manager = SqliteConnectionManager::file(db_path).with_init(|conn| {
            conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
        });
        let pool = Pool::new(manager).map_err(|e| {
            rusqlite::Error::InvalidParameterName(format!("failed to create pool: {e}"))
        })?;
        Ok(Database { pool })
    }

    pub fn get_conn(
        &self,
    ) -> std::result::Result<r2d2::PooledConnection<SqliteConnectionManager>, String> {
        self.pool.get().map_err(|e| e.to_string())
    }

    pub fn run_migrations(&self) -> Result<(), String> {
        let conn = self.get_conn().map_err(|e| format!("db pool error: {e}"))?;

        // Create migration tracking table
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                description TEXT NOT NULL,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );",
        )
        .map_err(|e| format!("Failed to create schema_migrations: {e}"))?;

        // Get already-applied versions
        let applied: HashSet<i64> = conn
            .prepare("SELECT version FROM schema_migrations")
            .map_err(|e| e.to_string())?
            .query_map([], |row| row.get(0))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        // Run pending migrations
        for migration in MIGRATIONS {
            if applied.contains(&migration.version) {
                continue;
            }

            let result = conn.execute_batch(migration.sql);
            match result {
                Ok(()) => {
                    conn.execute(
                        "INSERT INTO schema_migrations (version, description) VALUES (?1, ?2)",
                        params![migration.version, migration.description],
                    )
                    .map_err(|e| {
                        format!(
                            "Failed to record migration {} ({}): {}",
                            migration.version, migration.description, e
                        )
                    })?;
                }
                Err(e) => {
                    let msg = e.to_string();
                    // Handle existing databases that already have the column
                    if msg.contains("duplicate column") {
                        conn.execute(
                            "INSERT OR IGNORE INTO schema_migrations (version, description) VALUES (?1, ?2)",
                            params![migration.version, migration.description],
                        )
                        .map_err(|e2| {
                            format!(
                                "Failed to record migration {} after skip: {}",
                                migration.version, e2
                            )
                        })?;
                    } else {
                        return Err(format!(
                            "Migration {} ({}) failed: {}",
                            migration.version, migration.description, msg
                        ));
                    }
                }
            }
        }

        // Post-migration: hash admin password with bcrypt if still using legacy hash
        hash_admin_password_if_legacy(&conn)?;

        Ok(())
    }
}

fn hash_admin_password_if_legacy(conn: &Connection) -> Result<(), String> {
    let hash: String = conn
        .query_row(
            "SELECT password_hash FROM users WHERE username = 'admin'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    if hash.is_empty() || hash.starts_with('$') {
        return Ok(()); // Already bcrypt or empty (will be set on first login)
    }

    // Legacy hash — replace with bcrypt
    let new_hash =
        bcrypt::hash("admin123", 12).expect("failed to hash admin password with bcrypt");
    conn.execute(
        "UPDATE users SET password_hash = ?1 WHERE username = 'admin'",
        params![new_hash],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_db() -> Database {
        let manager = SqliteConnectionManager::memory();
        let pool = Pool::new(manager).unwrap();
        let conn = pool.get().unwrap();
        conn.execute_batch("PRAGMA foreign_keys=ON;").unwrap();
        Database { pool }
    }

    #[test]
    fn run_migrations_should_create_all_tables() {
        let db = setup_db();
        db.run_migrations().unwrap();

        let conn = db.pool.get().unwrap();
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
            "schema_migrations",
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

        let conn = db.pool.get().unwrap();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM shop_settings", [], |r| r.get(0))
            .unwrap();
        assert!(count >= 22, "shop_settings should have at least 22 seed rows, got {count}");
    }

    #[test]
    fn run_migrations_should_seed_shop_settings() {
        let db = setup_db();
        db.run_migrations().unwrap();

        let conn = db.pool.get().unwrap();
        let mut stmt = conn
            .prepare("SELECT key, value FROM shop_settings ORDER BY key")
            .unwrap();
        let rows: Vec<(String, String)> = stmt
            .query_map([], |r| Ok((r.get(0)?, r.get(1)?)))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();

        assert!(rows.len() >= 22, "expected at least 22 seed settings, got {}", rows.len());

        // Verify critical settings that the app depends on
        let settings_map: std::collections::HashMap<String, String> = rows.into_iter().collect();
        assert!(settings_map.contains_key("shop_name"), "missing shop_name setting");
        assert!(settings_map.contains_key("shop_email"), "missing shop_email setting");
        assert!(settings_map.contains_key("default_country_code"), "missing default_country_code setting");
        assert!(settings_map.contains_key("openrouter_model"), "missing openrouter_model setting");
        assert!(settings_map.contains_key("smtp_host"), "missing smtp_host setting");
    }

    #[test]
    fn foreign_keys_should_be_enforced() {
        let db = setup_db();
        db.run_migrations().unwrap();

        let conn = db.pool.get().unwrap();
        let result = conn.execute(
            "INSERT INTO repairs (id, customer_id, brand, reported_problem, received_at) VALUES (?, 999, ?, ?, ?)",
            rusqlite::params!["X/99/99", "Test", "Problem", "2025-01-01"],
        );
        assert!(result.is_err(), "should reject invalid customer_id");
    }

    #[test]
    fn schema_migrations_should_track_applied_versions() {
        let db = setup_db();
        db.run_migrations().unwrap();

        let conn = db.pool.get().unwrap();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM schema_migrations", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 13, "should have 13 migrations applied");
    }

    #[test]
    fn running_migrations_twice_should_not_duplicate_settings() {
        let db = setup_db();
        db.run_migrations().unwrap();

        // Get shop_settings count before second run
        let conn = db.pool.get().unwrap();
        let before: i64 = conn
            .query_row("SELECT COUNT(*) FROM shop_settings", [], |r| r.get(0))
            .unwrap();

        db.run_migrations().unwrap();

        let after: i64 = conn
            .query_row("SELECT COUNT(*) FROM shop_settings", [], |r| r.get(0))
            .unwrap();

        assert_eq!(before, after, "second migration run should not duplicate rows");
    }
}
