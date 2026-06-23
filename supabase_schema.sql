-- SaraaTEK Supabase Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES (mirrored from SQLite)
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'technician',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    type TEXT NOT NULL DEFAULT 'individual',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    website TEXT,
    tax_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    position TEXT,
    phone TEXT,
    email TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Repairs table
CREATE TABLE IF NOT EXISTS repairs (
    id TEXT PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    company_id INTEGER REFERENCES companies(id),
    device_type TEXT,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    color TEXT,
    reported_problem TEXT,
    condition_notes TEXT,
    status TEXT NOT NULL DEFAULT 'Received',
    estimated_cost REAL DEFAULT 0,
    final_cost REAL DEFAULT 0,
    deposit REAL DEFAULT 0,
    received_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Repair condition table
CREATE TABLE IF NOT EXISTS repair_condition (
    id SERIAL PRIMARY KEY,
    repair_id TEXT NOT NULL REFERENCES repairs(id),
    screen TEXT,
    keyboard TEXT,
    body TEXT,
    battery_present TEXT,
    charger_included TEXT,
    accessories_included TEXT,
    accessories_notes TEXT,
    extra_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Repair history table
CREATE TABLE IF NOT EXISTS repair_history (
    id SERIAL PRIMARY KEY,
    repair_id TEXT NOT NULL REFERENCES repairs(id),
    status TEXT NOT NULL,
    notes TEXT,
    changed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Technicians table
CREATE TABLE IF NOT EXISTS technicians (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Shop settings table
CREATE TABLE IF NOT EXISTS shop_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
    id SERIAL PRIMARY KEY,
    repair_id TEXT NOT NULL REFERENCES repairs(id),
    status TEXT NOT NULL DEFAULT 'pending',
    total REAL NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ
);

-- Quotation items table
CREATE TABLE IF NOT EXISTS quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id),
    item_type TEXT NOT NULL,
    description TEXT NOT NULL,
    device_name TEXT,
    serial_number TEXT,
    unit_price REAL NOT NULL DEFAULT 0,
    qty INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    repair_id TEXT NOT NULL REFERENCES repairs(id),
    amount REAL NOT NULL,
    method TEXT NOT NULL DEFAULT 'cash',
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    repair_id TEXT NOT NULL REFERENCES repairs(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    repair_id TEXT REFERENCES repairs(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Warranties table
CREATE TABLE IF NOT EXISTS warranties (
    id SERIAL PRIMARY KEY,
    repair_id TEXT NOT NULL REFERENCES repairs(id),
    warranty_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_label TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    claim_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Field audit log table
CREATE TABLE IF NOT EXISTS field_audit_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Communications table
CREATE TABLE IF NOT EXISTS communications (
    id SERIAL PRIMARY KEY,
    repair_id TEXT REFERENCES repairs(id),
    company_id INTEGER REFERENCES companies(id),
    contact_id INTEGER REFERENCES contacts(id),
    channel TEXT NOT NULL,
    direction TEXT NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    channel TEXT NOT NULL,
    message_template TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMPTZ
);

-- Campaign recipients table
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    contact_id INTEGER REFERENCES contacts(id),
    customer_id INTEGER REFERENCES customers(id),
    phone TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Document templates table
CREATE TABLE IF NOT EXISTS document_templates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    template_type TEXT NOT NULL,
    content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Document versions table
CREATE TABLE IF NOT EXISTS document_versions (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES document_templates(id),
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Signatures table
CREATE TABLE IF NOT EXISTS signatures (
    id SERIAL PRIMARY KEY,
    repair_id TEXT NOT NULL REFERENCES repairs(id),
    signature_type TEXT NOT NULL,
    signature_data TEXT NOT NULL,
    signed_by TEXT,
    signed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Letterhead settings table
CREATE TABLE IF NOT EXISTS letterhead_settings (
    id SERIAL PRIMARY KEY,
    logo_path TEXT,
    company_name TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    primary_color TEXT DEFAULT '#7C4DFF',
    secondary_color TEXT DEFAULT '#3B82F6',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- PDF template settings table
CREATE TABLE IF NOT EXISTS pdf_template_settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SYNC-SPECIFIC TABLES
-- ============================================

-- Device registry for multi-device access
CREATE TABLE IF NOT EXISTS device_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_name TEXT NOT NULL,
    device_type TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id),
    last_sync_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sync log for tracking changes
CREATE TABLE IF NOT EXISTS sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES device_registry(id),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_value JSONB,
    new_value JSONB,
    synced_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'pending' -- pending, synced, conflict
);

-- Cloud backup metadata
CREATE TABLE IF NOT EXISTS cloud_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_name TEXT NOT NULL,
    backup_size INTEGER,
    backup_path TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_repairs_customer_id ON repairs(customer_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
CREATE INDEX IF NOT EXISTS idx_repairs_received_at ON repairs(received_at);
CREATE INDEX IF NOT EXISTS idx_payments_repair_id ON payments(repair_id);
CREATE INDEX IF NOT EXISTS idx_quotations_repair_id ON quotations(repair_id);
CREATE INDEX IF NOT EXISTS idx_warranties_repair_id ON warranties(repair_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_device_id ON sync_log(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_table_name ON sync_log(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_log_sync_status ON sync_log(sync_status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can view all data" ON users FOR SELECT USING (true);
CREATE POLICY "Customers visible to authenticated" ON customers FOR SELECT USING (true);
CREATE POLICY "Repairs visible to authenticated" ON repairs FOR SELECT USING (true);
CREATE POLICY "Payments visible to authenticated" ON payments FOR SELECT USING (true);

-- Insert/Update/Delete policies for service role
CREATE POLICY "Service role full access" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON customers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON repairs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON payments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON sync_log FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE repairs;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE sync_log;

-- ============================================
-- FUNCTIONS FOR SYNC
-- ============================================

-- Function to log sync changes
CREATE OR REPLACE FUNCTION log_sync_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO sync_log (device_id, table_name, record_id, action, new_value)
        VALUES (NEW.device_id, TG_TABLE_NAME, NEW.id::TEXT, 'INSERT', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO sync_log (device_id, table_name, record_id, action, old_value, new_value)
        VALUES (NEW.device_id, TG_TABLE_NAME, NEW.id::TEXT, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO sync_log (device_id, table_name, record_id, action, old_value)
        VALUES (OLD.device_id, TG_TABLE_NAME, OLD.id::TEXT, 'DELETE', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get sync status
CREATE OR REPLACE FUNCTION get_sync_status(p_device_id UUID)
RETURNS TABLE (
    table_name TEXT,
    last_sync_at TIMESTAMP,
    pending_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.table_name,
        MAX(sl.synced_at) as last_sync_at,
        COUNT(*) as pending_count
    FROM sync_log sl
    WHERE sl.device_id = p_device_id
      AND sl.sync_status = 'pending'
    GROUP BY sl.table_name;
END;
$$ LANGUAGE plpgsql;

-- Function to mark sync as complete
CREATE OR REPLACE FUNCTION mark_sync_complete(p_device_id UUID, p_table_name TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE sync_log 
    SET sync_status = 'synced', synced_at = CURRENT_TIMESTAMP
    WHERE device_id = p_device_id 
      AND table_name = p_table_name
      AND sync_status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default shop settings
INSERT INTO shop_settings (key, value) VALUES
    ('shop_name', 'SaraaTEK'),
    ('shop_address', '539/8, Madamandiya, Dedigamuwa'),
    ('shop_phone', '+94 72 2828 100'),
    ('shop_email', 'saraatek25@gmail.com')
ON CONFLICT (key) DO NOTHING;

-- Insert default PDF template settings
INSERT INTO pdf_template_settings (setting_key, setting_value) VALUES
    ('company_name', 'SaraaTEK'),
    ('company_address', '539/8, Madamandiya, Dedigamuwa'),
    ('company_email', 'saraatek25@gmail.com'),
    ('company_phone', '+94 72 2828 100'),
    ('bank_name', 'Commercial Bank'),
    ('bank_account_name', 'N.G.C.N Ariyarathna'),
    ('bank_account_number', '8117011598'),
    ('bank_branch', 'Pitakotte')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password_hash, name, role) VALUES
    ('admin', '12345678901234567890', 'Administrator', 'admin')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for repair details with customer info
CREATE OR REPLACE VIEW repair_details AS
SELECT 
    r.*,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email,
    c.address as customer_address,
    comp.name as company_name
FROM repairs r
LEFT JOIN customers c ON r.customer_id = c.id
LEFT JOIN companies comp ON r.company_id = comp.id;

-- View for payment summary
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    repair_id,
    SUM(amount) as total_paid,
    COUNT(*) as payment_count,
    MIN(created_at) as first_payment,
    MAX(created_at) as last_payment
FROM payments
GROUP BY repair_id;

-- View for warranty status
CREATE OR REPLACE VIEW warranty_status AS
SELECT 
    w.id,
    w.repair_id,
    w.warranty_type,
    w.start_date,
    w.end_date,
    w.duration_label,
    w.duration_days,
    w.status,
    w.claim_notes,
    w.created_at,
    c.name as customer_name
FROM warranties w
JOIN repairs r ON w.repair_id = r.id
JOIN customers c ON r.customer_id = c.id
WHERE w.end_date >= CURRENT_DATE;
