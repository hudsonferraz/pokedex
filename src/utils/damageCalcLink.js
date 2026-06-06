import { getTeamShowdownExport } from "./teamExport";
import { normalizeSetEntry } from "./pokemonSets";
import { formatSpeciesLabel } from "./regulation";

/** Official Showdown calc — pick format inside the UI (no per-regulation path). */
export const SHOWDOWN_DAMAGE_CALC_URL = "https://calc.pokemonshowdown.com/";

/** Pikalytics Champions calc (Stat Points / current Champions rules). */
export const PIKALYTICS_CHAMPIONS_CALC_URL =
  "https://www.pikalytics.com/damage-calculator";

const CALC_URL_BY_REGULATION = {
  "champions-reg-ma": PIKALYTICS_CHAMPIONS_CALC_URL,
  "regulation-i": SHOWDOWN_DAMAGE_CALC_URL,
  "regulation-j": SHOWDOWN_DAMAGE_CALC_URL,
  "regulation-h": SHOWDOWN_DAMAGE_CALC_URL,
};

export function getDamageCalcUrl(regulationId) {
  return CALC_URL_BY_REGULATION[regulationId] || SHOWDOWN_DAMAGE_CALC_URL;
}

export function getDamageCalcLinkLabel(regulationId) {
  if (regulationId === "champions-reg-ma") {
    return "Pikalytics Champions calc →";
  }
  return "Showdown damage calc →";
}

/**
 * Opens the damage calc and copies the team paste for quick import.
 */
export async function openDamageCalcWithTeam(
  team,
  sets,
  teamName = "Team",
  regulationId = "champions-reg-ma",
) {
  const paste = getTeamShowdownExport(team, sets, teamName);
  const calcUrl = getDamageCalcUrl(regulationId);

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

export async function openDamageCalcWithPokemon(
  pokemon,
  set,
  regulationId = "champions-reg-ma",
) {
  if (!pokemon) {
    throw new Error("No Pokémon provided");
  }

  const normalizedSet = normalizeSetEntry(set);
  const sets = { [pokemon.name]: normalizedSet };

  return openDamageCalcWithTeam(
    [pokemon],
    sets,
    formatSpeciesLabel(pokemon.name),
    regulationId,
  );
}
