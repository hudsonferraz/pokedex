import { normalizeSpeciesId } from "./regulation";
import {
  normalizeSetEntry,
  EMPTY_POKEMON_SET,
} from "./pokemonSets";
import {
  compactPokemonFromApi,
  expandCompactPokemon,
  normalizeTeamPokemonList,
} from "./teamPokemonModel";

export const TEAM_SCHEMA_VERSION = 3;

function resolveRosterName(pokemon, setsKey) {
  const key = normalizeSpeciesId(setsKey);
  const match = pokemon.find((entry) => normalizeSpeciesId(entry?.name) === key);
  return match?.name || setsKey;
}

function pruneSetsForRoster(pokemon, rawSets) {
  const names = new Set(pokemon.map((entry) => entry?.name).filter(Boolean));
  const sets = {};

  if (rawSets && typeof rawSets === "object") {
    Object.entries(rawSets).forEach(([setsKey, value]) => {
      const rosterName = resolveRosterName(pokemon, setsKey);
      if (names.has(rosterName)) {
        sets[rosterName] = normalizeSetEntry(value);
      }
    });
  }

  return sets;
}

function pruneRolesForRoster(pokemon, rawRoles) {
  const names = new Set(pokemon.map((entry) => entry?.name).filter(Boolean));
  const roles = {};

  if (rawRoles && typeof rawRoles === "object") {
    Object.entries(rawRoles).forEach(([roleKey, roleValue]) => {
      const rosterName = resolveRosterName(pokemon, roleKey);
      if (names.has(rosterName) && typeof roleValue === "string" && roleValue.trim()) {
        roles[rosterName] = roleValue.trim();
      }
    });
  }

  return roles;
}

function pruneBringListForRoster(pokemon, rawBringList) {
  const names = new Set(pokemon.map((entry) => entry?.name).filter(Boolean));
  return (Array.isArray(rawBringList) ? rawBringList : [])
    .map((name) => resolveRosterName(pokemon, name))
    .filter((name) => names.has(name))
    .slice(0, 4);
}

/**
 * Canonical in-memory team record (expanded pokemon, normalized sets).
 */
export function normalizeTeamRecord(raw, { regulationIdFallback } = {}) {
  const source = raw && typeof raw === "object" ? raw : {};

  const legacySets =
    source.sets && typeof source.sets === "object"
      ? source.sets
      : source.movesets && typeof source.movesets === "object"
        ? source.movesets
        : {};

  const pokemon = normalizeTeamPokemonList(source.pokemon || []).slice(0, 6);
  const sets = pruneSetsForRoster(pokemon, legacySets);
  const roles = pruneRolesForRoster(pokemon, source.roles);
  const bringList = pruneBringListForRoster(pokemon, source.bringList);

  const regulationId =
    source.regulationId != null
      ? source.regulationId
      : regulationIdFallback;

  return {
    id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : "",
    name: typeof source.name === "string" && source.name.trim() ? source.name.trim() : "Team",
    regulationId,
    pokemon,
    sets,
    roles,
    bringList,
  };
}

/**
 * Strip to schema fields and compact pokemon for localStorage.
 */
export function compactTeamForStorage(teamRecord) {
  const normalized = normalizeTeamRecord(teamRecord);
  const compactPokemon = normalized.pokemon
    .map((entry) => compactPokemonFromApi(entry))
    .filter(Boolean);

  return {
    id: normalized.id,
    name: normalized.name,
    regulationId: normalized.regulationId,
    pokemon: compactPokemon,
    sets: normalized.sets,
    roles: normalized.roles,
    bringList: normalized.bringList,
  };
}

/**
 * Expand compact stored pokemon to API-compatible roster entries.
 */
export function expandTeamForUse(teamRecord) {
  const normalized = normalizeTeamRecord(teamRecord);
  return {
    ...normalized,
    pokemon: normalized.pokemon
      .map((entry) => expandCompactPokemon(compactPokemonFromApi(entry) || entry))
      .filter(Boolean),
  };
}

export function createNormalizedEmptySet() {
  return { ...EMPTY_POKEMON_SET };
}
