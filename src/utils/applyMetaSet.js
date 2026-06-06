import { fetchPokemonMeta } from "../services/metaDataService";
import { buildSetPatchFromPokemonMeta } from "./pikalyticsNames";

export function getLearnsetMoveIds(pokemon) {
  return (pokemon?.moves || [])
    .map((entry) => entry.move?.name)
    .filter(Boolean);
}

export function spreadToSetPatch(spread) {
  if (!spread) {
    return {};
  }

  const patch = {};
  if (spread.nature) patch.nature = spread.nature;
  if (spread.evs) patch.evs = spread.evs;
  if (spread.ability) patch.ability = spread.ability;
  if (spread.item) patch.item = spread.item;
  if (spread.teraType) patch.teraType = spread.teraType;
  if (spread.moves?.length) {
    patch.moves = spread.moves.slice(0, 4);
  }
  return patch;
}

export async function resolveMetaSetPatch(regulationId, pokemon) {
  const result = await fetchPokemonMeta(regulationId, pokemon.name);

  if (result.error || !result.suggestedSet) {
    return {
      error: result.error || "No meta set available for this format.",
      meta: result,
    };
  }

  const patch = buildSetPatchFromPokemonMeta(result, getLearnsetMoveIds(pokemon));
  if (!patch) {
    return {
      error: "Could not build a set from meta data.",
      meta: result,
    };
  }

  return { patch, meta: result };
}

export async function applyMetaSetToPokemon({
  regulationId,
  pokemon,
  isInTeam,
  canAddToTeam,
  addToTeam,
  updatePokemonSet,
}) {
  const { patch, meta, error } = await resolveMetaSetPatch(regulationId, pokemon);

  if (error) {
    return { success: false, error, meta };
  }

  if (!isInTeam(pokemon.name)) {
    if (!canAddToTeam()) {
      return {
        success: false,
        error: "Team is full. Remove a Pokémon first.",
        meta,
      };
    }
    if (!addToTeam(pokemon)) {
      return {
        success: false,
        error: "Could not add Pokémon to team.",
        meta,
      };
    }
  }

  updatePokemonSet(pokemon.name, patch);
  return { success: true, patch, meta };
}
