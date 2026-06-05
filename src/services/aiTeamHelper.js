/**
 * AI team helper: calls our backend proxy so the Hugging Face token stays server-side.
 * Backend runs with HUGGINGFACE_TOKEN in server/.env (see pokedex/server/).
 */

function getApiBase() {
  return process.env.REACT_APP_API_URL || "";
}

/**
 * Asks the backend for AI team tips. Token is never sent from the browser.
 * @param {string} teamSummary - Short summary of team (names, types, weaknesses)
 * @param {string} userMessage - User question, e.g. "How can I improve my team?"
 * @param {string} [format] - Optional format (e.g. "VGC", "Singles OU") for format-specific advice
 * @returns {Promise<string>} Generated tip text
 */
export async function askAIForTeamTips(teamSummary, userMessage, format) {
  const base = getApiBase();
  const url = base ? `${base.replace(/\/$/, "")}/api/ai-team-tips` : "/api/ai-team-tips";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      teamSummary: teamSummary || "",
      userMessage: (userMessage || "").trim() || "Give me tips for forming a good team.",
      format: format || "",
    }),
  });

  const data = await res.json().catch(() => ({}));
  const errorMessage = data.error || (res.ok ? null : `Request failed: ${res.status}`);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        "AI API not found (404). On GitHub Pages, rebuild with REACT_APP_API_URL pointing at your Render server.",
      );
    }
    throw new Error(errorMessage || `Request failed: ${res.status}`);
  }

  const text = (data.text || "").trim();
  if (!text) {
    throw new Error(
      data.error ||
        "AI returned an empty response. Check HUGGINGFACE_TOKEN on the server.",
    );
  }

  return text;
}

/**
 * True if the app is configured to call the AI backend (same origin or REACT_APP_API_URL).
 * We always show the "Ask AI" form; this is used for optional UI hints.
 */
export function hasAIToken() {
  return true;
}
