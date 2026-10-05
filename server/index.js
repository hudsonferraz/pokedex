/* eslint-env node */
const path = require("path");
const fs = require("fs");

const envPath = path.join(__dirname, ".env");
try {
  require("dotenv").config({ path: envPath });
} catch {
  // dotenv optional in production; use host env vars (e.g. Render)
}

const express = require("express");
const cors = require("cors");
const fetchApi =
  typeof fetch === "function" ? fetch : require("node-fetch");
const {
  createCorsOptions,
  createRateLimiter,
  validateAiTeamTipsBody,
  fetchWithTimeout,
  parseAllowedOrigins,
} = require("./httpProtection");

const app = express();
const TRUST_PROXY = process.env.TRUST_PROXY ?? "1";
app.set(
  "trust proxy",
  TRUST_PROXY === "true" || TRUST_PROXY === "1" ? 1 : TRUST_PROXY,
);
const PORT = process.env.PORT || 3001;
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || "16kb";
const AI_FETCH_TIMEOUT_MS = Number.parseInt(
  process.env.AI_FETCH_TIMEOUT_MS ||
    process.env.HF_FETCH_TIMEOUT_MS ||
    "45000",
  10,
);
const PIKALYTICS_FETCH_TIMEOUT_MS = Number.parseInt(
  process.env.PIKALYTICS_FETCH_TIMEOUT_MS || "15000",
  10,
);
const AI_RATE_LIMIT_MAX = Number.parseInt(process.env.AI_RATE_LIMIT_MAX || "12", 10);
const AI_RATE_LIMIT_WINDOW_MS = Number.parseInt(
  process.env.AI_RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000),
  10,
);
const META_RATE_LIMIT_MAX = Number.parseInt(process.env.META_RATE_LIMIT_MAX || "90", 10);
const META_RATE_LIMIT_WINDOW_MS = Number.parseInt(
  process.env.META_RATE_LIMIT_WINDOW_MS || "60000",
  10,
);
const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL_ID =
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const { getCached, setCached, getCacheStats } = require("./pikalyticsCache");
const {
  parsePikalyticsMarkdown,
  parsePokemonMetaMarkdown,
  pikalyticsApiIdToUrlName,
} = require("./pikalyticsParser");

function getToken() {
  return (
    process.env.GROQ_API_KEY ||
    process.env.REACT_APP_GROQ_API_KEY ||
    ""
  ).trim();
}

function warnIfTokenMissing() {
  if (getToken()) return;
  console.warn("GROQ_API_KEY is not set.");
  console.warn("Expected .env at:", envPath);
  console.warn("File exists:", fs.existsSync(envPath));
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    const hasTokenKey = /GROQ_API_KEY\s*=/i.test(content);
    console.warn("Line with GROQ_API_KEY= in file:", hasTokenKey);
  }
}

warnIfTokenMissing();

const aiRateLimiter = createRateLimiter({
  windowMs: AI_RATE_LIMIT_WINDOW_MS,
  maxRequests: AI_RATE_LIMIT_MAX,
  name: "ai-team-tips",
});

const metaRateLimiter = createRateLimiter({
  windowMs: META_RATE_LIMIT_WINDOW_MS,
  maxRequests: META_RATE_LIMIT_MAX,
  name: "meta",
});

app.use(cors(createCorsOptions()));
app.use(express.json({ limit: JSON_BODY_LIMIT }));

async function outboundFetch(url, options = {}, timeoutMs = PIKALYTICS_FETCH_TIMEOUT_MS) {
  return fetchWithTimeout(fetchApi, url, options, timeoutMs);
}

app.get("/", (req, res) => {
  const aiTipsConfigured = Boolean(getToken());
  const payload = {
    ok: true,
    service: "Pokedex Team Builder API",
    aiTipsConfigured,
    endpoints: {
      health: "GET /health",
      aiTeamTips: "POST /api/ai-team-tips",
      metaUsage: "GET /api/meta/usage/:formatCode",
      metaFormats: "GET /api/meta/formats",
    },
  };

  if (req.accepts("html")) {
    const statusLine = aiTipsConfigured
      ? "AI team coach is configured (Groq)."
      : "AI team coach is not configured (set GROQ_API_KEY on the server).";
    res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pokedex API</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 32rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; color: #1a1a1a; }
    h1 { font-size: 1.35rem; margin-bottom: 0.5rem; }
    p { margin: 0.5rem 0; }
    code { background: #f0f0f0; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.9em; }
    ul { margin: 0.75rem 0; padding-left: 1.25rem; }
  </style>
</head>
<body>
  <h1>Pokedex Team Builder API</h1>
  <p>Status: <strong>running</strong></p>
  <p>${statusLine}</p>
  <p>Endpoints:</p>
  <ul>
    <li><code>GET /health</code> — health check (JSON)</li>
    <li><code>POST /api/ai-team-tips</code> — AI team tips (used by the app)</li>
    <li><code>GET /api/meta/usage/:formatCode</code> — live VGC usage (Pikalytics proxy)</li>
  </ul>
</body>
</html>`);
    return;
  }

  res.json(payload);
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    aiTipsConfigured: Boolean(getToken()),
  });
});

function extractChatCompletionText(body) {
  if (!body || typeof body !== "object") return null;
  const content = body.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }
  return null;
}

async function requestAiText(prompt, instructions, history = []) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const messages = [
    { role: "system", content: instructions },
    ...history.map((entry) => ({
      role: entry.role,
      content: entry.content,
    })),
    { role: "user", content: prompt },
  ];

  const chatRes = await outboundFetch(
    GROQ_CHAT_URL,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: GROQ_MODEL_ID,
        messages,
        max_tokens: 700,
        temperature: 0.55,
      }),
    },
    AI_FETCH_TIMEOUT_MS,
  );
  const chatRaw = await chatRes.text();

  if (!chatRes.ok) {
    console.warn("Groq chat completions:", chatRes.status, chatRaw.slice(0, 400));
    if (chatRes.status === 401) {
      throw new Error(
        "Invalid Groq API key. Create one at https://console.groq.com/keys",
      );
    }
    if (chatRes.status === 429) {
      throw new Error(
        "Groq rate limit hit. Wait a moment and try again (free tier).",
      );
    }
    throw new Error(chatRaw || `Groq error: ${chatRes.status}`);
  }

  let data;
  try {
    data = JSON.parse(chatRaw);
  } catch {
    throw new Error("Groq returned invalid JSON.");
  }

  const text = extractChatCompletionText(data);
  if (text) return text;

  throw new Error(
    "Groq returned an empty response. Verify GROQ_API_KEY on Render and free-tier quota.",
  );
}

function upstreamErrorStatus(error) {
  const message = error instanceof Error ? error.message : "Fetch failed";
  return message.includes("timed out") ? 504 : 502;
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    aiTipsConfigured: Boolean(getToken()),
    groqConfigured: Boolean(getToken()),
    provider: "groq",
    cache: getCacheStats(),
  });
});

const PIKALYTICS_FORMATS = {
  "gen9vgc2025regi": "VGC 2025 Regulation I",
  "gen9vgc2025regj": "VGC 2025 Regulation J",
  "gen9vgc2025regh": "VGC 2025 Regulation H",
  "gen9vgc2026regf": "VGC 2026 Regulation F",
  "gen9championsvgc2026regma": "Pokemon Champions VGC 2026 Reg M-A",
  "gen9championsvgc2026regmb": "Pokemon Champions VGC 2026 Reg M-B",
  "gen9championsvgc2026regmc": "Pokemon Champions VGC 2026 Reg M-C",
};

app.get("/api/meta/formats", metaRateLimiter, (req, res) => {
  res.json({
    formats: Object.entries(PIKALYTICS_FORMATS).map(([formatCode, label]) => ({
      formatCode,
      label,
    })),
    cache: getCacheStats(),
  });
});

app.get("/api/meta/usage/:formatCode", metaRateLimiter, async (req, res) => {
  const formatCode = (req.params.formatCode || "").trim();
  if (!formatCode || !/^[a-z0-9]+$/i.test(formatCode)) {
    return res.status(400).json({ error: "Invalid format code" });
  }

  const cached = getCached(formatCode);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  const url = `https://www.pikalytics.com/ai/pokedex/${formatCode}`;
  try {
    const response = await outboundFetch(url, {
      headers: { Accept: "text/plain", "User-Agent": "PokedexTeamBuilder/1.0" },
    });
    if (!response.ok) {
      return res.status(502).json({
        error: `Pikalytics returned ${response.status} for ${formatCode}`,
      });
    }
    const markdown = await response.text();
    const parsed = parsePikalyticsMarkdown(markdown, formatCode);
    const payload = {
      ...parsed,
      fetchedAt: new Date().toISOString(),
      cached: false,
    };
    setCached(formatCode, payload);
    return res.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fetch failed";
    console.error("Pikalytics meta error:", message);
    return res.status(upstreamErrorStatus(error)).json({
      error: `Could not load live meta from Pikalytics: ${message}`,
    });
  }
});

function pokemonMetaCacheKey(formatCode, speciesApiId) {
  return `pokemon:${formatCode}:${speciesApiId}`;
}

app.get("/api/meta/pokemon/:formatCode/:speciesApiId", metaRateLimiter, async (req, res) => {
  const formatCode = (req.params.formatCode || "").trim();
  const speciesApiId = (req.params.speciesApiId || "").trim().toLowerCase();
  if (!formatCode || !/^[a-z0-9]+$/i.test(formatCode)) {
    return res.status(400).json({ error: "Invalid format code" });
  }
  if (!speciesApiId || !/^[a-z0-9-]+$/.test(speciesApiId)) {
    return res.status(400).json({ error: "Invalid species id" });
  }

  const cacheKey = pokemonMetaCacheKey(formatCode, speciesApiId);
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  const urlName = pikalyticsApiIdToUrlName(speciesApiId);
  const url = `https://www.pikalytics.com/ai/pokedex/${formatCode}/${encodeURIComponent(urlName)}`;
  try {
    const response = await outboundFetch(url, {
      headers: { Accept: "text/plain", "User-Agent": "PokedexTeamBuilder/1.0" },
    });
    if (response.status === 404) {
      return res.status(404).json({
        error: `No Pikalytics data for ${urlName} in ${formatCode}`,
      });
    }
    if (!response.ok) {
      return res.status(502).json({
        error: `Pikalytics returned ${response.status} for ${urlName}`,
      });
    }
    const markdown = await response.text();
    const parsed = parsePokemonMetaMarkdown(markdown, formatCode, speciesApiId);
    const payload = {
      ...parsed,
      fetchedAt: new Date().toISOString(),
      cached: false,
    };
    setCached(cacheKey, payload);
    return res.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fetch failed";
    console.error("Pikalytics pokemon meta error:", message);
    return res.status(upstreamErrorStatus(error)).json({
      error: `Could not load Pokémon meta from Pikalytics: ${message}`,
    });
  }
});

app.post(
  "/api/ai-team-tips",
  aiRateLimiter,
  validateAiTeamTipsBody,
  async (req, res) => {
  const token = getToken();
  if (!token) {
    return res.status(503).json({
      error:
        "AI coach is not configured. Set GROQ_API_KEY in the server .env.",
    });
  }

  const { teamSummary, userMessage, format, history } = req.body;
  const message = userMessage || "Give me tips for forming a good team.";
  const formatHint =
    format
      ? ` Format: ${format}.`
      : " Format: Pokémon Champions VGC doubles (6 registered, bring 4).";
  const prompt =
    `Team context:\n${teamSummary || "(empty roster)"}\n\n${formatHint}\n` +
    `Player question: ${message}\n\n` +
    `Answer as a concise VGC coach. Prefer 2-4 short paragraphs or bullets. ` +
    `If giving discrete tips, you may also use TIP:/BECAUSE:/META: blocks. ` +
    `Be specific to THIS team; do not invent Pokémon not on the roster. ` +
    `Remind that advice is advisory and legality should be double-checked.`;

  const vgcInstructions =
    "You are a Pokémon VGC (Video Game Championships) doubles coach for a team-builder app. " +
    "Teams register 6 Pokémon and bring 4 each round. " +
    "You receive live team context (sets, roles, gaps, regulation, meta stubs). " +
    "Prioritize speed control, intimidate cycles, Fake Out, redirect, Tera plans, and meta cores. " +
    "Never claim to be an official Pokémon Company rules authority.";

  try {
    const text = await requestAiText(prompt, vgcInstructions, history || []);
    return res.json({ text, provider: "groq", model: GROQ_MODEL_ID });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Server error";
    console.error("AI tips error:", errorMessage);
    const status = errorMessage.includes("rate limit")
      ? 429
      : errorMessage.includes("timed out")
        ? 504
        : errorMessage.includes("Invalid Groq")
          ? 401
          : 502;
    return res.status(status).json({
      error: errorMessage || "Server error. Check the server terminal for details.",
    });
  }
  },
);

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "Invalid JSON body." });
  }
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large." });
  }
  if (error?.message === "Origin not allowed by CORS") {
    return res.status(403).json({ error: "Origin not allowed." });
  }
  return next(error);
});

app.listen(PORT, () => {
  console.log(`AI tips server running on http://localhost:${PORT}`);
  console.log(
    `GROQ_API_KEY: ${getToken() ? "set" : "NOT SET (AI coach will fail)"}`,
  );
  console.log(`CORS allowed origins: ${parseAllowedOrigins().join(", ")}`);
  console.log(
    `Rate limits: AI ${AI_RATE_LIMIT_MAX}/${AI_RATE_LIMIT_WINDOW_MS}ms, meta ${META_RATE_LIMIT_MAX}/${META_RATE_LIMIT_WINDOW_MS}ms`,
  );
});
