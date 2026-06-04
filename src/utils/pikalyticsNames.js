export function pikalyticsDisplayNameToApiId(displayName) {
  return (displayName || "")
    .trim()
    .toLowerCase()
    .replace(/['.]/g, "")
    .replace(/\s+/g, "-");
}

export function pikalyticsApiIdToUrlName(apiId) {
  return (apiId || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

export function pikalyticsMoveToApiId(displayName) {
  return (displayName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function pikalyticsEvsToShowdown(spread) {
  if (!spread || typeof spread !== "string") return "";
  const parts = spread.split("/").map((part) => parseInt(part, 10));
  if (parts.length !== 6 || parts.some((value) => Number.isNaN(value))) {
    return spread.trim();
  }
  const labels = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
  return parts
    .map((value, index) => (value > 0 ? `${value} ${labels[index]}` : null))
    .filter(Boolean)
    .join(" / ");
}

export function normalizeSpeciesId(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .trim()
    .toLowerCase()
    .replace(/['.]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Maps Pikalytics suggestedSet to a team set patch, preferring learnset-valid moves.
 */
export function buildSetPatchFromPokemonMeta(meta, learnsetMoveIds = []) {
  const suggested = meta?.suggestedSet;
  if (!suggested) return null;

  const learnset = new Set(learnsetMoveIds);
  let moves = (suggested.moves || []).slice(0, 4);
  if (learnset.size > 0) {
    const valid = moves.filter((move) => learnset.has(move));
    if (valid.length > 0) {
      moves = valid.slice(0, 4);
    }
  }

  return {
    ability: suggested.ability || "",
    item: suggested.item || "",
    nature: suggested.nature || "",
    teraType: suggested.teraType || "",
    evs: suggested.evs || "",
    moves,
  };
}
