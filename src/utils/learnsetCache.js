import { normalizeSpeciesId } from "./regulation";
import { pokemonNeedsLearnset } from "./teamPokemonModel";

const learnsetCache = new Map();
const pendingFetches = new Map();

export function extractLearnsetMoveIds(pokemon) {
  return new Set(
    (pokemon?.moves || [])
      .map((entry) => normalizeSpeciesId(entry?.move?.name || ""))
      .filter(Boolean),
  );
}

export function getCachedLearnset(speciesName) {
  if (!speciesName) {
    return null;
  }

  const speciesKey = normalizeSpeciesId(speciesName);
  const cached = learnsetCache.get(speciesKey);
  return cached && cached.size > 0 ? cached : null;
}

export function seedLearnsetFromPokemon(pokemon) {
  if (!pokemon?.name || pokemonNeedsLearnset(pokemon)) {
    return null;
  }

  const moveIds = extractLearnsetMoveIds(pokemon);
  if (moveIds.size === 0) {
    return null;
  }

  const speciesKey = normalizeSpeciesId(pokemon.name);
  learnsetCache.set(speciesKey, moveIds);
  return moveIds;
}

export async function fetchLearnsetForSpecies(speciesName) {
  const speciesKey = normalizeSpeciesId(speciesName);
  const existing = getCachedLearnset(speciesKey);
  if (existing) {
    return existing;
  }

  const pending = pendingFetches.get(speciesKey);
  if (pending) {
    return pending;
  }

  const request = (async () => {
    const { searchPokemon } = await import("../api");
    const pokemon = await searchPokemon(speciesKey);
    pendingFetches.delete(speciesKey);

    if (!pokemon?.moves?.length) {
      learnsetCache.set(speciesKey, new Set());
      return new Set();
    }

    const moveIds = extractLearnsetMoveIds(pokemon);
    learnsetCache.set(speciesKey, moveIds);
    return moveIds;
  })();

  pendingFetches.set(speciesKey, request);

  try {
    return await request;
  } catch {
    pendingFetches.delete(speciesKey);
    return new Set();
  }
}

export async function fetchLearnsetsForSpecies(speciesNames, { signal } = {}) {
  const uniqueNames = [
    ...new Set((speciesNames || []).map((name) => normalizeSpeciesId(name)).filter(Boolean)),
  ];
  const results = {};

  for (const speciesKey of uniqueNames) {
    if (signal?.aborted) {
      break;
    }

    const cached = getCachedLearnset(speciesKey);
    if (cached) {
      results[speciesKey] = cached;
      continue;
    }

    results[speciesKey] = await fetchLearnsetForSpecies(speciesKey);
  }

  return results;
}

export function buildLearnsetBySpecies(team) {
  const learnsetBySpecies = {};

  (team || []).forEach((pokemon) => {
    if (!pokemon?.name) {
      return;
    }

    const speciesKey = normalizeSpeciesId(pokemon.name);
    const fromPokemon = seedLearnsetFromPokemon(pokemon);
    if (fromPokemon) {
      learnsetBySpecies[speciesKey] = fromPokemon;
      return;
    }

    const cached = getCachedLearnset(speciesKey);
    if (cached) {
      learnsetBySpecies[speciesKey] = cached;
    }
  });

  return learnsetBySpecies;
}
