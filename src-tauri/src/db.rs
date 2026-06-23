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
                ('openrouter_model', 'meta-llama/llama-3.1-8b-instruct:free'),
                ('gemini_api_key', ''),
                ('gemini_model', 'gemini-2.0-flash'),
                ('smtp_host', ''),
                ('smtp_port', '587'),
                ('smtp_username', ''),
                ('smtp_password', ''),
                ('smtp_from_name', 'SaraaTEK'),
                ('smtp_from_email', '');
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

        // Phase 6: CRM tables
        conn.execute_batch(
            "
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
            ",
        )
        .map_err(|e| e.to_string())?;

        let has_channel: bool = conn
            .prepare("SELECT COUNT(*) FROM pragma_table_info('notifications') WHERE name = ?")
            .map_err(|e| e.to_string())?
            .query_row(["channel"], |r| r.get::<_, i64>(0))
            .map_err(|e| e.to_string())?
            > 0;
        if !has_channel {
            conn.execute_batch(
                "ALTER TABLE notifications ADD COLUMN channel TEXT NOT NULL DEFAULT 'whatsapp';",
            )
            .map_err(|e| e.to_string())?;
        }

        // Phase 7: Security tables
        conn.execute_batch(
            "
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
            ",
        )
        .map_err(|e| e.to_string())?;

        // Phase 9: Accounting tables
        conn.execute_batch(
            "
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
            ",
        )
        .map_err(|e| e.to_string())?;

        // Seed default Chart of Accounts if empty
        let account_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM chart_of_accounts", [], |row| row.get(0))
            .unwrap_or(0);

        if account_count == 0 {
            conn.execute_batch(
                "
                INSERT INTO chart_of_accounts (code, name, type) VALUES
                    ('1000', 'Cash', 'asset'),
                    ('1100', 'Bank Account', 'asset'),
                    ('1200', 'Accounts Receivable', 'asset'),
                    ('1300', 'Parts Inventory', 'asset'),
                    ('2000', 'Accounts Payable', 'liability'),
                    ('3000', 'Owner''s Equity', 'equity'),
                    ('4000', 'Repair Revenue', 'income'),
                    ('5000', 'Parts Cost', 'cogs');
                ",
            )
            .map_err(|e| e.to_string())?;
        }

        // Phase 12: Communications tables
        conn.execute_batch(
            "
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
            ",
        )
        .map_err(|e| e.to_string())?;

        // Phase 13: Document Management tables
        conn.execute_batch(
            "
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
            ",
        )
        .map_err(|e| e.to_string())?;

        // Create default admin user if no users exist
        let user_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
            .unwrap_or(0);
        
        if user_count == 0 {
            use std::collections::hash_map::DefaultHasher;
            use std::hash::{Hash, Hasher};
            
            let mut hasher = DefaultHasher::new();
            "admin123".hash(&mut hasher);
            let password_hash = format!("{:x}", hasher.finish());
            
            conn.execute(
                "INSERT INTO users (username, password_hash, name, role) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params!["admin", password_hash, "Administrator", "admin"],
            )
            .map_err(|e| e.to_string())?;
        }

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
        assert_eq!(count, 22, "shop_settings should have exactly 22 seed rows");
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

        assert_eq!(rows.len(), 22, "expected 22 seed settings");
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
