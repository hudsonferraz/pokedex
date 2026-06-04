export const EMPTY_POKEMON_SET = {
  moves: [],
  moveTypes: {},
  ability: "",
  item: "",
  nature: "",
  teraType: "",
  evs: "",
};

export function normalizeSetEntry(value) {
  if (!value) return { ...EMPTY_POKEMON_SET };
  if (Array.isArray(value)) {
    return { ...EMPTY_POKEMON_SET, moves: value.slice(0, 4) };
  }
  if (typeof value === "object") {
    return {
      moves: Array.isArray(value.moves) ? value.moves.slice(0, 4) : [],
      moveTypes:
        value.moveTypes && typeof value.moveTypes === "object" ? value.moveTypes : {},
      ability: value.ability || "",
      item: value.item || "",
      nature: value.nature || "",
      teraType: value.teraType || "",
      evs: value.evs || "",
    };
  }
  return { ...EMPTY_POKEMON_SET };
}

export function migrateTeamRecord(team) {
  const sets = {};
  if (team.sets && typeof team.sets === "object") {
    Object.entries(team.sets).forEach(([name, entry]) => {
      sets[name] = normalizeSetEntry(entry);
    });
  } else if (team.movesets && typeof team.movesets === "object") {
    Object.entries(team.movesets).forEach(([name, entry]) => {
      sets[name] = normalizeSetEntry(entry);
    });
  }

  const bringList = Array.isArray(team.bringList)
    ? team.bringList.filter((name) => typeof name === "string").slice(0, 4)
    : [];

  return {
    ...team,
    sets,
    bringList,
    roles: team.roles && typeof team.roles === "object" ? team.roles : {},
  };
}

export function getMovesFromSet(set) {
  const normalized = normalizeSetEntry(set);
  return normalized.moves;
}

export function mergeSetUpdate(current, patch) {
  const base = normalizeSetEntry(current);
  const next = { ...base, ...patch };
  if (patch.moves) {
    next.moves = patch.moves.slice(0, 4);
  }
  if (patch.moveTypes) {
    next.moveTypes = { ...base.moveTypes, ...patch.moveTypes };
  }
  return next;
}
