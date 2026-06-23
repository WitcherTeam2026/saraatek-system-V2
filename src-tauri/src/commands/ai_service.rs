use crate::commands::{gemini, openrouter};
use crate::db::Database;
use rusqlite::Connection;
use serde_json::Value;
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

/// Call OpenCode Zen API
pub(crate) fn call_opencode_zen(
    system_prompt: &str,
    user_prompt: &str,
) -> Result<String, String> {
    let url = "https://opencode.ai/zen/v1/chat/completions";
    let api_key = "sk-V0bd6UnJu0LfPUgt7ouEOA2VQGN4d7ph5JA1EZk1mZLsXm1caqwATG2RJQWzvZZD";

    let body = serde_json::json!({
        "model": "mimo-v2.5-free",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": 1000,
    });

    let response = ureq::post(url)
        .header("Authorization", &format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .send_json(&body);

    match response {
        Ok(resp) => {
            let body_text = match resp.into_body().read_to_string() {
                Ok(t) => t,
                Err(e) => return Err(format!("Failed to read OpenCode Zen response: {e}")),
            };

            let json: Value = match serde_json::from_str(&body_text) {
                Ok(v) => v,
                Err(e) => {
                    return Err(format!("Failed to parse OpenCode Zen response: {e}\nBody: {body_text}"));
                }
            };

            let content = json["choices"][0]["message"]["content"]
                .as_str()
                .ok_or_else(|| {
                    let err = json["error"]["message"].as_str().unwrap_or("unknown error");
                    format!("OpenCode Zen API error: {err}")
                })?;

            Ok(content.trim().to_string())
        }
        Err(e) => Err(format!("OpenCode Zen API call failed: {e}")),
    }
}

/// Call AI with OpenCode Zen first, fallback to Gemini, then OpenRouter
pub(crate) fn call_ai(
    conn: &Connection,
    system_prompt: &str,
    user_prompt: &str,
) -> Result<String, String> {
    // Try OpenCode Zen first (free, no CORS issues)
    match call_opencode_zen(system_prompt, user_prompt) {
        Ok(result) => return Ok(result),
        Err(e) => {
            eprintln!("OpenCode Zen failed: {e}");
        }
    }

    // Fallback to Gemini
    let gemini_key = get_setting(conn, "gemini_api_key")?;
    let gemini_model = get_setting(conn, "gemini_model")?
        .unwrap_or_else(|| "gemini-2.0-flash".to_string());

    if let Some(key) = &gemini_key {
        if !key.is_empty() {
            match gemini::call_gemini(system_prompt, user_prompt, key, &gemini_model) {
                Ok(result) => return Ok(result),
                Err(e) => {
                    eprintln!("Gemini failed: {e}");
                }
            }
        }
    }

    // Fallback to OpenRouter
    let openrouter_key = get_setting(conn, "openrouter_api_key")?;
    let openrouter_model = get_setting(conn, "openrouter_model")?
        .unwrap_or_else(|| "meta-llama/llama-3.1-8b-instruct:free".to_string());

    if let Some(key) = &openrouter_key {
        if !key.is_empty() {
            return openrouter::call_openrouter(system_prompt, user_prompt, key, &openrouter_model);
        }
    }

    Err("No AI provider available. Please try again.".to_string())
}

#[tauri::command]
pub fn chat_with_ai(
    system_prompt: String,
    user_prompt: String,
    db: State<Database>,
) -> Result<String, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    call_ai(&conn, &system_prompt, &user_prompt)
}
