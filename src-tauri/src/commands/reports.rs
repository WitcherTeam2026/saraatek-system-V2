use crate::db::Database;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
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
