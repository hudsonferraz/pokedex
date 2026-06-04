import { getTeamShowdownExport } from "./teamExport";

export const SHOWDOWN_DAMAGE_CALC_URL = "https://calc.pokemonshowdown.com/gen9vgc2026regi/";

/**
 * Opens the Showdown damage calc and copies the team paste for quick import.
 */
export async function openDamageCalcWithTeam(team, sets, teamName = "Team") {
  const paste = getTeamShowdownExport(team, sets, teamName);
  const calcUrl = SHOWDOWN_DAMAGE_CALC_URL;

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(paste);
  }

  window.open(calcUrl, "_blank", "noopener,noreferrer");

  return {
    calcUrl,
    copied: Boolean(navigator.clipboard?.writeText),
    paste,
  };
}
