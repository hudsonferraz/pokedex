import { normalizeSetEntry } from "./pokemonSets";
import { exportShowdownPaste } from "./showdownTeam";

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

/**
 * Encode team for share URL (names + optional sets).
 */
export function encodeTeamForShare(team, teamName = "Team", sets = null, bringList = null) {
  try {
    const payload = {
      name: teamName,
      pokemon: (team || []).map((pokemon) => pokemon.name),
      sets: sets && typeof sets === "object" ? sets : undefined,
      bringList: Array.isArray(bringList) && bringList.length > 0 ? bringList : undefined,
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  } catch {
    return "";
  }
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
    return { name, pokemon, sets, bringList };
  } catch {
    return null;
  }
}

export function getTeamShowdownExport(team, teamName, sets) {
  return exportShowdownPaste(team, sets, teamName);
}
