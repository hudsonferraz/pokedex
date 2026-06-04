const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map();

function getCached(formatCode) {
  const entry = cache.get(formatCode);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    cache.delete(formatCode);
    return null;
  }
  return entry.data;
}

function setCached(formatCode, data) {
  cache.set(formatCode, {
    fetchedAt: Date.now(),
    data,
  });
}

function getCacheStats() {
  return {
    entries: cache.size,
    ttlHours: CACHE_TTL_MS / (60 * 60 * 1000),
  };
}

module.exports = { getCached, setCached, getCacheStats, CACHE_TTL_MS };
