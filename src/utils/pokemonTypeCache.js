import { getPokemonData } from "../api";

const typeCache = new Map();
const BATCH_SIZE = 25;

export function getCachedTypes(speciesName) {
  return typeCache.get(speciesName) || null;
}

export function getTypeCacheMap() {
  return typeCache;
}

export async function fetchTypesForSpecies(speciesEntry) {
  const cached = typeCache.get(speciesEntry.name);
  if (cached) {
    return cached;
  }

  const data = await getPokemonData(speciesEntry.url);
  if (!data?.types) {
    return [];
  }

  const types = data.types.map((typeEntry) => typeEntry.type.name);
  typeCache.set(speciesEntry.name, types);
  return types;
}

export async function ensureTypesForSpeciesList(entries, { signal } = {}) {
  const missing = entries.filter((entry) => !typeCache.has(entry.name));

  for (let index = 0; index < missing.length; index += BATCH_SIZE) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const batch = missing.slice(index, index + BATCH_SIZE);
    await Promise.all(batch.map((entry) => fetchTypesForSpecies(entry)));
  }
}

export function speciesMatchesSelectedTypes(speciesName, selectedTypes) {
  if (!selectedTypes.length) {
    return true;
  }

  const types = typeCache.get(speciesName);
  if (!types) {
    return false;
  }

  return selectedTypes.some((selectedType) => types.includes(selectedType));
}
