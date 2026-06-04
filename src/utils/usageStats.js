import usageData from "../data/vgcUsage.json";
import { normalizeSpeciesId } from "./regulation";

function lookupUsage(usageMap, speciesName) {
  if (!usageMap || typeof usageMap !== "object") return null;
  const id = normalizeSpeciesId(speciesName);
  if (usageMap[id] != null) return usageMap[id];
  const base = id.split("-")[0];
  if (usageMap[base] != null) return usageMap[base];
  return null;
}

/** @param {import('../services/metaDataService').fetchLiveMeta extends Function ? Awaited<ReturnType<typeof fetchLiveMeta>> : object} meta */
export function getUsagePercentFromMeta(meta, speciesName) {
  if (meta?.usage) return lookupUsage(meta.usage, speciesName);
  return null;
}

export function getTopUsageFromMeta(meta, limit = 12) {
  const usage = meta?.usage;
  if (!usage) return [];
  return Object.entries(usage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([speciesId, percent]) => ({ speciesId, percent }));
}

export function getUsageMetaFromLive(meta) {
  if (meta) {
    return {
      updated: meta.updated || "",
      source: meta.source || "",
      sourceUrl: meta.sourceUrl || null,
      live: Boolean(meta.live),
    };
  }
  return null;
}

/** Bundled fallback when API unavailable */
export function getUsageMeta(regulationId) {
  const entry = usageData[regulationId] || usageData["regulation-i"];
  return {
    updated: entry?.updated || "",
    source: entry?.source || "",
    usage: entry?.usage || {},
    live: false,
  };
}

export function getUsagePercent(regulationId, speciesName) {
  const { usage } = getUsageMeta(regulationId);
  return lookupUsage(usage, speciesName);
}

export function getTopUsageEntries(regulationId, limit = 12) {
  const { usage } = getUsageMeta(regulationId);
  return Object.entries(usage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([speciesId, percent]) => ({ speciesId, percent }));
}

export function formatUsageLabel(percent) {
  if (percent == null) return null;
  return `${percent.toFixed(1)}%`;
}
