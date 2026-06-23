import {
  DEFAULT_REGULATION_ID,
  getStoredRegulationId,
  normalizeRegulationId,
} from "./regulation";
import { normalizeTeamRecord } from "./teamModel";

export const EMPTY_POKEMON_SET = {
  moves: [],
  moveTypes: {},
  ability: "",
  item: "",
  nature: "",
  teraType: "",
  evs: "",
  ivs: "",
  level: 50,
  gender: "",
  shiny: false,
  happiness: null,
  nickname: "",
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
      ivs: value.ivs || "",
      level:
        typeof value.level === "number" && !Number.isNaN(value.level) ? value.level : 50,
      gender: value.gender || "",
      shiny: Boolean(value.shiny),
      happiness:
        typeof value.happiness === "number" && !Number.isNaN(value.happiness)
          ? value.happiness
          : null,
      nickname: value.nickname || "",
    };
  }
  return { ...EMPTY_POKEMON_SET };
}

export function migrateTeamRecord(team) {
  const normalized = normalizeTeamRecord(team, {
    regulationIdFallback: getStoredRegulationId(),
  });

  return {
    ...normalized,
    regulationId: normalizeRegulationId(normalized.regulationId),
  };
}

export function createEmptyTeamRecord({ id, name, regulationId = DEFAULT_REGULATION_ID }) {
  return migrateTeamRecord({
    id,
    name,
    pokemon: [],
    sets: {},
    roles: {},
    bringList: [],
    regulationId,
  });
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
