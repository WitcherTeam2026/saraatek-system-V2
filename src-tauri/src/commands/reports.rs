use crate::db::Database;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MonthlyRevenue {
    pub month: String,
    pub amount: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MethodSplit {
    pub method: String,
    pub amount: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RevenueReport {
    pub total: f64,
    pub count: i64,
    pub monthly: Vec<MonthlyRevenue>,
    pub by_method: Vec<MethodSplit>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StatusCount {
    pub status: String,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TypeSplit {
    pub customer_type: String,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VolumeReport {
    pub total: i64,
    pub by_status: Vec<StatusCount>,
    pub by_type: Vec<TypeSplit>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TechnicianPerf {
    pub technician_name: String,
    pub repairs_assigned: i64,
    pub repairs_completed: i64,
    pub avg_days: f64,
    pub total_revenue: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReportsSummary {
    pub revenue: RevenueReport,
    pub volume: VolumeReport,
    pub technician_performance: Vec<TechnicianPerf>,
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

pub(crate) fn get_revenue_report_inner(
    conn: &Connection,
    start_date: &str,
    end_date: &str,
) -> Result<RevenueReport, String> {
    let (total, count): (f64, i64) = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0), COUNT(*) FROM payments WHERE paid_at >= ? AND paid_at < DATE(?, '+1 day')",
            rusqlite::params![start_date, end_date],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT strftime('%Y-%m', paid_at) as month, COALESCE(SUM(amount), 0)
             FROM payments WHERE paid_at >= ? AND paid_at < DATE(?, '+1 day')
             GROUP BY month ORDER BY month",
        )
        .map_err(|e| e.to_string())?;

    let monthly: Vec<MonthlyRevenue> = stmt
        .query_map(rusqlite::params![start_date, end_date], |row| {
            Ok(MonthlyRevenue {
                month: row.get(0)?,
                amount: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let mut stmt2 = conn
        .prepare(
            "SELECT method, COALESCE(SUM(amount), 0)
             FROM payments WHERE paid_at >= ? AND paid_at < DATE(?, '+1 day')
             GROUP BY method",
        )
        .map_err(|e| e.to_string())?;

    let by_method: Vec<MethodSplit> = stmt2
        .query_map(rusqlite::params![start_date, end_date], |row| {
            Ok(MethodSplit {
                method: row.get(0)?,
                amount: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(RevenueReport {
        total,
        count,
        monthly,
        by_method,
    })
}

pub(crate) fn get_repair_volume_report_inner(
    conn: &Connection,
    start_date: &str,
    end_date: &str,
) -> Result<VolumeReport, String> {
    let total: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM repairs WHERE received_at >= ? AND received_at < DATE(?, '+1 day')",
            rusqlite::params![start_date, end_date],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT status, COUNT(*) FROM repairs
             WHERE received_at >= ? AND received_at < DATE(?, '+1 day')
             GROUP BY status ORDER BY status",
        )
        .map_err(|e| e.to_string())?;

    let by_status: Vec<StatusCount> = stmt
        .query_map(rusqlite::params![start_date, end_date], |row| {
            Ok(StatusCount {
                status: row.get(0)?,
                count: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let mut stmt2 = conn
        .prepare(
            "SELECT c.type, COUNT(*) FROM repairs r
             JOIN customers c ON r.customer_id = c.id
             WHERE r.received_at >= ? AND r.received_at < DATE(?, '+1 day')
             GROUP BY c.type",
        )
        .map_err(|e| e.to_string())?;

    let by_type: Vec<TypeSplit> = stmt2
        .query_map(rusqlite::params![start_date, end_date], |row| {
            Ok(TypeSplit {
                customer_type: row.get(0)?,
                count: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(VolumeReport {
        total,
        by_status,
        by_type,
    })
}

pub(crate) fn get_technician_performance_inner(
    conn: &Connection,
    start_date: &str,
    end_date: &str,
    include_inactive: bool,
) -> Result<Vec<TechnicianPerf>, String> {
    let active_filter = if include_inactive {
        String::new()
    } else {
        " AND t.active = 1".to_string()
    };

    let sql = format!(
        "SELECT t.name,
                COALESCE(assigned.cnt, 0),
                COALESCE(completed.cnt, 0),
                COALESCE(completed.avg_d, 0.0),
                COALESCE(rev.total, 0.0)
         FROM technicians t
         LEFT JOIN (
             SELECT technician_id, COUNT(*) as cnt
             FROM repairs
             WHERE received_at >= ? AND received_at < DATE(?, '+1 day')
             GROUP BY technician_id
         ) assigned ON t.id = assigned.technician_id
         LEFT JOIN (
             SELECT r.technician_id, COUNT(DISTINCT r.id) as cnt,
                    AVG(julianday(r.completed_at) - julianday(r.received_at)) as avg_d
             FROM repairs r
             JOIN repair_history rh ON r.id = rh.repair_id
             WHERE rh.status = 'Completed' AND rh.changed_at >= ? AND rh.changed_at < DATE(?, '+1 day')
             GROUP BY r.technician_id
         ) completed ON t.id = completed.technician_id
         LEFT JOIN (
             SELECT r.technician_id, COALESCE(SUM(p.amount), 0) as total
             FROM payments p
             JOIN repairs r ON p.repair_id = r.id
             WHERE p.paid_at >= ? AND p.paid_at < DATE(?, '+1 day')
             GROUP BY r.technician_id
         ) rev ON t.id = rev.technician_id
         WHERE 1=1{}",
        active_filter
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(
            rusqlite::params![start_date, end_date, start_date, end_date, start_date, end_date],
            |row| {
                Ok(TechnicianPerf {
                    technician_name: row.get(0)?,
                    repairs_assigned: row.get(1)?,
                    repairs_completed: row.get(2)?,
                    avg_days: row.get(3)?,
                    total_revenue: row.get(4)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }
    Ok(results)
}

pub(crate) fn get_reports_summary_inner(
    conn: &Connection,
    start_date: &str,
    end_date: &str,
    include_inactive: bool,
) -> Result<ReportsSummary, String> {
    let revenue = get_revenue_report_inner(conn, start_date, end_date)?;
    let volume = get_repair_volume_report_inner(conn, start_date, end_date)?;
    let technician_performance =
        get_technician_performance_inner(conn, start_date, end_date, include_inactive)?;

    Ok(ReportsSummary {
        revenue,
        volume,
        technician_performance,
    })
}

#[tauri::command]
pub fn get_revenue_report(
    start_date: String,
    end_date: String,
    db: State<Database>,
) -> Result<RevenueReport, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    get_revenue_report_inner(&conn, &start_date, &end_date)
}

#[tauri::command]
pub fn get_repair_volume_report(
    start_date: String,
    end_date: String,
    db: State<Database>,
) -> Result<VolumeReport, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    get_repair_volume_report_inner(&conn, &start_date, &end_date)
}

#[tauri::command]
pub fn get_technician_performance(
    start_date: String,
    end_date: String,
    include_inactive: bool,
    db: State<Database>,
) -> Result<Vec<TechnicianPerf>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    get_technician_performance_inner(&conn, &start_date, &end_date, include_inactive)
}

#[tauri::command]
pub fn get_reports_summary(
    start_date: String,
    end_date: String,
    include_inactive: bool,
    db: State<Database>,
) -> Result<ReportsSummary, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    get_reports_summary_inner(&conn, &start_date, &end_date, include_inactive)
}

// ── Phase 10: Advanced Analytics ───────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct RevenueAnalytics {
    pub monthly_trend: Vec<MonthlyRevenue>,
    pub growth_rate: f64,
    pub avg_monthly: f64,
    pub best_month: Option<MonthlyRevenue>,
    pub worst_month: Option<MonthlyRevenue>,
    pub by_payment_method: Vec<MethodSplit>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RepairAnalytics {
    pub total_repairs: i64,
    pub avg_duration_days: f64,
    pub by_brand: Vec<BrandCount>,
    pub by_status: Vec<StatusCount>,
    pub by_device_type: Vec<DeviceTypeCount>,
    pub common_issues: Vec<IssueCount>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BrandCount {
    pub brand: String,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceTypeCount {
    pub device_type: String,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IssueCount {
    pub issue: String,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CustomerAnalytics {
    pub total_customers: i64,
    pub new_customers: i64,
    pub repeat_customers: i64,
    pub repeat_rate: f64,
    pub avg_repairs_per_customer: f64,
    pub top_customers: Vec<TopCustomer>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TopCustomer {
    pub name: String,
    pub phone: String,
    pub repair_count: i64,
    pub total_spent: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WarrantyAnalytics {
    pub total_warranties: i64,
    pub active_warranties: i64,
    pub expired_warranties: i64,
    pub claims: i64,
    pub claim_rate: f64,
    pub avg_warranty_duration_days: f64,
    pub by_status: Vec<WarrantyStatusCount>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WarrantyStatusCount {
    pub status: String,
    pub count: i64,
}

#[tauri::command]
pub fn get_revenue_analytics(
    start_date: String,
    end_date: String,
    db: State<Database>,
) -> Result<RevenueAnalytics, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let monthly = get_revenue_report_inner(&conn, &start_date, &end_date)?;

    let growth_rate = if monthly.monthly.len() >= 2 {
        let first = monthly.monthly.first().map(|m| m.amount).unwrap_or(0.0);
        let last = monthly.monthly.last().map(|m| m.amount).unwrap_or(0.0);
        if first > 0.0 { ((last - first) / first) * 100.0 } else { 0.0 }
    } else {
        0.0
    };

    let avg_monthly = if monthly.monthly.is_empty() {
        0.0
    } else {
        monthly.total / monthly.monthly.len() as f64
    };

    let best_month = monthly.monthly.iter().max_by(|a, b| a.amount.partial_cmp(&b.amount).unwrap()).cloned();
    let worst_month = monthly.monthly.iter().min_by(|a, b| a.amount.partial_cmp(&b.amount).unwrap()).cloned();

    Ok(RevenueAnalytics {
        monthly_trend: monthly.monthly,
        growth_rate,
        avg_monthly,
        best_month,
        worst_month,
        by_payment_method: monthly.by_method,
    })
}

#[tauri::command]
pub fn get_repair_analytics(
    start_date: String,
    end_date: String,
    db: State<Database>,
) -> Result<RepairAnalytics, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let total_repairs: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM repairs WHERE received_at BETWEEN ?1 AND DATE(?2, '+1 day')",
            rusqlite::params![start_date, end_date],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let avg_duration_days: f64 = conn
        .query_row(
            "SELECT COALESCE(AVG(JULIANDAY(completed_at) - JULIANDAY(received_at)), 0) FROM repairs WHERE completed_at IS NOT NULL AND received_at BETWEEN ?1 AND DATE(?2, '+1 day')",
            rusqlite::params![start_date, end_date],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT brand, COUNT(*) as cnt FROM repairs WHERE received_at BETWEEN ?1 AND DATE(?2, '+1 day') GROUP BY brand ORDER BY cnt DESC LIMIT 10",
        )
        .map_err(|e| e.to_string())?;

    let by_brand: Vec<BrandCount> = stmt
        .query_map(rusqlite::params![start_date, end_date], |row| {
            Ok(BrandCount {
                brand: row.get(0)?,
                count: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let mut stmt = conn
        .prepare(
            "SELECT status, COUNT(*) as cnt FROM repairs WHERE received_at BETWEEN ?1 AND DATE(?2, '+1 day') GROUP BY status ORDER BY cnt DESC",
        )
        .map_err(|e| e.to_string())?;

    let by_status: Vec<StatusCount> = stmt
        .query_map(rusqlite::params![start_date, end_date], |row| {
            Ok(StatusCount {
                status: row.get(0)?,
                count: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let mut stmt = conn
        .prepare(
            "SELECT COALESCE(device_type, 'Unknown') as dt, COUNT(*) as cnt FROM repairs WHERE received_at BETWEEN ?1 AND DATE(?2, '+1 day') GROUP BY dt ORDER BY cnt DESC",
        )
        .map_err(|e| e.to_string())?;

    let by_device_type: Vec<DeviceTypeCount> = stmt
        .query_map(rusqlite::params![start_date, end_date], |row| {
            Ok(DeviceTypeCount {
                device_type: row.get(0)?,
                count: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let mut stmt = conn
        .prepare(
            "SELECT reported_problem, COUNT(*) as cnt FROM repairs WHERE received_at BETWEEN ?1 AND DATE(?2, '+1 day') GROUP BY reported_problem ORDER BY cnt DESC LIMIT 10",
        )
        .map_err(|e| e.to_string())?;

    let common_issues: Vec<IssueCount> = stmt
        .query_map(rusqlite::params![start_date, end_date], |row| {
            Ok(IssueCount {
                issue: row.get(0)?,
                count: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(RepairAnalytics {
        total_repairs,
        avg_duration_days,
        by_brand,
        by_status,
        by_device_type,
        common_issues,
    })
}

#[tauri::command]
pub fn get_customer_analytics(
    start_date: String,
    end_date: String,
    db: State<Database>,
) -> Result<CustomerAnalytics, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let total_customers: i64 = conn
        .query_row("SELECT COUNT(*) FROM customers", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let new_customers: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM customers WHERE created_at BETWEEN ?1 AND DATE(?2, '+1 day')",
            rusqlite::params![start_date, end_date],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let repeat_customers: i64 = conn
        .query_row(
            "SELECT COUNT(DISTINCT customer_id) FROM (SELECT customer_id, COUNT(*) as cnt FROM repairs WHERE received_at BETWEEN ?1 AND DATE(?2, '+1 day') GROUP BY customer_id HAVING cnt > 1)",
            rusqlite::params![start_date, end_date],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let total_repairs_in_period: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM repairs WHERE received_at BETWEEN ?1 AND DATE(?2, '+1 day')",
            rusqlite::params![start_date, end_date],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let unique_customers_in_period: i64 = conn
        .query_row(
            "SELECT COUNT(DISTINCT customer_id) FROM repairs WHERE received_at BETWEEN ?1 AND DATE(?2, '+1 day')",
            rusqlite::params![start_date, end_date],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let repeat_rate = if unique_customers_in_period > 0 {
        (repeat_customers as f64 / unique_customers_in_period as f64) * 100.0
    } else {
        0.0
    };

    let avg_repairs_per_customer = if unique_customers_in_period > 0 {
        total_repairs_in_period as f64 / unique_customers_in_period as f64
    } else {
        0.0
    };

    let mut stmt = conn
        .prepare(
            "SELECT c.name, c.phone, COUNT(r.id) as repair_count, COALESCE(SUM(p.amount), 0) as total_spent
             FROM customers c
             JOIN repairs r ON r.customer_id = c.id
             LEFT JOIN payments p ON p.repair_id = r.id
             WHERE r.received_at BETWEEN ?1 AND DATE(?2, '+1 day')
             GROUP BY c.id
             ORDER BY total_spent DESC
             LIMIT 10",
        )
        .map_err(|e| e.to_string())?;

    let top_customers: Vec<TopCustomer> = stmt
        .query_map(rusqlite::params![start_date, end_date], |row| {
            Ok(TopCustomer {
                name: row.get(0)?,
                phone: row.get(1)?,
                repair_count: row.get(2)?,
                total_spent: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(CustomerAnalytics {
        total_customers,
        new_customers,
        repeat_customers,
        repeat_rate,
        avg_repairs_per_customer,
        top_customers,
    })
}

#[tauri::command]
pub fn get_warranty_analytics(
    start_date: String,
    end_date: String,
    db: State<Database>,
) -> Result<WarrantyAnalytics, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let total_warranties: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM warranties WHERE created_at BETWEEN ?1 AND DATE(?2, '+1 day')",
            rusqlite::params![start_date, end_date],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let active_warranties: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM warranties WHERE expiry_date >= DATE('now') AND created_at BETWEEN ?1 AND DATE(?2, '+1 day')",
            rusqlite::params![start_date, end_date],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let expired_warranties: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM warranties WHERE expiry_date < DATE('now') AND created_at BETWEEN ?1 AND DATE(?2, '+1 day')",
            rusqlite::params![start_date, end_date],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let claims: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM repair_history WHERE status LIKE '%Warranty%' AND changed_at BETWEEN ?1 AND DATE(?2, '+1 day')",
            rusqlite::params![start_date, end_date],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let claim_rate = if total_warranties > 0 {
        (claims as f64 / total_warranties as f64) * 100.0
    } else {
        0.0
    };

    let avg_warranty_duration_days: f64 = conn
        .query_row(
            "SELECT COALESCE(AVG(JULIANDAY(expiry_date) - JULIANDAY(created_at)), 0) FROM warranties WHERE created_at BETWEEN ?1 AND DATE(?2, '+1 day')",
            rusqlite::params![start_date, end_date],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT 
                CASE 
                    WHEN expiry_date >= DATE('now') THEN 'Active'
                    ELSE 'Expired'
                END as status,
                COUNT(*) as cnt
             FROM warranties
             WHERE created_at BETWEEN ?1 AND DATE(?2, '+1 day')
             GROUP BY status",
        )
        .map_err(|e| e.to_string())?;

    let by_status: Vec<WarrantyStatusCount> = stmt
        .query_map(rusqlite::params![start_date, end_date], |row| {
            Ok(WarrantyStatusCount {
                status: row.get(0)?,
                count: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(WarrantyAnalytics {
        total_warranties,
        active_warranties,
        expired_warranties,
        claims,
        claim_rate,
        avg_warranty_duration_days,
        by_status,
    })
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
                id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL,
                name TEXT NOT NULL, phone TEXT UNIQUE NOT NULL
            );
            CREATE TABLE technicians (
                id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
                phone TEXT, active INTEGER DEFAULT 1
            );
            CREATE TABLE repairs (
                id TEXT PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id),
                status TEXT NOT NULL DEFAULT 'Received', brand TEXT NOT NULL,
                reported_problem TEXT NOT NULL, received_at DATETIME NOT NULL,
                technician_id INTEGER REFERENCES technicians(id),
                completed_at DATETIME
            );
            CREATE TABLE repair_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL REFERENCES repairs(id),
                status TEXT NOT NULL, note TEXT, changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id TEXT NOT NULL UNIQUE REFERENCES repairs(id),
                amount REAL NOT NULL, method TEXT NOT NULL,
                paid_at DATETIME NOT NULL
            );",
        )
        .unwrap();
        conn
    }

    fn seed_data(conn: &Connection) {
        conn.execute(
            "INSERT INTO customers (type, name, phone) VALUES ('individual','Alice','0000000000')",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO technicians (id, name, active) VALUES (1, 'John', 1), (2, 'Jane', 1)",
            [],
        )
        .unwrap();
        conn.execute("INSERT INTO repairs (id, customer_id, status, brand, reported_problem, received_at, technician_id, completed_at) VALUES ('R1', 1, 'Completed', 'Dell', 'Wont boot', '2026-01-15', 1, '2026-01-20')", []).unwrap();
        conn.execute("INSERT INTO repairs (id, customer_id, status, brand, reported_problem, received_at, technician_id) VALUES ('R2', 1, 'Repairing', 'HP', 'Screen crack', '2026-02-10', 2)", []).unwrap();
        conn.execute("INSERT INTO repair_history (repair_id, status, changed_at) VALUES ('R1', 'Completed', '2026-01-20')", []).unwrap();
        conn.execute("INSERT INTO payments (repair_id, amount, method, paid_at) VALUES ('R1', 500.0, 'cash', '2026-01-20')", []).unwrap();
    }

    #[test]
    fn revenue_report_should_return_aggregates() {
        let conn = setup();
        seed_data(&conn);
        let report = get_revenue_report_inner(&conn, "2026-01-01", "2026-12-31").unwrap();
        assert_eq!(report.total, 500.0);
        assert_eq!(report.count, 1);
    }

    #[test]
    fn revenue_report_should_be_empty_for_no_data() {
        let conn = setup();
        let report = get_revenue_report_inner(&conn, "2026-01-01", "2026-01-31").unwrap();
        assert_eq!(report.total, 0.0);
        assert_eq!(report.count, 0);
    }

    #[test]
    fn volume_report_should_count_by_status() {
        let conn = setup();
        seed_data(&conn);
        let report = get_repair_volume_report_inner(&conn, "2026-01-01", "2026-12-31").unwrap();
        assert_eq!(report.total, 2);
        assert!(report.by_status.iter().any(|s| s.status == "Completed"));
    }

    #[test]
    fn technician_performance_should_include_active() {
        let conn = setup();
        seed_data(&conn);
        let perf =
            get_technician_performance_inner(&conn, "2026-01-01", "2026-12-31", false).unwrap();
        assert!(perf.iter().any(|t| t.technician_name == "John"));
        assert!(perf.iter().any(|t| t.technician_name == "Jane"));
    }

    #[test]
    fn reports_summary_should_return_all_sections() {
        let conn = setup();
        seed_data(&conn);
        let summary = get_reports_summary_inner(&conn, "2026-01-01", "2026-12-31", false).unwrap();
        assert_eq!(summary.revenue.total, 500.0);
        assert_eq!(summary.volume.total, 2);
        assert!(summary.technician_performance.len() >= 2);
    }

    #[test]
    fn technician_performance_should_handle_empty_technicians() {
        let conn = setup();
        let perf =
            get_technician_performance_inner(&conn, "2026-01-01", "2026-12-31", false).unwrap();
        assert!(perf.is_empty());
    }
}
