use crate::commands::notifications::Notification;
use crate::db::Database;
use chrono::Utc;
use lettre::message::Mailbox;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};
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

pub(crate) struct SmtpConfig {
    host: String,
    port: u16,
    username: String,
    password: String,
    from_name: String,
    from_email: String,
}

fn load_smtp_config(conn: &Connection) -> Result<SmtpConfig, String> {
    let host = get_setting(conn, "smtp_host")?.unwrap_or_default();
    if host.is_empty() {
        return Err("Email is not configured yet — add SMTP details in Settings.".to_string());
    }
    let port: u16 = get_setting(conn, "smtp_port")?
        .unwrap_or_else(|| "587".to_string())
        .parse()
        .unwrap_or(587);
    let username = get_setting(conn, "smtp_username")?.unwrap_or_default();
    let password = get_setting(conn, "smtp_password")?.unwrap_or_default();
    if username.is_empty() || password.is_empty() {
        return Err("SMTP username/password not configured in Settings.".to_string());
    }
    let from_name = get_setting(conn, "smtp_from_name")?.unwrap_or_else(|| "SaraaTEK".to_string());
    let from_email = {
        let v = get_setting(conn, "smtp_from_email")?.unwrap_or_default();
        if v.is_empty() {
            username.clone()
        } else {
            v
        }
    };

    Ok(SmtpConfig {
        host,
        port,
        username,
        password,
        from_name,
        from_email,
    })
}

/// Sends a plain-text email via SMTP. Returns Ok(()) on success, or a
/// human-readable error string (network failure, bad credentials, invalid
/// address, etc.) on failure — never panics.
pub(crate) fn send_email_raw(
    cfg: &SmtpConfig,
    to_email: &str,
    to_name: &str,
    subject: &str,
    body: &str,
) -> Result<(), String> {
    let from_address: lettre::Address = cfg
        .from_email
        .parse()
        .map_err(|e| format!("Invalid shop from-email '{}': {e}", cfg.from_email))?;
    let from_mailbox = Mailbox::new(Some(cfg.from_name.clone()), from_address);

    let to_address: lettre::Address = to_email
        .parse()
        .map_err(|e| format!("Invalid customer email '{to_email}': {e}"))?;
    let to_mailbox = Mailbox::new(
        if to_name.is_empty() {
            None
        } else {
            Some(to_name.to_string())
        },
        to_address,
    );

    let email = Message::builder()
        .from(from_mailbox)
        .to(to_mailbox)
        .subject(subject)
        .body(body.to_string())
        .map_err(|e| format!("Failed to build email: {e}"))?;

    let creds = Credentials::new(cfg.username.clone(), cfg.password.clone());

    let builder_result = if cfg.port == 465 {
        SmtpTransport::relay(&cfg.host)
    } else {
        SmtpTransport::starttls_relay(&cfg.host)
    };

    let mailer = builder_result
        .map_err(|e| format!("Could not connect to SMTP host '{}': {e}", cfg.host))?
        .port(cfg.port)
        .credentials(creds)
        .build();

    mailer
        .send(&email)
        .map_err(|e| format!("Failed to send email: {e}"))?;

    Ok(())
}

pub(crate) fn send_ready_email_notification_inner(
    conn: &Connection,
    repair_id: &str,
) -> Result<Notification, String> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let (customer_name, customer_email, device_brand, device_model, device_type): (
        String,
        Option<String>,
        String,
        Option<String>,
        Option<String>,
    ) = conn
        .query_row(
            "SELECT c.name, c.email, r.brand, r.model, r.device_type
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
        .map_err(|e| format!("failed to load repair data: {e}"))?;

    let customer_email = customer_email
        .filter(|e| !e.is_empty())
        .ok_or_else(|| "This customer has no email address on file.".to_string())?;

    let shop_name = get_setting(conn, "shop_name")?.unwrap_or_else(|| "SaraaTEK".into());
    let shop_address = get_setting(conn, "shop_address")?.unwrap_or_default();
    let shop_phone = get_setting(conn, "shop_phone")?.unwrap_or_default();

    let model_str = device_model.as_deref().unwrap_or("");
    let type_str = device_type.as_deref().unwrap_or("");
    let device_line = if model_str.is_empty() {
        if type_str.is_empty() {
            device_brand.clone()
        } else {
            format!("{} ({})", device_brand, type_str)
        }
    } else {
        format!("{} {} ({})", device_brand, model_str, type_str)
    };

    let subject = format!("Your device is ready for collection — {}", repair_id);
    let body = format!(
        "Dear {},\n\n\
         Your device is now ready for collection at {}.\n\n\
         Repair ID: {}\n\
         Device: {}\n\n\
         Please visit us at your convenience to collect it.\n\n\
         {}\n\
         {}\n\n\
         Thank you for choosing {}.\n\n\
         Regards,\n{}",
        customer_name,
        shop_name,
        repair_id,
        device_line,
        shop_address,
        shop_phone,
        shop_name,
        shop_name
    );

    let cfg = load_smtp_config(conn)?;
    let send_result = send_email_raw(&cfg, &customer_email, &customer_name, &subject, &body);

    let (status, raw_response) = match send_result {
        Ok(()) => (
            "sent".to_string(),
            Some(format!("Sent to {}", customer_email)),
        ),
        Err(e) => ("failed".to_string(), Some(e)),
    };

    conn.execute(
        "INSERT INTO notifications (repair_id, type, status, fonnte_response, sent_at, channel) VALUES (?, ?, ?, ?, ?, 'email')",
        rusqlite::params![repair_id, "ready_for_collection", status, raw_response, now],
    )
    .map_err(|e| e.to_string())?;

    if status == "failed" {
        return Err(raw_response.unwrap_or_else(|| "Email send failed".to_string()));
    }

    let id = conn.last_insert_rowid();
    Ok(Notification {
        id,
        repair_id: repair_id.to_string(),
        notif_type: "ready_for_collection".into(),
        status,
        fonnte_response: raw_response,
        sent_at: now,
        channel: "email".into(),
    })
}

pub(crate) fn send_custom_email_inner(
    conn: &Connection,
    repair_id: &str,
    subject: &str,
    message: &str,
) -> Result<Notification, String> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let (customer_name, customer_email): (String, Option<String>) = conn
        .query_row(
            "SELECT c.name, c.email FROM repairs r JOIN customers c ON r.customer_id = c.id WHERE r.id = ?",
            rusqlite::params![repair_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| format!("failed to load customer data: {e}"))?;

    let customer_email = customer_email
        .filter(|e| !e.is_empty())
        .ok_or_else(|| "This customer has no email address on file.".to_string())?;

    let cfg = load_smtp_config(conn)?;
    let send_result = send_email_raw(&cfg, &customer_email, &customer_name, subject, message);

    let (status, raw_response) = match send_result {
        Ok(()) => (
            "sent".to_string(),
            Some(format!("Sent to {}", customer_email)),
        ),
        Err(e) => ("failed".to_string(), Some(e)),
    };

    conn.execute(
        "INSERT INTO notifications (repair_id, type, status, fonnte_response, sent_at, channel) VALUES (?, ?, ?, ?, ?, 'email')",
        rusqlite::params![repair_id, "custom", status, raw_response, now],
    )
    .map_err(|e| e.to_string())?;

    if status == "failed" {
        return Err(raw_response.unwrap_or_else(|| "Email send failed".to_string()));
    }

    let id = conn.last_insert_rowid();
    Ok(Notification {
        id,
        repair_id: repair_id.to_string(),
        notif_type: "custom".into(),
        status,
        fonnte_response: raw_response,
        sent_at: now,
        channel: "email".into(),
    })
}

#[tauri::command]
pub fn send_ready_email_notification(
    repair_id: String,
    token: String, db: State<Database>,
) -> Result<Notification, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    send_ready_email_notification_inner(&conn, &repair_id)
}

#[tauri::command]
pub fn send_custom_email(
    repair_id: String,
    subject: String,
    message: String,
    token: String, db: State<Database>,
) -> Result<Notification, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    send_custom_email_inner(&conn, &repair_id, &subject, &message)
}
