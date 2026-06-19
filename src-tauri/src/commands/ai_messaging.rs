use crate::commands::notifications;
use crate::commands::notifications::Notification;
use crate::commands::openrouter;
use crate::db::Database;
use chrono::Local;
use rusqlite::Connection;
use tauri::State;

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

fn build_repair_context(conn: &Connection, repair_id: &str) -> Result<String, String> {
    let (customer_name, device_brand, device_model, device_type, technician_notes): (
        String,
        String,
        Option<String>,
        Option<String>,
        Option<String>,
    ) = conn
        .query_row(
            "SELECT c.name, r.brand, r.model, r.device_type, r.tech_findings
             FROM repairs r JOIN customers c ON r.customer_id = c.id WHERE r.id = ?",
            rusqlite::params![repair_id],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                ))
            },
        )
        .map_err(|e| format!("failed to load repair context: {e}"))?;

    let model_str = device_model.unwrap_or_default();
    let type_str = device_type.unwrap_or_default();
    let notes_str = technician_notes.unwrap_or_default();

    let device_line = if !model_str.is_empty() {
        format!("{} {} ({})", device_brand, model_str, type_str)
    } else if !type_str.is_empty() {
        format!("{} ({})", device_brand, type_str)
    } else {
        device_brand
    };

    Ok(format!(
        "Customer: {}\nDevice: {}\nTechnician notes: {}",
        customer_name, device_line, notes_str
    ))
}

pub(crate) fn draft_notification_message_inner(
    conn: &Connection,
    repair_id: &str,
    mode: &str,
    goal: Option<&str>,
) -> Result<String, String> {
    let api_key = get_setting(conn, "openrouter_api_key")?
        .ok_or_else(|| "OpenRouter API key not configured".to_string())?;
    if api_key.is_empty() {
        return Err("OpenRouter API key is empty".to_string());
    }

    let model = get_setting(conn, "openrouter_model")?
        .unwrap_or_else(|| "meta-llama/llama-3.1-8b-instruct:free".into());
    if model.is_empty() {
        return Err("OpenRouter model is not configured".to_string());
    }

    let context = build_repair_context(conn, repair_id)?;

    let (system_prompt, user_prompt) = if mode == "template" {
        (
            "You are a professional WhatsApp message writer for a computer repair shop. \
             Rewrite the notification message below naturally and professionally. \
             Keep it concise, warm, and clear. Use the same structure but vary the wording. \
             Do not add information that isn't in the context."
                .to_string(),
            format!(
                "Rewrite this ready-for-collection notification:\n\n{}",
                context
            ),
        )
    } else {
        let goal_text = goal.unwrap_or("notify the customer");
        (
            "You are a professional WhatsApp message writer for a computer repair shop. \
             Given the repair context and the technician's goal, draft a short WhatsApp message. \
             Keep it concise, warm, and professional. Never include anything not supported by the context."
                .to_string(),
            format!(
                "Repair context:\n{}\n\nTechnician's goal: {}",
                context, goal_text
            ),
        )
    };

    openrouter::call_openrouter(&system_prompt, &user_prompt, &api_key, &model)
}

pub(crate) fn send_custom_notification_inner(
    conn: &Connection,
    repair_id: &str,
    message: &str,
) -> Result<Notification, String> {
    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let customer_phone: String = conn
        .query_row(
            "SELECT c.phone FROM repairs r JOIN customers c ON r.customer_id = c.id WHERE r.id = ?",
            rusqlite::params![repair_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("failed to load customer phone: {e}"))?;

    let default_cc = get_setting(conn, "default_country_code")?.unwrap_or_else(|| "94".into());
    let fonnte_token = get_setting(conn, "fonnte_api_token")?
        .ok_or_else(|| "Fonnte API token not configured".to_string())?;
    if fonnte_token.is_empty() {
        return Err("Fonnte API token is empty".to_string());
    }

    let formatted_phone = notifications::format_phone(&customer_phone, &default_cc)?;

    let url = "https://api.fonnte.com/send";
    let body = serde_json::json!({
        "target": formatted_phone,
        "message": message,
        "countryCode": default_cc,
    });

    let response = ureq::post(url)
        .header("Authorization", &fonnte_token)
        .send_json(&body);

    let (status, raw_response) = match response {
        Ok(resp) => match resp.into_body().read_to_string() {
            Ok(body_text) => ("sent".to_string(), Some(body_text)),
            Err(e) => ("sent".to_string(), Some(format!("read error: {e}"))),
        },
        Err(e) => {
            let err_msg = format!("Fonnte API error: {e}");
            ("failed".to_string(), Some(err_msg))
        }
    };

    conn.execute(
        "INSERT INTO notifications (repair_id, type, status, fonnte_response, sent_at) VALUES (?, ?, ?, ?, ?)",
        rusqlite::params![repair_id, "custom", status, raw_response, now],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(Notification {
        id,
        repair_id: repair_id.to_string(),
        notif_type: "custom".into(),
        status,
        fonnte_response: raw_response,
        sent_at: now,
    })
}

pub(crate) fn summarize_customer_history_inner(
    conn: &Connection,
    customer_id: i64,
) -> Result<String, String> {
    let api_key = get_setting(conn, "openrouter_api_key")?
        .ok_or_else(|| "OpenRouter API key not configured".to_string())?;
    if api_key.is_empty() {
        return Err("OpenRouter API key is empty".to_string());
    }

    let model = get_setting(conn, "openrouter_model")?
        .unwrap_or_else(|| "meta-llama/llama-3.1-8b-instruct:free".into());

    let mut stmt = conn
        .prepare(
            "SELECT r.id, r.brand, r.model, r.reported_problem, r.status, r.completed_at, r.tech_findings
             FROM repairs r WHERE r.customer_id = ? ORDER BY r.received_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([customer_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, Option<String>>(6)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut history_text = String::from("Customer repair history:\n");
    for row in rows {
        let (id, brand, model, problem, status, completed, findings) =
            row.map_err(|e| e.to_string())?;
        let model_str = model.unwrap_or_default();
        let completed_str = completed.unwrap_or_else(|| "not yet".to_string());
        let findings_str = findings.unwrap_or_default();
        history_text.push_str(&format!(
            "- Repair {}: {} {} — Problem: {} — Status: {} — Completed: {} — Notes: {}\n",
            id, brand, model_str, problem, status, completed_str, findings_str
        ));
    }

    let system_prompt = "You are a helpful assistant that summarizes customer repair history \
        for a shop technician. Given the list of past repairs, write a 2-3 sentence summary: \
        what patterns or recurring issues you notice, the last visit date, and anything \
        worth knowing before starting a new repair for this customer."
        .to_string();

    openrouter::call_openrouter(&system_prompt, &history_text, &api_key, &model)
}

#[tauri::command]
pub fn draft_notification_message(
    repair_id: String,
    mode: String,
    goal: Option<String>,
    db: State<Database>,
) -> Result<String, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    draft_notification_message_inner(&conn, &repair_id, &mode, goal.as_deref())
}

#[tauri::command]
pub fn send_custom_notification(
    repair_id: String,
    message: String,
    db: State<Database>,
) -> Result<Notification, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    send_custom_notification_inner(&conn, &repair_id, &message)
}

#[tauri::command]
pub fn summarize_customer_history(customer_id: i64, db: State<Database>) -> Result<String, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    summarize_customer_history_inner(&conn, customer_id)
}
