use serde_json::Value;

pub(crate) fn call_openrouter(
    system_prompt: &str,
    user_prompt: &str,
    api_key: &str,
    model: &str,
) -> Result<String, String> {
    let url = "https://openrouter.ai/api/v1/chat/completions";

    let body = serde_json::json!({
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": 500,
    });

    let response = ureq::post(url)
        .header("Authorization", &format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .send_json(&body);

    match response {
        Ok(resp) => {
            let body_text = match resp.into_body().read_to_string() {
                Ok(t) => t,
                Err(e) => return Err(format!("Failed to read OpenRouter response: {e}")),
            };

            let json: Value = match serde_json::from_str(&body_text) {
                Ok(v) => v,
                Err(e) => {
                    return Err(format!(
                        "Failed to parse OpenRouter response: {e}\nBody: {body_text}"
                    ));
                }
            };

            let content = json["choices"][0]["message"]["content"]
                .as_str()
                .ok_or_else(|| {
                    let err = json["error"]["message"].as_str().unwrap_or("unknown error");
                    format!("OpenRouter API error: {err}")
                })?;

            Ok(content.trim().to_string())
        }
        Err(e) => Err(format!("OpenRouter API call failed: {e}")),
    }
}
