const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://hudsonferraz.github.io",
];

const MAX_TEAM_SUMMARY_LENGTH = 6000;
const MAX_USER_MESSAGE_LENGTH = 500;
const MAX_FORMAT_LENGTH = 80;

function parseAllowedOrigins() {
  const fromEnv = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const extras = [process.env.FRONTEND_URL, process.env.REACT_APP_URL]
    .map((entry) => (entry || "").trim())
    .filter(Boolean);

  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...fromEnv, ...extras])];
}

function getRequestIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function pruneExpiredBuckets(buckets, now, lastPrunedAt, pruneIntervalMs) {
  if (now - lastPrunedAt < pruneIntervalMs) {
    return lastPrunedAt;
  }

  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }

  return now;
}

function createRateLimiter({
  windowMs,
  maxRequests,
  name = "api",
  pruneIntervalMs = windowMs,
}) {
  const buckets = new Map();
  let lastPrunedAt = 0;

  return function rateLimitMiddleware(req, res, next) {
    const key = `${name}:${getRequestIp(req)}`;
    const now = Date.now();
    lastPrunedAt = pruneExpiredBuckets(buckets, now, lastPrunedAt, pruneIntervalMs);
    let bucket = buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, maxRequests - bucket.count);
    res.setHeader("X-RateLimit-Limit", String(maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader(
      "X-RateLimit-Reset",
      String(Math.ceil(bucket.resetAt / 1000)),
    );

    if (bucket.count > maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1000),
      );
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
    }

    return next();
  };
}

function createCorsOptions() {
  const allowedOrigins = parseAllowedOrigins();
  const allowMissingOrigin = process.env.NODE_ENV !== "production";

  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, allowMissingOrigin);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    maxAge: 86400,
  };
}

function validateAiTeamTipsBody(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ error: "Request body must be a JSON object." });
  }

  const extraKeys = Object.keys(body).filter(
    (key) => !["teamSummary", "userMessage", "format"].includes(key),
  );
  if (extraKeys.length > 0) {
    return res.status(400).json({ error: "Request body contains unsupported fields." });
  }

  const teamSummary =
    typeof body.teamSummary === "string" ? body.teamSummary : "";
  const userMessage =
    typeof body.userMessage === "string" ? body.userMessage.trim() : "";
  const format = typeof body.format === "string" ? body.format.trim() : "";

  if (teamSummary.length > MAX_TEAM_SUMMARY_LENGTH) {
    return res.status(413).json({
      error: `teamSummary exceeds ${MAX_TEAM_SUMMARY_LENGTH} characters.`,
    });
  }

  if (userMessage.length > MAX_USER_MESSAGE_LENGTH) {
    return res.status(413).json({
      error: `userMessage exceeds ${MAX_USER_MESSAGE_LENGTH} characters.`,
    });
  }

  if (format.length > MAX_FORMAT_LENGTH) {
    return res.status(413).json({
      error: `format exceeds ${MAX_FORMAT_LENGTH} characters.`,
    });
  }

  req.body = {
    teamSummary,
    userMessage,
    format,
  };
  return next();
}

async function fetchWithTimeout(fetchImpl, url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Upstream request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  createCorsOptions,
  createRateLimiter,
  pruneExpiredBuckets,
  validateAiTeamTipsBody,
  fetchWithTimeout,
  getRequestIp,
  parseAllowedOrigins,
  MAX_TEAM_SUMMARY_LENGTH,
  MAX_USER_MESSAGE_LENGTH,
};
