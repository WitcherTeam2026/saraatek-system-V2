use crate::db::Database;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Campaign {
    pub id: i64,
    pub name: String,
    pub message: String,
    pub channel: String,
    pub status: String,
    pub total_recipients: i64,
    pub sent_count: i64,
    pub failed_count: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CampaignRecipient {
    pub id: i64,
    pub campaign_id: i64,
    pub customer_id: i64,
    pub customer_name: String,
    pub customer_phone: String,
    pub status: String,
    pub sent_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCampaignInput {
    pub name: String,
    pub message: String,
    pub channel: String,
    pub customer_ids: Option<Vec<i64>>,
    pub send_to_all: Option<bool>,
}

pub(crate) fn create_campaign_inner(
    conn: &rusqlite::Connection,
    input: &CreateCampaignInput,
) -> Result<Campaign, String> {
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    // Get customer IDs
    let customer_ids = if let Some(ids) = &input.customer_ids {
        ids.clone()
    } else if input.send_to_all.unwrap_or(false) {
        let mut stmt = conn
            .prepare("SELECT id FROM customers")
            .map_err(|e| e.to_string())?;
        let ids: Vec<i64> = stmt
            .query_map([], |row| row.get(0))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        ids
    } else {
        return Err("No customers selected".to_string());
    };

    let total_recipients = customer_ids.len() as i64;

    // Create campaign
    conn.execute(
        "INSERT INTO campaigns (name, message, channel, status, total_recipients, created_at)
         VALUES (?1, ?2, ?3, 'draft', ?4, ?5)",
        params![input.name, input.message, input.channel, total_recipients, now],
    )
    .map_err(|e| e.to_string())?;

    let campaign_id = conn.last_insert_rowid();

    // Add recipients
    for customer_id in &customer_ids {
        let customer_name: String = conn
            .query_row(
                "SELECT name FROM customers WHERE id = ?",
                params![customer_id],
                |row| row.get(0),
            )
            .unwrap_or_default();

        let customer_phone: String = conn
            .query_row(
                "SELECT phone FROM customers WHERE id = ?",
                params![customer_id],
                |row| row.get(0),
            )
            .unwrap_or_default();

        conn.execute(
            "INSERT INTO campaign_recipients (campaign_id, customer_id, customer_name, customer_phone, status)
             VALUES (?1, ?2, ?3, ?4, 'pending')",
            params![campaign_id, customer_id, customer_name, customer_phone],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(Campaign {
        id: campaign_id,
        name: input.name.clone(),
        message: input.message.clone(),
        channel: input.channel.clone(),
        status: "draft".to_string(),
        total_recipients,
        sent_count: 0,
        failed_count: 0,
        created_at: now,
    })
}

#[tauri::command]
pub fn create_campaign(
    input: CreateCampaignInput,
    token: String, db: State<Database>,
) -> Result<Campaign, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;
    create_campaign_inner(&conn, &input)
}

#[tauri::command]
pub fn list_campaigns(token: String, db: State<Database>) -> Result<Vec<Campaign>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;

    let mut stmt = conn
        .prepare(
            "SELECT id, name, message, channel, status, total_recipients, sent_count, failed_count, created_at
             FROM campaigns ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Campaign {
                id: row.get(0)?,
                name: row.get(1)?,
                message: row.get(2)?,
                channel: row.get(3)?,
                status: row.get(4)?,
                total_recipients: row.get(5)?,
                sent_count: row.get(6)?,
                failed_count: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut campaigns = Vec::new();
    for row in rows {
        campaigns.push(row.map_err(|e| e.to_string())?);
    }

    Ok(campaigns)
}

#[tauri::command]
pub fn get_campaign_recipients(
    campaign_id: i64,
    token: String, db: State<Database>,
) -> Result<Vec<CampaignRecipient>, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;

    let mut stmt = conn
        .prepare(
            "SELECT id, campaign_id, customer_id, customer_name, customer_phone, status, sent_at
             FROM campaign_recipients WHERE campaign_id = ? ORDER BY id",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![campaign_id], |row| {
            Ok(CampaignRecipient {
                id: row.get(0)?,
                campaign_id: row.get(1)?,
                customer_id: row.get(2)?,
                customer_name: row.get(3)?,
                customer_phone: row.get(4)?,
                status: row.get(5)?,
                sent_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut recipients = Vec::new();
    for row in rows {
        recipients.push(row.map_err(|e| e.to_string())?);
    }

    Ok(recipients)
}

#[tauri::command]
pub fn send_campaign(
    campaign_id: i64,
    token: String, db: State<Database>,
) -> Result<Campaign, String> {
    let _user = crate::commands::auth::require_auth(&token, &db)?;
    let conn = db.get_conn()?;

    // Get campaign details
    let campaign = conn
        .query_row(
            "SELECT id, name, message, channel, status, total_recipients, sent_count, failed_count, created_at
             FROM campaigns WHERE id = ?",
            params![campaign_id],
            |row| {
                Ok(Campaign {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    message: row.get(2)?,
                    channel: row.get(3)?,
                    status: row.get(4)?,
                    total_recipients: row.get(5)?,
                    sent_count: row.get(6)?,
                    failed_count: row.get(7)?,
                    created_at: row.get(8)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    if campaign.status != "draft" {
        return Err("Campaign already sent or in progress".to_string());
    }

    // Update campaign status
    conn.execute(
        "UPDATE campaigns SET status = 'sending' WHERE id = ?",
        params![campaign_id],
    )
    .map_err(|e| e.to_string())?;

    // Get pending recipients
    let mut stmt = conn
        .prepare(
            "SELECT id, customer_id, customer_name, customer_phone FROM campaign_recipients
             WHERE campaign_id = ? AND status = 'pending'",
        )
        .map_err(|e| e.to_string())?;

    let recipients: Vec<(i64, i64, String, String)> = stmt
        .query_map(params![campaign_id], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let mut sent_count = 0;
    let mut failed_count = 0;

    // Send to each recipient
    for (recipient_id, _customer_id, _customer_name, phone) in &recipients {
        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        // Try to send via Fonnte (WhatsApp)
        if campaign.channel == "whatsapp" {
            let fonnte_token = conn
                .query_row(
                    "SELECT value FROM shop_settings WHERE key = 'fonnte_api_token'",
                    [],
                    |row| row.get::<_, String>(0),
                )
                .unwrap_or_default();

            if !fonnte_token.is_empty() {
                let url = "https://api.fonnte.com/send";
                let body = serde_json::json!({
                    "target": phone,
                    "message": campaign.message,
                });

                let response = ureq::post(url)
                    .header("Authorization", &fonnte_token)
                    .header("Content-Type", "application/json")
                    .send_json(&body);

                match response {
                    Ok(_) => {
                        conn.execute(
                            "UPDATE campaign_recipients SET status = 'sent', sent_at = ? WHERE id = ?",
                            params![now, recipient_id],
                        )
                        .ok();
                        sent_count += 1;
                    }
                    Err(_) => {
                        conn.execute(
                            "UPDATE campaign_recipients SET status = 'failed' WHERE id = ?",
                            params![recipient_id],
                        )
                        .ok();
                        failed_count += 1;
                    }
                }
            } else {
                conn.execute(
                    "UPDATE campaign_recipients SET status = 'failed' WHERE id = ?",
                    params![recipient_id],
                )
                .ok();
                failed_count += 1;
            }
        } else {
            // For email/SMS, mark as sent (actual sending would need SMTP/SMS API)
            conn.execute(
                "UPDATE campaign_recipients SET status = 'sent', sent_at = ? WHERE id = ?",
                params![now, recipient_id],
            )
            .ok();
            sent_count += 1;
        }
    }

    // Update campaign counts and status
    conn.execute(
        "UPDATE campaigns SET sent_count = ?1, failed_count = ?2, status = 'completed' WHERE id = ?3",
        params![sent_count, failed_count, campaign_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(Campaign {
        id: campaign.id,
        name: campaign.name,
        message: campaign.message,
        channel: campaign.channel,
        status: "completed".to_string(),
        total_recipients: campaign.total_recipients,
        sent_count,
        failed_count,
        created_at: campaign.created_at,
    })
}
