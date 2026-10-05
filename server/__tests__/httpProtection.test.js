const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createRateLimiter,
  pruneExpiredBuckets,
  validateAiTeamTipsBody,
  parseAllowedOrigins,
  getRequestIp,
} = require("../httpProtection");

function createMockResponse() {
  const response = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return response;
}

test("parseAllowedOrigins includes defaults and env values", () => {
  const previous = process.env.ALLOWED_ORIGINS;
  process.env.ALLOWED_ORIGINS = "https://example.com";
  const origins = parseAllowedOrigins();
  process.env.ALLOWED_ORIGINS = previous;

  assert.ok(origins.includes("https://hudsonferraz.github.io"));
  assert.ok(origins.includes("https://example.com"));
});

test("validateAiTeamTipsBody rejects oversized teamSummary", () => {
  const req = {
    body: {
      teamSummary: "x".repeat(7000),
      userMessage: "Help",
    },
  };
  const res = createMockResponse();
  let nextCalled = false;

  validateAiTeamTipsBody(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 413);
});

test("validateAiTeamTipsBody normalizes valid payload", () => {
  const req = {
    body: {
      teamSummary: "Incineroar / Rillaboom",
      userMessage: "  What should I improve?  ",
      format: "Reg I",
    },
  };
  const res = createMockResponse();
  let nextCalled = false;

  validateAiTeamTipsBody(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.body.userMessage, "What should I improve?");
  assert.equal(req.body.format, "Reg I");
  assert.deepEqual(req.body.history, []);
});

test("validateAiTeamTipsBody accepts optional chat history", () => {
  const req = {
    body: {
      teamSummary: "Incineroar",
      userMessage: "Speed control?",
      history: [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello coach here." },
      ],
    },
  };
  const res = createMockResponse();
  let nextCalled = false;

  validateAiTeamTipsBody(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.body.history.length, 2);
  assert.equal(req.body.history[0].role, "user");
});

test("pruneExpiredBuckets removes stale entries", () => {
  const buckets = new Map([
    ["test:203.0.113.1", { count: 1, resetAt: 100 }],
    ["test:203.0.113.2", { count: 2, resetAt: 500 }],
    ["test:203.0.113.3", { count: 1, resetAt: 200 }],
  ]);

  const lastPrunedAt = pruneExpiredBuckets(buckets, 250, 0, 0);
  assert.equal(lastPrunedAt, 250);
  assert.equal(buckets.size, 1);
  assert.ok(buckets.has("test:203.0.113.2"));
});

test("pruneExpiredBuckets skips work until interval elapses", () => {
  const buckets = new Map([
    ["test:203.0.113.1", { count: 1, resetAt: 100 }],
  ]);

  const lastPrunedAt = pruneExpiredBuckets(buckets, 200, 150, 100);
  assert.equal(lastPrunedAt, 150);
  assert.equal(buckets.size, 1);
});

test("getRequestIp prefers Express req.ip over spoofed X-Forwarded-For", () => {
  const req = {
    ip: "203.0.113.10",
    headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" },
    socket: { remoteAddress: "::1" },
  };

  assert.equal(getRequestIp(req), "203.0.113.10");
});

test("getRequestIp falls back to socket address when req.ip is missing", () => {
  const req = {
    headers: { "x-forwarded-for": "1.1.1.1" },
    socket: { remoteAddress: "203.0.113.10" },
  };

  assert.equal(getRequestIp(req), "203.0.113.10");
});

test("rate limiter blocks after maxRequests", () => {
  const limiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 2,
    name: "test",
  });

  const req = { ip: "203.0.113.10", headers: {} };

  limiter(req, createMockResponse(), () => {});
  limiter(req, createMockResponse(), () => {});

  const blockedResponse = createMockResponse();
  let nextCalled = false;
  limiter(req, blockedResponse, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(blockedResponse.statusCode, 429);
  assert.equal(blockedResponse.body.error, "Too many requests. Please try again later.");
});
