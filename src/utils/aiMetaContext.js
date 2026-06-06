import { fetchPokemonMeta } from "../services/metaDataService";
import { analyzeMetaGap } from "./metaGapAnalysis";
import { buildExplainabilityGaps } from "./teamTips";
import { normalizeSpeciesId } from "./regulation";
import { getUsagePercentFromMeta } from "./usageStats";

/**
 * Builds Pikalytics meta appendix for AI team summary.
 */
export async function buildMetaContextForAI(regulationId, team, liveMeta, tipContext = {}) {
  const gap = analyzeMetaGap(team, liveMeta);
  const lines = [];

  const explainGaps = buildExplainabilityGaps(team, tipContext);
  if (explainGaps.length) {
    lines.push(`Team gaps to address: ${explainGaps.join("; ")}.`);
  }

  if (gap.totalStaples > 0) {
    lines.push(
      `Meta staples (top ${gap.totalStaples} usage): ${gap.onTeamCount}/${team.length} on team.`,
    );
    if (gap.missing.length) {
      lines.push(`Missing meta staples: ${gap.missing.join(", ")}.`);
    }
  }

  const members = (team || []).filter(Boolean).slice(0, 6);
  const memberMeta = await Promise.allSettled(
    members.map(async (pokemon) => {
      const usageFromFormat = getUsagePercentFromMeta(liveMeta, pokemon.name);
      const detail = await fetchPokemonMeta(regulationId, pokemon.name);
      if (detail.error) {
        return usageFromFormat != null
          ? `${pokemon.name}: ${usageFromFormat}% usage (format data).`
          : null;
      }

      const parts = [pokemon.name];
      if (detail.usage != null) parts.push(`${detail.usage}% usage`);
      if (detail.winRate != null) parts.push(`${detail.winRate}% WR`);
      if (detail.teammates?.length) {
        parts.push(
          `common partners: ${detail.teammates
            .slice(0, 3)
            .map((entry) => entry.name)
            .join(", ")}`,
        );
      }
      if (detail.moves?.length) {
        parts.push(
          `top moves: ${detail.moves
            .slice(0, 4)
            .map((entry) => entry.name)
            .join(", ")}`,
        );
      }
      return parts.join("; ");
    }),
  );

  const metaLines = memberMeta
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => result.value);

  if (metaLines.length) {
    lines.push(`Pikalytics per-Pokémon meta: ${metaLines.join(" | ")}.`);
  }

  if (liveMeta?.cores?.length) {
    const relevantCores = liveMeta.cores
      .filter((core) =>
        (core.pokemon || []).some((speciesId) =>
          members.some(
            (pokemon) => normalizeSpeciesId(pokemon.name) === speciesId,
          ),
        ),
      )
      .slice(0, 2);

    relevantCores.forEach((core) => {
      lines.push(`Meta core note (${core.name}): ${core.hint}`);
    });
  }

  return lines.join(" ");
}
