/**
 * Export team as plain text (names + types + moves if movesets provided).
 */
export function getTeamExportText(team, teamName = "Team", movesets = null) {
  if (!team || team.length === 0) {
    return `${teamName}\n(empty)`;
  }
  const lines = team.map((p) => {
    const types = (p.types || []).map((t) => t.type.name).join(" / ");
    let line = `${p.name} (${types})`;
    const moves = movesets && movesets[p.name] && Array.isArray(movesets[p.name]) ? movesets[p.name] : [];
    if (moves.length > 0) {
      line += `\n  ${moves.map((m) => m.replace(/-/g, " ")).join(" / ")}`;
    }
    return line;
  });
  return `${teamName}\n${lines.join("\n")}`;
}

/**
 * Encode team for share URL (names + optional movesets).
 */
export function encodeTeamForShare(team, teamName = "Team", movesets = null) {
  try {
    const payload = {
      name: teamName,
      pokemon: (team || []).map((p) => p.name),
      movesets: movesets && typeof movesets === "object" ? movesets : undefined,
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  } catch {
    return "";
  }
}

/**
 * Decode share URL payload into { name, pokemon: string[], movesets?: {} }.
 */
export function decodeTeamFromShare(encoded) {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const data = JSON.parse(json);
    const name = typeof data.name === "string" ? data.name : "Imported";
    const pokemon = Array.isArray(data.pokemon) ? data.pokemon : [];
    const movesets = data.movesets && typeof data.movesets === "object" ? data.movesets : null;
    return { name, pokemon, movesets };
  } catch {
    return null;
  }
}
