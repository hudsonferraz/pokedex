import { fetchMoveInfo, getCachedMoveType } from "./moveDetailsCache";
import { normalizeSetEntry } from "./pokemonSets";

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
      const cachedType = getCachedMoveType(moveName);
      const type = cachedType || (await fetchMoveInfo(moveName))?.type || "";
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
