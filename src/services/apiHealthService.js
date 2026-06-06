function getApiBase() {
  return process.env.REACT_APP_API_URL || "";
}

/**
 * @returns {Promise<{ ok: boolean, aiTipsConfigured: boolean } | null>}
 */
export async function fetchApiHealth(signal) {
  const base = getApiBase();
  const url = base ? `${base.replace(/\/$/, "")}/health` : "/health";

  const response = await fetch(url, { signal });
  if (!response.ok) return null;

  const data = await response.json().catch(() => null);
  if (!data || data.ok !== true) return null;

  return {
    ok: true,
    aiTipsConfigured: Boolean(data.aiTipsConfigured),
  };
}

export function isApiUrlConfigured() {
  return Boolean(getApiBase());
}
