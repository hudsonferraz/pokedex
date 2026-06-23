const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createRateLimiter,
  validateAiTeamTipsBody,
  parseAllowedOrigins,
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
