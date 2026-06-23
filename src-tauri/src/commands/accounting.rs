use crate::db::Database;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Account {
    pub id: i64,
    pub code: String,
    pub name: String,
    pub account_type: String,
    pub parent_id: Option<i64>,
    pub is_active: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JournalEntry {
    pub id: i64,
    pub entry_date: String,
    pub description: String,
    pub source_type: Option<String>,
    pub source_id: Option<String>,
    pub is_posted: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JournalItem {
    pub id: i64,
    pub entry_id: i64,
    pub account_id: i64,
    pub account_code: String,
    pub account_name: String,
    pub debit: f64,
    pub credit: f64,
    pub note: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JournalEntryWithItems {
    pub entry: JournalEntry,
    pub items: Vec<JournalItem>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LedgerEntry {
    pub date: String,
    pub description: String,
    pub debit: f64,
    pub credit: f64,
    pub balance: f64,
    pub entry_id: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AccountBalance {
    pub account_id: i64,
    pub code: String,
    pub name: String,
    pub account_type: String,
    pub balance: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProfitLossReport {
    pub revenue: Vec<AccountLine>,
    pub total_revenue: f64,
    pub cogs: Vec<AccountLine>,
    pub total_cogs: f64,
    pub gross_profit: f64,
    pub period_start: String,
    pub period_end: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BalanceSheetReport {
    pub assets: Vec<AccountLine>,
    pub total_assets: f64,
    pub liabilities: Vec<AccountLine>,
    pub total_liabilities: f64,
    pub equity: Vec<AccountLine>,
    pub total_equity: f64,
    pub as_of_date: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AccountLine {
    pub code: String,
    pub name: String,
    pub balance: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreateJournalEntryInput {
    pub entry_date: String,
    pub description: String,
    pub source_type: Option<String>,
    pub source_id: Option<String>,
    pub items: Vec<JournalItemInput>,
}

#[derive(Debug, Deserialize)]
pub struct JournalItemInput {
    pub account_id: i64,
    pub debit: f64,
    pub credit: f64,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct OpeningBalanceInput {
    pub account_id: i64,
    pub balance: f64,
}

// ── List all accounts ──────────────────────────────────────────────

#[tauri::command]
pub fn list_accounts(db: State<Database>) -> Result<Vec<Account>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, code, name, type, parent_id, is_active FROM chart_of_accounts ORDER BY code",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Account {
                id: row.get(0)?,
                code: row.get(1)?,
                name: row.get(2)?,
                account_type: row.get(3)?,
                parent_id: row.get(4)?,
                is_active: row.get::<_, i32>(5)? == 1,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut accounts = Vec::new();
    for row in rows {
        accounts.push(row.map_err(|e| e.to_string())?);
    }
    Ok(accounts)
}

// ── Get account balances as of date ────────────────────────────────

#[tauri::command]
pub fn get_account_balances(as_of_date: Option<String>, db: State<Database>) -> Result<Vec<AccountBalance>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let date_filter = as_of_date.unwrap_or_else(|| "9999-12-31".to_string());

    let mut stmt = conn
        .prepare(
            "
            SELECT 
                a.id, a.code, a.name, a.type,
                COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0) as balance
            FROM chart_of_accounts a
            LEFT JOIN journal_items ji ON ji.account_id = a.id
            LEFT JOIN journal_entries je ON je.id = ji.entry_id AND je.is_posted = 1 AND je.entry_date <= ?1
            WHERE a.is_active = 1
            GROUP BY a.id
            ORDER BY a.code
            ",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![date_filter], |row| {
            Ok(AccountBalance {
                account_id: row.get(0)?,
                code: row.get(1)?,
                name: row.get(2)?,
                account_type: row.get(3)?,
                balance: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut balances = Vec::new();
    for row in rows {
        balances.push(row.map_err(|e| e.to_string())?);
    }
    Ok(balances)
}

// ── Get ledger for an account ──────────────────────────────────────

#[tauri::command]
pub fn get_account_ledger(
    account_id: i64,
    start_date: Option<String>,
    end_date: Option<String>,
    db: State<Database>,
) -> Result<Vec<LedgerEntry>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let start = start_date.unwrap_or_else(|| "0000-01-01".to_string());
    let end = end_date.unwrap_or_else(|| "9999-12-31".to_string());

    let mut stmt = conn
        .prepare(
            "
            SELECT je.entry_date, je.description, ji.debit, ji.credit, je.id
            FROM journal_items ji
            JOIN journal_entries je ON je.id = ji.entry_id
            WHERE ji.account_id = ?1 AND je.is_posted = 1 AND je.entry_date BETWEEN ?2 AND ?3
            ORDER BY je.entry_date, je.id
            ",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![account_id, start, end], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, f64>(2)?,
                row.get::<_, f64>(3)?,
                row.get::<_, i64>(4)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut entries = Vec::new();
    let mut running_balance: f64 = 0.0;

    for row in rows {
        let (date, description, debit, credit, entry_id) = row.map_err(|e| e.to_string())?;
        running_balance += debit - credit;
        entries.push(LedgerEntry {
            date,
            description,
            debit,
            credit,
            balance: running_balance,
            entry_id,
        });
    }

    Ok(entries)
}

// ── Create journal entry ───────────────────────────────────────────

#[tauri::command]
pub fn create_journal_entry(
    input: CreateJournalEntryInput,
    db: State<Database>,
) -> Result<JournalEntry, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Validate: debits must equal credits
    let total_debit: f64 = input.items.iter().map(|i| i.debit).sum();
    let total_credit: f64 = input.items.iter().map(|i| i.credit).sum();
    if (total_debit - total_credit).abs() > 0.01 {
        return Err(format!(
            "Debits ({}) must equal credits ({})",
            total_debit, total_credit
        ));
    }

    conn.execute(
        "INSERT INTO journal_entries (entry_date, description, source_type, source_id, is_posted) VALUES (?1, ?2, ?3, ?4, 1)",
        params![input.entry_date, input.description, input.source_type, input.source_id],
    )
    .map_err(|e| e.to_string())?;

    let entry_id = conn.last_insert_rowid();

    for item in &input.items {
        conn.execute(
            "INSERT INTO journal_items (entry_id, account_id, debit, credit, note) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![entry_id, item.account_id, item.debit, item.credit, item.note],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(JournalEntry {
        id: entry_id,
        entry_date: input.entry_date,
        description: input.description,
        source_type: input.source_type,
        source_id: input.source_id,
        is_posted: true,
        created_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
    })
}

// ── Get journal entry with items ───────────────────────────────────

#[tauri::command]
pub fn get_journal_entry(entry_id: i64, db: State<Database>) -> Result<Option<JournalEntryWithItems>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let entry = conn
        .query_row(
            "SELECT id, entry_date, description, source_type, source_id, is_posted, created_at FROM journal_entries WHERE id = ?1",
            params![entry_id],
            |row| {
                Ok(JournalEntry {
                    id: row.get(0)?,
                    entry_date: row.get(1)?,
                    description: row.get(2)?,
                    source_type: row.get(3)?,
                    source_id: row.get(4)?,
                    is_posted: row.get::<_, i32>(5)? == 1,
                    created_at: row.get(6)?,
                })
            },
        )
        .ok();

    let entry = match entry {
        Some(e) => e,
        None => return Ok(None),
    };

    let mut stmt = conn
        .prepare(
            "SELECT ji.id, ji.entry_id, ji.account_id, a.code, a.name, ji.debit, ji.credit, ji.note
             FROM journal_items ji
             JOIN chart_of_accounts a ON a.id = ji.account_id
             WHERE ji.entry_id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map(params![entry_id], |row| {
            Ok(JournalItem {
                id: row.get(0)?,
                entry_id: row.get(1)?,
                account_id: row.get(2)?,
                account_code: row.get(3)?,
                account_name: row.get(4)?,
                debit: row.get(5)?,
                credit: row.get(6)?,
                note: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(Some(JournalEntryWithItems { entry, items }))
}

// ── List journal entries ───────────────────────────────────────────

#[tauri::command]
pub fn list_journal_entries(
    start_date: Option<String>,
    end_date: Option<String>,
    limit: Option<i64>,
    db: State<Database>,
) -> Result<Vec<JournalEntry>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let start = start_date.unwrap_or_else(|| "0000-01-01".to_string());
    let end = end_date.unwrap_or_else(|| "9999-12-31".to_string());
    let limit = limit.unwrap_or(100);

    let mut stmt = conn
        .prepare(
            "SELECT id, entry_date, description, source_type, source_id, is_posted, created_at
             FROM journal_entries
             WHERE is_posted = 1 AND entry_date BETWEEN ?1 AND ?2
             ORDER BY entry_date DESC, id DESC
             LIMIT ?3",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![start, end, limit], |row| {
            Ok(JournalEntry {
                id: row.get(0)?,
                entry_date: row.get(1)?,
                description: row.get(2)?,
                source_type: row.get(3)?,
                source_id: row.get(4)?,
                is_posted: row.get::<_, i32>(5)? == 1,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut entries = Vec::new();
    for row in rows {
        entries.push(row.map_err(|e| e.to_string())?);
    }
    Ok(entries)
}

// ── Profit & Loss Report ───────────────────────────────────────────

#[tauri::command]
pub fn get_profit_loss(
    start_date: String,
    end_date: String,
    db: State<Database>,
) -> Result<ProfitLossReport, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "
            SELECT a.code, a.name,
                COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0) as balance
            FROM chart_of_accounts a
            LEFT JOIN journal_items ji ON ji.account_id = a.id
            LEFT JOIN journal_entries je ON je.id = ji.entry_id AND je.is_posted = 1 AND je.entry_date BETWEEN ?1 AND ?2
            WHERE a.type = 'income' AND a.is_active = 1
            GROUP BY a.id ORDER BY a.code
            ",
        )
        .map_err(|e| e.to_string())?;

    let revenue: Vec<AccountLine> = stmt
        .query_map(params![start_date, end_date], |row| {
            Ok(AccountLine {
                code: row.get(0)?,
                name: row.get(1)?,
                balance: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let total_revenue: f64 = revenue.iter().map(|a| a.balance).sum();

    let mut stmt = conn
        .prepare(
            "
            SELECT a.code, a.name,
                COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0) as balance
            FROM chart_of_accounts a
            LEFT JOIN journal_items ji ON ji.account_id = a.id
            LEFT JOIN journal_entries je ON je.id = ji.entry_id AND je.is_posted = 1 AND je.entry_date BETWEEN ?1 AND ?2
            WHERE a.type = 'cogs' AND a.is_active = 1
            GROUP BY a.id ORDER BY a.code
            ",
        )
        .map_err(|e| e.to_string())?;

    let cogs: Vec<AccountLine> = stmt
        .query_map(params![start_date, end_date], |row| {
            Ok(AccountLine {
                code: row.get(0)?,
                name: row.get(1)?,
                balance: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let total_cogs: f64 = cogs.iter().map(|a| a.balance).sum();

    Ok(ProfitLossReport {
        revenue,
        total_revenue,
        cogs,
        total_cogs,
        gross_profit: total_revenue - total_cogs,
        period_start: start_date,
        period_end: end_date,
    })
}

// ── Balance Sheet Report ───────────────────────────────────────────

#[tauri::command]
pub fn get_balance_sheet(
    as_of_date: String,
    db: State<Database>,
) -> Result<BalanceSheetReport, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "
            SELECT a.code, a.name,
                COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0) as balance
            FROM chart_of_accounts a
            LEFT JOIN journal_items ji ON ji.account_id = a.id
            LEFT JOIN journal_entries je ON je.id = ji.entry_id AND je.is_posted = 1 AND je.entry_date <= ?1
            WHERE a.type = 'asset' AND a.is_active = 1
            GROUP BY a.id ORDER BY a.code
            ",
        )
        .map_err(|e| e.to_string())?;

    let assets: Vec<AccountLine> = stmt
        .query_map(params![as_of_date], |row| {
            Ok(AccountLine {
                code: row.get(0)?,
                name: row.get(1)?,
                balance: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let total_assets: f64 = assets.iter().map(|a| a.balance).sum();

    let mut stmt = conn
        .prepare(
            "
            SELECT a.code, a.name,
                COALESCE(SUM(ji.credit), 0) - COALESCE(SUM(ji.debit), 0) as balance
            FROM chart_of_accounts a
            LEFT JOIN journal_items ji ON ji.account_id = a.id
            LEFT JOIN journal_entries je ON je.id = ji.entry_id AND je.is_posted = 1 AND je.entry_date <= ?1
            WHERE a.type = 'liability' AND a.is_active = 1
            GROUP BY a.id ORDER BY a.code
            ",
        )
        .map_err(|e| e.to_string())?;

    let liabilities: Vec<AccountLine> = stmt
        .query_map(params![as_of_date], |row| {
            Ok(AccountLine {
                code: row.get(0)?,
                name: row.get(1)?,
                balance: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let total_liabilities: f64 = liabilities.iter().map(|a| a.balance).sum();

    let mut stmt = conn
        .prepare(
            "
            SELECT a.code, a.name,
                COALESCE(SUM(ji.credit), 0) - COALESCE(SUM(ji.debit), 0) as balance
            FROM chart_of_accounts a
            LEFT JOIN journal_items ji ON ji.account_id = a.id
            LEFT JOIN journal_entries je ON je.id = ji.entry_id AND je.is_posted = 1 AND je.entry_date <= ?1
            WHERE a.type = 'equity' AND a.is_active = 1
            GROUP BY a.id ORDER BY a.code
            ",
        )
        .map_err(|e| e.to_string())?;

    let equity: Vec<AccountLine> = stmt
        .query_map(params![as_of_date], |row| {
            Ok(AccountLine {
                code: row.get(0)?,
                name: row.get(1)?,
                balance: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let total_equity: f64 = equity.iter().map(|a| a.balance).sum();

    Ok(BalanceSheetReport {
        assets,
        total_assets,
        liabilities,
        total_liabilities,
        equity,
        total_equity,
        as_of_date,
    })
}

// ── Save opening balances ──────────────────────────────────────────

#[tauri::command]
pub fn save_opening_balances(
    balances: Vec<OpeningBalanceInput>,
    entry_date: String,
    db: State<Database>,
) -> Result<JournalEntry, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Check if opening balances already exist
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM journal_entries WHERE source_type = 'opening'",
            [],
            |row| row.get::<_, i64>(0),
        )
        .map_err(|e| e.to_string())?
        > 0;

    if exists {
        return Err("Opening balances already recorded. Delete existing opening entry first.".to_string());
    }

    // Create journal entry
    conn.execute(
        "INSERT INTO journal_entries (entry_date, description, source_type, is_posted) VALUES (?1, 'Opening Balances', 'opening', 1)",
        params![entry_date],
    )
    .map_err(|e| e.to_string())?;

    let entry_id = conn.last_insert_rowid();

    // For each balance: debit if positive (assets), credit if positive (liabilities/equity)
    for b in &balances {
        if b.balance == 0.0 {
            continue;
        }

        let account_type: String = conn
            .query_row(
                "SELECT type FROM chart_of_accounts WHERE id = ?1",
                params![b.account_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;

        let (debit, credit) = match account_type.as_str() {
            "asset" | "cogs" | "expense" => {
                if b.balance > 0.0 {
                    (b.balance, 0.0)
                } else {
                    (0.0, -b.balance)
                }
            }
            _ => {
                // liability, equity, income
                if b.balance > 0.0 {
                    (0.0, b.balance)
                } else {
                    (-b.balance, 0.0)
                }
            }
        };

        conn.execute(
            "INSERT INTO journal_items (entry_id, account_id, debit, credit, note) VALUES (?1, ?2, ?3, ?4, 'Opening balance')",
            params![entry_id, b.account_id, debit, credit],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(JournalEntry {
        id: entry_id,
        entry_date,
        description: "Opening Balances".to_string(),
        source_type: Some("opening".to_string()),
        source_id: None,
        is_posted: true,
        created_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
    })
}

// ── Check if opening balances exist ────────────────────────────────

#[tauri::command]
pub fn has_opening_balances(db: State<Database>) -> Result<bool, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM journal_entries WHERE source_type = 'opening'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    Ok(count > 0)
}

// ── Delete opening balances ────────────────────────────────────────

#[tauri::command]
pub fn delete_opening_balances(db: State<Database>) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let entry_id: Option<i64> = conn
        .query_row(
            "SELECT id FROM journal_entries WHERE source_type = 'opening' LIMIT 1",
            [],
            |row| row.get(0),
        )
        .ok();

    if let Some(id) = entry_id {
        conn.execute("DELETE FROM journal_items WHERE entry_id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM journal_entries WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}
