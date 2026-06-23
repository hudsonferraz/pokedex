import { normalizeSetEntry } from "./pokemonSets";
import { exportShowdownPaste } from "./showdownTeam";
import { normalizeRegulationId } from "./regulation";
import { normalizeTeamRecord } from "./teamModel";
import { SHARE_URL_SAFE_LENGTH } from "./metaThreatHeatmap";

/**
 * Export team as plain text (names + types + moves if sets provided).
 */
export function getTeamExportText(team, teamName = "Team", sets = null) {
  if (!team || team.length === 0) {
    return `${teamName}\n(empty)`;
  }
  const lines = team.map((pokemon) => {
    const types = (pokemon.types || []).map((type) => type.type.name).join(" / ");
    const set = normalizeSetEntry(sets?.[pokemon.name]);
    let line = `${pokemon.name} (${types})`;
    if (set.item) line += ` @ ${set.item}`;
    if (set.ability) line += ` — ${set.ability}`;
    if (set.moves.length > 0) {
      line += `\n  ${set.moves.map((move) => move.replace(/-/g, " ")).join(" / ")}`;
    }
    return line;
  });
  return `${teamName}\n${lines.join("\n")}`;
}

function normalizeShareSets(sets) {
  if (!sets || typeof sets !== "object") {
    return null;
  }

  const normalized = {};
  Object.entries(sets).forEach(([name, entry]) => {
    normalized[name] = normalizeSetEntry(entry);
  });
  return normalized;
}

function buildSharePayload(team, teamName, sets, bringList, regulationId, roles) {
  const payload = {
    name: teamName,
    pokemon: (team || []).map((pokemon) => pokemon.name),
  };

  const normalizedSets = normalizeShareSets(sets);
  if (normalizedSets && Object.keys(normalizedSets).length > 0) {
    payload.sets = normalizedSets;
  }

  if (Array.isArray(bringList) && bringList.length > 0) {
    payload.bringList = bringList.slice(0, 4);
  }

  if (regulationId) {
    payload.regulationId = normalizeRegulationId(regulationId);
  }

  if (roles && typeof roles === "object" && Object.keys(roles).length > 0) {
    payload.roles = roles;
  }

  return payload;
}

/**
 * Encode team for share URL (names + optional sets, regulation, roles).
 */
export function encodeTeamForShare(
  team,
  teamName = "Team",
  sets = null,
  bringList = null,
  regulationId = null,
  roles = null,
) {
  try {
    const payload = buildSharePayload(team, teamName, sets, bringList, regulationId, roles);
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  } catch {
    return "";
  }
}

/**
 * Build full share URL and validate length.
 * @returns {{ url: string, tooLong: boolean, length: number }}
 */
export function buildTeamShareUrl(baseOrigin, basePath, team, teamName, sets, bringList, regulationId, roles) {
  const encoded = encodeTeamForShare(
    team,
    teamName,
    sets,
    bringList,
    regulationId,
    roles,
  );
  const path = basePath || "/";
  const url = `${baseOrigin}${path}?team=${encoded}`;
  return {
    url,
    tooLong: url.length > SHARE_URL_SAFE_LENGTH,
    length: url.length,
  };
}

/**
 * Decode share URL payload.
 */
export function decodeTeamFromShare(encoded) {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const data = JSON.parse(json);
    const name = typeof data.name === "string" ? data.name : "Imported";
    const pokemon = Array.isArray(data.pokemon) ? data.pokemon : [];
    let sets = null;

    if (data.sets && typeof data.sets === "object") {
      sets = data.sets;
    } else if (data.movesets && typeof data.movesets === "object") {
      sets = data.movesets;
    }

    const bringList = Array.isArray(data.bringList) ? data.bringList : null;
    const regulationId =
      typeof data.regulationId === "string" ? normalizeRegulationId(data.regulationId) : null;
    const roles =
      data.roles && typeof data.roles === "object" ? data.roles : null;

    const normalized = normalizeTeamRecord({
      name,
      pokemon: pokemon.map((speciesName) => ({ name: speciesName })),
      sets: sets || {},
      roles: roles || {},
      bringList: bringList || [],
      regulationId,
    });

    return {
      name: normalized.name,
      pokemon: normalized.pokemon.map((entry) => entry.name),
      sets: normalized.sets,
      bringList: normalized.bringList,
      regulationId: normalized.regulationId,
      roles: normalized.roles,
    };
  } catch {
    return null;
  }
}

export function getTeamShowdownExport(team, teamName, sets) {
  return exportShowdownPaste(team, sets, teamName);
}
