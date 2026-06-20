#![allow(dead_code)]

mod commands;
mod db;
mod pdf;

use db::Database;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("failed to get app data dir: {e}"))?;
            std::fs::create_dir_all(&app_dir)
                .map_err(|e| format!("failed to create app data dir: {e}"))?;
            let db_path = app_dir.join("saraatek.db");
            let db_path_str = db_path
                .to_str()
                .ok_or_else(|| "database path contains invalid UTF-8".to_string())?;
            let database =
                Database::new(db_path_str).map_err(|e| format!("failed to open database: {e}"))?;
            database
                .run_migrations()
                .map_err(|e| format!("failed to run migrations: {e}"))?;

            if let Ok(ref mut conn) = database.conn.lock() {
                let _ = commands::warranties::check_expired_warranties_inner(conn);
            }

            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::ai_messaging::draft_notification_message,
            commands::ai_messaging::send_custom_notification,
            commands::ai_messaging::summarize_customer_history,
            commands::audit::get_field_audit_log,
            commands::customers::search_customer,
            commands::customers::create_customer,
            commands::customers::update_customer_address,
            commands::email::send_ready_email_notification,
            commands::email::send_custom_email,
            commands::notifications::send_ready_notification,
            commands::notifications::get_notification_history,
            commands::payments::record_payment,
            commands::payments::get_payment,
            commands::photos::add_photos,
            commands::photos::get_photos,
            commands::photos::delete_photo,
            commands::photos::open_photos_folder,
            commands::quotations::create_quotation,
            commands::quotations::get_quotation,
            commands::quotations::get_quotation_by_repair,
            commands::quotations::approve_quotation,
            commands::quotations::decline_quotation,
            commands::quotations::create_invoice_items,
            commands::quotations::get_invoice_items,
            commands::settings::get_all_settings,
            commands::settings::save_setting,
            commands::technicians::list_technicians,
            commands::technicians::create_technician,
            commands::technicians::toggle_technician_active,
            commands::repairs::generate_new_repair_id,
            commands::repairs::create_repair,
            commands::repairs::get_repair,
            commands::repairs::list_repairs,
            commands::repairs::update_repair_status,
            commands::repairs::update_technician_fields,
            commands::repairs::get_repair_history,
            commands::repairs::get_dashboard_counts,
            commands::reports::get_revenue_report,
            commands::reports::get_repair_volume_report,
            commands::reports::get_technician_performance,
            commands::reports::get_reports_summary,
            commands::warranties::create_warranty,
            commands::warranties::get_warranty,
            commands::warranties::search_repair_by_serial,
            commands::warranties::reopen_warranty_claim,
            commands::warranties::check_expired_warranties,
            pdf::generate_intake_pdf,
            pdf::generate_quotation_pdf_file,
            pdf::generate_invoice_pdf_file,
            pdf::open_file_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
