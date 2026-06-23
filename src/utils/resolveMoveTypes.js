import { fetchMoveInfoBatch, getCachedMoveType } from "./moveDetailsCache";
import { normalizeSetEntry } from "./pokemonSets";

export function learnsetMapFromPokemon(pokemon) {
  const map = {};
  (pokemon?.moves || []).forEach((entry) => {
    const moveName = entry?.move?.name;
    if (moveName) {
      map[moveName] = entry;
    }
  });
  return map;
}

/**
 * Lazily resolves move types for a list of move slugs (batched, cached).
 */
export async function buildMoveTypesMap(moveNames, learnsetByName = {}) {
  const moveTypes = {};
  const uniqueNames = [...new Set((moveNames || []).filter(Boolean))];

  uniqueNames.forEach((moveName) => {
    const cachedType = getCachedMoveType(moveName);
    if (cachedType) {
      moveTypes[moveName] = cachedType;
    }
  });

  const missingNames = uniqueNames.filter((moveName) => !moveTypes[moveName]);
  if (missingNames.length === 0) {
    return moveTypes;
  }

  await fetchMoveInfoBatch(missingNames, learnsetByName, {
    onEach: (info) => {
      if (info?.name && info?.type) {
        moveTypes[info.name] = info.type;
      }
    },
  });

  return moveTypes;
}

/**
 * Returns sets with moveTypes filled from PokeAPI when missing (for coverage analysis).
 */
export async function enrichSetsWithMoveTypes(team, setsByName) {
  if (!team?.length) return setsByName || {};

  const enriched = {};
  const movesNeedingTypes = new Set();

  team.forEach((pokemon) => {
    if (!pokemon?.name) return;
    const base = normalizeSetEntry(setsByName?.[pokemon.name]);
    enriched[pokemon.name] = {
      ...base,
      moveTypes: { ...base.moveTypes },
    };
    base.moves.forEach((moveName) => {
      if (!base.moveTypes?.[moveName]) {
        movesNeedingTypes.add(moveName);
      }
    });
  });

  const moveTypes = await buildMoveTypesMap([...movesNeedingTypes]);
  team.forEach((pokemon) => {
    if (!pokemon?.name) return;
    const entry = enriched[pokemon.name];
    entry.moves.forEach((moveName) => {
      if (!entry.moveTypes[moveName] && moveTypes[moveName]) {
        entry.moveTypes[moveName] = moveTypes[moveName];
      }
    });
  });

  return enriched;
}
