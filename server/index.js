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

const app = express();
const PORT = process.env.PORT || 3001;
const HF_ROUTER_URL = "https://router.huggingface.co/v1/responses";
// Chat model on the new Inference Providers (router). FLAN-T5 may not return output_text.
const MODEL_ID = "meta-llama/Llama-3.2-3B-Instruct";

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

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  const aiTipsConfigured = Boolean(getToken());
  const payload = {
    ok: true,
    service: "Pokedex Team Builder API",
    aiTipsConfigured,
    endpoints: {
      health: "GET /health",
      aiTeamTips: "POST /api/ai-team-tips",
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

app.post("/api/ai-team-tips", async (req, res) => {
  const token = getToken();
  if (!token) {
    return res.status(503).json({
      error:
        "AI tips are not configured. Set HUGGINGFACE_TOKEN in the server .env.",
    });
  }

  const { teamSummary, userMessage, format } = req.body || {};
  const summary = typeof teamSummary === "string" ? teamSummary : "";
  const message =
    typeof userMessage === "string"
      ? userMessage.trim()
      : "Give me tips for forming a good team.";
  const formatHint =
    typeof format === "string" && format.trim()
      ? ` Format: ${format.trim()}.`
      : "";
  const prompt = `You are a Pokémon team-building advisor. Context: ${summary}.${formatHint} User question: ${message}. Give a short, practical tip (2-4 sentences).`;

  try {
    const hfRes = await fetchApi(HF_ROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        instructions:
          "You are a Pokémon team-building advisor. Give short, practical tips in 2-4 sentences.",
        input: prompt,
      }),
    });

    const rawBody = await hfRes.text();

    if (!hfRes.ok) {
      if (hfRes.status === 401) {
        return res
          .status(502)
          .json({
            error:
              "Invalid Hugging Face token. Check your token at huggingface.co/settings/tokens.",
          });
      }
      if (hfRes.status === 503) {
        return res
          .status(503)
          .json({
            error: "Model is loading. Please try again in 15–20 seconds.",
          });
      }
      return res
        .status(502)
        .json({ error: rawBody || `Upstream error: ${hfRes.status}` });
    }

    let data;
    try {
      data = JSON.parse(rawBody);
    } catch {
      console.error("HF response not JSON:", rawBody.slice(0, 200));
      return res
        .status(502)
        .json({ error: "Invalid response from AI service. Try again." });
    }

    const text = extractOutputText(data);
    if (!text && process.env.NODE_ENV !== "production") {
      console.log(
        "HF response shape (first 500 chars):",
        JSON.stringify(data).slice(0, 500),
      );
    }
    return res.json({
      text: text || "No response generated. Try rephrasing your question.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("AI tips error:", message);
    return res.status(500).json({
      error: message || "Server error. Check the server terminal for details.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI tips server running on http://localhost:${PORT}`);
  console.log(
    `HUGGINGFACE_TOKEN: ${getToken() ? "set" : "NOT SET (AI tips will fail)"}`,
  );
});
