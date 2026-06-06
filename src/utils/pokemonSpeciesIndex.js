import { getPokemons } from "../api";

const TOTAL_SPECIES = 1025;

let cachedList = null;
let loadPromise = null;

function parseIdFromUrl(url) {
  const match = url?.match(/\/pokemon\/(\d+)\//);
  return match ? Number.parseInt(match[1], 10) : null;
}

export async function loadSpeciesIndex() {
  if (cachedList) {
    return cachedList;
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    const data = await getPokemons(TOTAL_SPECIES, 0);
    cachedList = (data?.results || [])
      .map((entry) => ({
        id: parseIdFromUrl(entry.url),
        name: entry.name,
        url: entry.url,
      }))
      .filter((entry) => entry.id != null)
      .sort((first, second) => first.id - second.id);
    return cachedList;
  })();

  return loadPromise;
}

export function getSpeciesIndexSync() {
  return cachedList;
}

export function filterSpeciesByName(speciesIndex, query, limit = 12) {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2 || !speciesIndex?.length) {
    return [];
  }

  const numericQuery = /^\d+$/.test(normalized) ? Number.parseInt(normalized, 10) : null;

  return speciesIndex
    .filter((entry) => {
      if (numericQuery != null) {
        return String(entry.id).startsWith(normalized);
      }
      return entry.name.includes(normalized);
    })
    .slice(0, limit);
}
