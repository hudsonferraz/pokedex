import { getPikalyticsFormatForRegulation } from "../constants/pikalyticsFormats";

const CLIENT_CACHE_KEY = "vgc-live-meta-v2";
const CLIENT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function getApiBase() {
  return process.env.REACT_APP_API_URL || "";
}

function readClientCache(regulationId) {
  try {
    const raw = sessionStorage.getItem(CLIENT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.regulationId !== regulationId) return null;
    if (Date.now() - parsed.timestamp > CLIENT_CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeClientCache(regulationId, data) {
  try {
    sessionStorage.setItem(
      CLIENT_CACHE_KEY,
      JSON.stringify({ regulationId, timestamp: Date.now(), data }),
    );
  } catch {
    // ignore quota
  }
}

async function loadFallbackMeta(regulationId) {
  const usageModule = await import("../data/vgcUsage.json");
  const metaModule = await import("../data/vgcMeta.json");
  const usageData = usageModule.default;
  const metaData = metaModule.default;

  const hasExact =
    Boolean(usageData[regulationId]) || Boolean(metaData[regulationId]);
  const fallbackRegulationId = hasExact
    ? regulationId
    : usageData["champions-reg-mc"]
      ? "champions-reg-mc"
      : usageData["champions-reg-ma"]
        ? "champions-reg-ma"
        : "regulation-i";

  const usageEntry = usageData[regulationId] || usageData[fallbackRegulationId];
  const metaEntry = metaData[regulationId] || metaData[fallbackRegulationId];
  const usedDifferentSnapshot = !hasExact || fallbackRegulationId !== regulationId;

  let source =
    usageEntry?.source ||
    "Bundled fallback data (update server or redeploy to refresh)";
  let label = metaEntry?.sourceNote ? "Offline fallback" : regulationId;

  if (usedDifferentSnapshot) {
    label = `Offline fallback (stale ${fallbackRegulationId})`;
    source = `${source} — showing bundled ${fallbackRegulationId} snapshot because ${regulationId} has no offline copy.`;
  } else if (!usageEntry?.source?.toLowerCase().includes("offline")) {
    source = `Offline fallback: ${source}`;
  }

  return {
    live: false,
    regulationId,
    formatCode: null,
    label,
    updated: usageEntry?.updated || "",
    source,
    sourceUrl: null,
    usage: usageEntry?.usage || {},
    topPokemon: metaEntry?.topPokemon || [],
    cores: metaEntry?.cores || [],
    fallbackFromRegulationId: usedDifferentSnapshot ? fallbackRegulationId : null,
  };
}

/**
 * Fetches live meta from backend (Pikalytics proxy) with bundled JSON fallback.
 */
export async function fetchLiveMeta(regulationId) {
  const cached = readClientCache(regulationId);
  if (cached) return cached;

  const mapping = getPikalyticsFormatForRegulation(regulationId);
  const base = getApiBase();
  const url = base
    ? `${base.replace(/\/$/, "")}/api/meta/usage/${mapping.formatCode}`
    : `/api/meta/usage/${mapping.formatCode}`;

  try {
    const response = await fetch(url);
    const body = await response.json().catch(() => ({}));

    if (response.ok && body.usage) {
      const data = {
        live: true,
        regulationId,
        formatCode: body.formatCode || mapping.formatCode,
        label: body.label || mapping.label,
        updated: body.updated || "",
        source: body.source || "Pikalytics",
        sourceUrl: body.sourceUrl || `https://www.pikalytics.com/pokedex/${mapping.formatCode}`,
        usage: body.usage,
        topPokemon: body.topPokemon || Object.keys(body.usage).slice(0, 30),
        cores: body.cores || [],
        fetchedAt: body.fetchedAt,
      };
      writeClientCache(regulationId, data);
      return data;
    }
  } catch {
    // fall through to bundled data
  }

  const fallback = await loadFallbackMeta(regulationId);
  writeClientCache(regulationId, fallback);
  return fallback;
}

const POKEMON_META_CACHE_PREFIX = "vgc-pokemon-meta-v1";

function readPokemonMetaCache(regulationId, speciesApiId) {
  try {
    const raw = sessionStorage.getItem(`${POKEMON_META_CACHE_PREFIX}:${regulationId}:${speciesApiId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CLIENT_CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writePokemonMetaCache(regulationId, speciesApiId, data) {
  try {
    sessionStorage.setItem(
      `${POKEMON_META_CACHE_PREFIX}:${regulationId}:${speciesApiId}`,
      JSON.stringify({ timestamp: Date.now(), data }),
    );
  } catch {
    // ignore quota
  }
}

/**
 * Fetches per-Pokémon meta (moves, items, abilities, suggested set) from Pikalytics proxy.
 */
export async function fetchPokemonMeta(regulationId, speciesName) {
  const speciesApiId = (speciesName || "")
    .trim()
    .toLowerCase()
    .replace(/['.]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  if (!speciesApiId) {
    return { error: "Invalid species name", live: false };
  }

  const cached = readPokemonMetaCache(regulationId, speciesApiId);
  if (cached) return cached;

  const mapping = getPikalyticsFormatForRegulation(regulationId);
  const base = getApiBase();
  const url = base
    ? `${base.replace(/\/$/, "")}/api/meta/pokemon/${mapping.formatCode}/${speciesApiId}`
    : `/api/meta/pokemon/${mapping.formatCode}/${speciesApiId}`;

  try {
    const response = await fetch(url);
    const body = await response.json().catch(() => ({}));

    if (response.ok && body.suggestedSet) {
      const data = {
        live: true,
        regulationId,
        formatCode: body.formatCode || mapping.formatCode,
        speciesApiId,
        ...body,
      };
      writePokemonMetaCache(regulationId, speciesApiId, data);
      return data;
    }

    return {
      live: false,
      regulationId,
      speciesApiId,
      error: body.error || "Could not load Pokémon meta",
    };
  } catch {
    return {
      live: false,
      regulationId,
      speciesApiId,
      error: "Network error loading Pokémon meta",
    };
  }
}

const SPECIES_META_SUMMARY_PREFIX = "vgc-species-meta-summary-v1";

function readSpeciesSummaryCache(regulationId) {
  try {
    const raw = sessionStorage.getItem(`${SPECIES_META_SUMMARY_PREFIX}:${regulationId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CLIENT_CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeSpeciesSummaryCache(regulationId, data) {
  try {
    sessionStorage.setItem(
      `${SPECIES_META_SUMMARY_PREFIX}:${regulationId}`,
      JSON.stringify({ timestamp: Date.now(), data }),
    );
  } catch {
    // ignore quota
  }
}

/**
 * Prefetches usage + win rate for top meta species (Browse badges).
 */
export async function prefetchTopSpeciesMeta(regulationId, speciesIds, limit = 15) {
  const cached = readSpeciesSummaryCache(regulationId);
  if (cached) return cached;

  const ids = (speciesIds || []).slice(0, limit);
  const summary = {};

  await Promise.allSettled(
    ids.map(async (speciesApiId) => {
      const data = await fetchPokemonMeta(regulationId, speciesApiId);
      if (data.error || (data.winRate == null && data.usage == null)) return;
      summary[speciesApiId] = {
        usage: data.usage ?? null,
        winRate: data.winRate ?? null,
        live: Boolean(data.live),
      };
    }),
  );

  writeSpeciesSummaryCache(regulationId, summary);
  return summary;
}
