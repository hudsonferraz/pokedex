import { normalizeSpeciesId, formatSpeciesLabel } from "./regulation";

const META_STAPLE_LIMIT = 30;

/**
 * Compares roster against format top usage list.
 */
export function analyzeMetaGap(team, liveMeta) {
  const topPokemon = (liveMeta?.topPokemon || []).slice(0, META_STAPLE_LIMIT);
  if (!topPokemon.length) {
    return {
      totalStaples: 0,
      onTeamCount: 0,
      onTeam: [],
      missing: [],
      live: Boolean(liveMeta?.live),
      message: "No format usage data available for meta gap analysis.",
    };
  }

  const teamIds = new Set(
    (team || []).filter(Boolean).map((pokemon) => normalizeSpeciesId(pokemon.name)),
  );

  const onTeam = topPokemon.filter((speciesId) => teamIds.has(speciesId));
  const missing = topPokemon.filter((speciesId) => !teamIds.has(speciesId));

  const onTeamCount = onTeam.length;
  const total = Math.min(topPokemon.length, META_STAPLE_LIMIT);

  let message = "";
  if (team.length === 0) {
    message = `Top ${total} meta staples available — add Pokémon to see coverage.`;
  } else if (onTeamCount >= 4) {
    message = `Strong meta alignment (${onTeamCount}/${team.length} slots are top-${total} staples).`;
  } else if (onTeamCount >= 2) {
    message = `${onTeamCount}/${team.length} slots match top-${total} usage — consider filling gaps below.`;
  } else {
    message = `Only ${onTeamCount}/${team.length} slots are top-${total} staples — roster may be off-meta.`;
  }

  return {
    totalStaples: total,
    onTeamCount,
    onTeam: onTeam.map(formatSpeciesLabel),
    missing: missing.slice(0, 8).map(formatSpeciesLabel),
    missingIds: missing.slice(0, 8),
    live: Boolean(liveMeta?.live),
    message,
  };
}
