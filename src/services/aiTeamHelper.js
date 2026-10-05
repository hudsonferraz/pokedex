/**
 * AI team coach: calls backend proxy so GROQ_API_KEY stays server-side.
 */

function getApiBase() {
  return process.env.REACT_APP_API_URL || "";
}

/**
 * @param {string} teamSummary
 * @param {string} userMessage
 * @param {string} [format]
 * @param {{ role: 'user'|'assistant', content: string }[]} [history]
 * @returns {Promise<string>}
 */
export async function askAIForTeamTips(
  teamSummary,
  userMessage,
  format,
  history = [],
) {
  const base = getApiBase();
  const url = base ? `${base.replace(/\/$/, "")}/api/ai-team-tips` : "/api/ai-team-tips";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      teamSummary: teamSummary || "",
      userMessage: (userMessage || "").trim() || "Give me tips for forming a good team.",
      format: format || "",
      history: Array.isArray(history) ? history.slice(-8) : [],
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
    if (res.status === 503) {
      throw new Error(
        data.error ||
          "AI coach is not configured. Set GROQ_API_KEY on the Render server.",
      );
    }
    throw new Error(errorMessage || `Request failed: ${res.status}`);
  }

  const text = (data.text || "").trim();
  if (!text) {
    throw new Error(
      data.error ||
        "AI returned an empty response. Check GROQ_API_KEY on the server.",
    );
  }

  return text;
}

export function hasAIToken() {
  return true;
}
