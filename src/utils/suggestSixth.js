import { fetchPokemonMeta } from "../services/metaDataService";
import { pikalyticsDisplayNameToApiId } from "./pikalyticsNames";
import { normalizeSpeciesId, formatSpeciesLabel } from "./regulation";

/**
 * Ranks 6th-Pokémon candidates by aggregated teammate pairing % across current roster.
 */
export async function rankSixthSuggestions(regulationId, team) {
  const members = (team || []).filter(Boolean);
  if (members.length !== 5) {
    return { suggestions: [], error: null };
  }

  const teamIds = new Set(members.map((pokemon) => normalizeSpeciesId(pokemon.name)));
  const scores = new Map();
  const sources = new Map();

  await Promise.allSettled(
    members.map(async (pokemon) => {
      const meta = await fetchPokemonMeta(regulationId, pokemon.name);
      if (meta.error || !meta.teammates?.length) return;

      meta.teammates.forEach((entry) => {
        const apiId = pikalyticsDisplayNameToApiId(entry.name);
        if (!apiId || teamIds.has(apiId)) return;

        scores.set(apiId, (scores.get(apiId) || 0) + entry.percent);
        const existing = sources.get(apiId) || new Set();
        existing.add(normalizeSpeciesId(pokemon.name));
        sources.set(apiId, existing);
      });
    }),
  );

  const suggestions = [...scores.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([speciesId, score]) => ({
      speciesId,
      label: formatSpeciesLabel(speciesId),
      score: Math.round(score * 10) / 10,
      pairedWith: [...(sources.get(speciesId) || [])].map(formatSpeciesLabel),
    }));

  return { suggestions, error: null };
}
