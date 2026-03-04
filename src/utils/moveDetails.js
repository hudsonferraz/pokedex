/**
 * Build move info object from PokeAPI move response.
 * Used by PokemonDetail and TeamBuilder so move picker shows type, stats, effect.
 * @param {object} moveData - Response from getMoveDetails(url)
 * @param {object} move - Item from pokemon.moves (has move.name, move.url, version_group_details)
 * @returns {object} { name, level, type, power, accuracy, pp, damageClass, effect, effectChance }
 */
export function buildMoveInfoFromApi(moveData, move) {
  const fallback = {
    name: move?.move?.name ?? "",
    level: move?.version_group_details?.[0]?.level_learned_at ?? 0,
    type: "normal",
    power: null,
    accuracy: null,
    pp: null,
    damageClass: null,
    effect: null,
    effectChance: null,
  };
  if (!moveData) return fallback;

  const enEffect = moveData.effect_entries?.find((e) => e.language?.name === "en");
  let effect = enEffect?.short_effect || enEffect?.effect || null;
  const effectChance = moveData.effect_chance != null ? moveData.effect_chance : null;
  if (effect && effectChance != null) {
    effect = effect.replace(/\$effect_chance/g, String(effectChance));
  }

  return {
    name: move?.move?.name ?? "",
    level: move?.version_group_details?.[0]?.level_learned_at ?? 0,
    type: moveData.type?.name || "normal",
    power: moveData.power ?? null,
    accuracy: moveData.accuracy ?? null,
    pp: moveData.pp ?? null,
    damageClass: moveData.damage_class?.name ?? null,
    effect,
    effectChance,
  };
}
