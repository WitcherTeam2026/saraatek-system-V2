use serde_json::Value;

pub(crate) fn call_gemini(
    system_prompt: &str,
    user_prompt: &str,
    api_key: &str,
    model: &str,
) -> Result<String, String> {
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );

    let body = serde_json::json!({
        "contents": [
            {
                "role": "user",
                "parts": [{"text": format!("{}\n\n{}", system_prompt, user_prompt)}]
            }
        ],
        "generationConfig": {
            "maxOutputTokens": 500,
            "temperature": 0.7,
        }
    });

    let response = ureq::post(&url)
        .header("Content-Type", "application/json")
        .send_json(&body);

    match response {
        Ok(resp) => {
            let body_text = match resp.into_body().read_to_string() {
                Ok(t) => t,
                Err(e) => return Err(format!("Failed to read Gemini response: {e}")),
            };

            let json: Value = match serde_json::from_str(&body_text) {
                Ok(v) => v,
                Err(e) => {
                    return Err(format!(
                        "Failed to parse Gemini response: {e}\nBody: {body_text}"
                    ));
                }
            };

            let content = json["candidates"][0]["content"]["parts"][0]["text"]
                .as_str()
                .ok_or_else(|| {
                    let err = json["error"]["message"].as_str().unwrap_or("unknown error");
                    format!("Gemini API error: {err}")
                })?;

            Ok(content.trim().to_string())
        }
        Err(e) => Err(format!("Gemini API call failed: {e}")),
    }
}
