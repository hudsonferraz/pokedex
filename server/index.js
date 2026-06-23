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
const PORT = process.env.PORT || 3001;
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || "16kb";
const HF_FETCH_TIMEOUT_MS = Number.parseInt(
  process.env.HF_FETCH_TIMEOUT_MS || "45000",
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
const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";
const HF_RESPONSES_URL = "https://router.huggingface.co/v1/responses";
// :fastest picks an available Inference Provider automatically
const MODEL_ID = "meta-llama/Llama-3.2-3B-Instruct:fastest";
const { getCached, setCached, getCacheStats } = require("./pikalyticsCache");
const {
  parsePikalyticsMarkdown,
  parsePokemonMetaMarkdown,
  pikalyticsApiIdToUrlName,
} = require("./pikalyticsParser");

function getToken() {
  return (
    process.env.HUGGINGFACE_TOKEN ||
    process.env.REACT_APP_HUGGINGFACE_TOKEN ||
    ""
  ).trim();
}

function warnIfTokenMissing() {
  if (getToken()) return;
  console.warn("HUGGINGFACE_TOKEN is not set.");
  console.warn("Expected .env at:", envPath);
  console.warn("File exists:", fs.existsSync(envPath));
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    const hasTokenKey = /HUGGINGFACE_TOKEN\s*=/i.test(content);
    console.warn("Line with HUGGINGFACE_TOKEN= in file:", hasTokenKey);
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
      ? "AI team tips are configured."
      : "AI team tips are not configured (set HUGGINGFACE_TOKEN on the server).";
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

function extractOutputText(body) {
  if (!body || typeof body !== "object") return null;
  if (typeof body.output_text === "string" && body.output_text.trim()) {
    return body.output_text.trim();
  }
  // Responses API: output = [{ type: "message", content: [{ type: "output_text", text: "..." }] }]
  if (Array.isArray(body.output)) {
    const parts = [];
    for (const item of body.output) {
      if (!item) continue;
      if (item.type === "output_text" && typeof item.text === "string") {
        parts.push(item.text);
      } else if (Array.isArray(item.content)) {
        for (const c of item.content) {
          if (c && c.type === "output_text" && typeof c.text === "string") {
            parts.push(c.text);
          }
        }
      }
    }
    const text = parts.join("").trim();
    if (text) return text;
  }
  if (typeof body.output === "string") return body.output.trim();
  return null;
}

function extractChatCompletionText(body) {
  if (!body || typeof body !== "object") return null;
  const content = body.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }
  return null;
}

async function requestAiText(prompt, instructions) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const chatRes = await outboundFetch(
      HF_CHAT_URL,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: MODEL_ID,
          messages: [
            { role: "system", content: instructions },
            { role: "user", content: prompt },
          ],
          max_tokens: 280,
          temperature: 0.6,
        }),
      },
      HF_FETCH_TIMEOUT_MS,
    );
    const chatRaw = await chatRes.text();
    if (chatRes.ok) {
      const data = JSON.parse(chatRaw);
      const text = extractChatCompletionText(data);
      if (text) return text;
    } else {
      console.warn("HF chat completions:", chatRes.status, chatRaw.slice(0, 300));
      if (chatRes.status === 401) {
        throw new Error(
          "Invalid Hugging Face token. Create one with Inference Providers permission at huggingface.co/settings/tokens.",
        );
      }
      if (chatRes.status === 402 || chatRes.status === 403) {
        throw new Error(
          "Hugging Face billing or permissions issue. Enable Inference Providers credits on your HF account.",
        );
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Hugging Face")) {
      throw error;
    }
    console.warn("HF chat request failed:", error);
  }

  const responsesRes = await outboundFetch(
    HF_RESPONSES_URL,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: MODEL_ID.replace(/:fastest$/, ""),
        instructions,
        input: prompt,
      }),
    },
    HF_FETCH_TIMEOUT_MS,
  );
  const responsesRaw = await responsesRes.text();
  if (!responsesRes.ok) {
    if (responsesRes.status === 503) {
      throw new Error("Model is loading. Please try again in 15–20 seconds.");
    }
    throw new Error(responsesRaw || `AI service error: ${responsesRes.status}`);
  }

  const data = JSON.parse(responsesRaw);
  const text = extractOutputText(data);
  if (text) return text;

  throw new Error(
    "AI service returned an empty response. Verify HUGGINGFACE_TOKEN on Render and Inference Providers credits.",
  );
}

function upstreamErrorStatus(error) {
  const message = error instanceof Error ? error.message : "Fetch failed";
  return message.includes("timed out") ? 504 : 502;
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    huggingFaceConfigured: Boolean(getToken()),
    cache: getCacheStats(),
  });
});

const PIKALYTICS_FORMATS = {
  "gen9vgc2025regi": "VGC 2025 Regulation I",
  "gen9vgc2025regj": "VGC 2025 Regulation J",
  "gen9vgc2025regh": "VGC 2025 Regulation H",
  "gen9vgc2026regf": "VGC 2026 Regulation F",
  "gen9championsvgc2026regma": "Pokemon Champions VGC 2026 Reg M-A",
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
        "AI tips are not configured. Set HUGGINGFACE_TOKEN in the server .env.",
    });
  }

  const { teamSummary, userMessage, format } = req.body;
  const message = userMessage || "Give me tips for forming a good team.";
  const formatHint =
    format
      ? ` Format: ${format}.`
      : " Format: Pokémon VGC doubles (6 registered, bring 4).";
  const prompt =
    `Team context: ${teamSummary}.${formatHint} User question: ${message}. ` +
    `Respond with 2-3 tips using EXACTLY this format for each tip (repeat the block):\n` +
    `TIP: [one actionable recommendation]\n` +
    `BECAUSE: [one sentence explaining why, citing team gaps like speed control, typings, or meta staples]\n` +
    `META: [optional one sentence tying to current VGC meta]`;

  const vgcInstructions =
    "You are a Pokémon VGC (Video Game Championships) doubles coach. " +
    "Teams register 6 Pokémon and bring 4 each round. " +
    "Always explain your reasoning in BECAUSE lines (speed control, Tera, Intimidate, restricteds, common cores). " +
    "Use the TIP/BECAUSE/META format exactly — no bullet lists.";

  try {
    const text = await requestAiText(prompt, vgcInstructions);
    return res.json({ text });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Server error";
    console.error("AI tips error:", errorMessage);
    const status = errorMessage.includes("loading")
      ? 503
      : errorMessage.includes("timed out")
        ? 504
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
    `HUGGINGFACE_TOKEN: ${getToken() ? "set" : "NOT SET (AI tips will fail)"}`,
  );
  console.log(`CORS allowed origins: ${parseAllowedOrigins().join(", ")}`);
  console.log(
    `Rate limits: AI ${AI_RATE_LIMIT_MAX}/${AI_RATE_LIMIT_WINDOW_MS}ms, meta ${META_RATE_LIMIT_MAX}/${META_RATE_LIMIT_WINDOW_MS}ms`,
  );
});
