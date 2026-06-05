import { getMoveDetails } from "../api";
import { normalizeSetEntry } from "./pokemonSets";

const moveTypeCache = new Map();

async function fetchMoveType(moveName) {
  if (moveTypeCache.has(moveName)) {
    return moveTypeCache.get(moveName);
  }

  try {
    const data = await getMoveDetails(`https://pokeapi.co/api/v2/move/${moveName}`);
    const type = data?.type?.name || "";
    moveTypeCache.set(moveName, type);
    return type;
  } catch {
    moveTypeCache.set(moveName, "");
    return "";
  }
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

  await Promise.all(
    [...movesNeedingTypes].map(async (moveName) => {
      const type = await fetchMoveType(moveName);
      if (!type) return;
      team.forEach((pokemon) => {
        const entry = enriched[pokemon.name];
        if (!entry?.moves?.includes(moveName)) return;
        entry.moveTypes[moveName] = type;
      });
    }),
  );

  return enriched;
}
