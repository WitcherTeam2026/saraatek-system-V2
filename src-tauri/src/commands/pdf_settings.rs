use crate::db::Database;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PdfTemplateSetting {
    pub setting_key: String,
    pub setting_value: String,
}

#[tauri::command]
pub fn get_pdf_template_settings(db: tauri::State<Database>) -> Result<HashMap<String, String>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut settings = HashMap::new();
    let mut stmt = conn
        .prepare("SELECT setting_key, setting_value FROM pdf_template_settings")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    for row in rows {
        let (key, value) = row.map_err(|e| e.to_string())?;
        settings.insert(key, value);
    }
    Ok(settings)
}

#[tauri::command]
pub fn save_pdf_template_setting(
    key: String,
    value: String,
    db: tauri::State<Database>,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO pdf_template_settings (setting_key, setting_value, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP)",
        rusqlite::params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn save_pdf_template_settings(
    settings: Vec<PdfTemplateSetting>,
    db: tauri::State<Database>,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    for setting in &settings {
        conn.execute(
            "INSERT OR REPLACE INTO pdf_template_settings (setting_key, setting_value, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP)",
            rusqlite::params![setting.setting_key, setting.setting_value],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn reset_pdf_template_settings(db: tauri::State<Database>) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM pdf_template_settings", [])
        .map_err(|e| e.to_string())?;
    
    let defaults = vec![
        ("company_name", "saraa TEK"),
        ("company_address", "539/8 Madamandiya, Dedigamuwa"),
        ("company_email", "saraatek25@gmail.com"),
        ("company_phone", "+94 72 2828 100"),
        ("bank_name", "Commercial Bank"),
        ("bank_account_name", "N.G.C.N Ariyarathna"),
        ("bank_account_number", "8117011598"),
        ("bank_branch", "Pitakotte"),
        ("tagline", "your dead device has a second life"),
        ("terms_line1", "60% Needed in Advance"),
        ("terms_line2", "Warranty period one year less 15 working days. (1 yr = 350 days, 2 yr = 700 days, 3 yr = 1050 days)"),
        ("terms_line3", "Warranty covers only manufacturer's defects. Damage or defect due to other causes such as"),
        ("terms_line4", "negligence, misuses, improper operation, power fluctuation, lightning or other natural disasters, sabotage or accident etc."),
        ("terms_line5", "No warranty for: - key board, Mouse, Speakers, Power adapters, Toners, Ink Cartridges, Printer heads."),
        ("terms_line6", "For other items if there is BURN MARKS, PHYSICAL DAMAGES and CORROSION no warranty."),
        ("terms_line7", "Goods once sold are not returnable under any circumstances"),
        ("warranty_box", "WARRANTY CLAIM ONE YEAR LESS 17 DAYS, NO WARRANTY FOR CHIP BURNS OR PHYSICAL DAMAGE & PLEASE PRODUCE THE INVOICE FOR WARRANTY CLAIMS"),
        ("authorized_label", "Authorized signature"),
        ("customer_sig_label", "Customer signature"),
        ("footer_address", "539/8"),
        ("footer_phone", "+94 72 2828 100"),
        ("footer_email", "saraatek25@gmail.com"),
        ("footer_company", "saraa tek"),
        ("footer_location", "Madamandiya, Dedigamuwa"),
        ("custom_css", ""),
        ("background_image", ""),
    ];
    
    for (key, value) in &defaults {
        conn.execute(
            "INSERT OR IGNORE INTO pdf_template_settings (setting_key, setting_value) VALUES (?1, ?2)",
            rusqlite::params![key, value],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}
