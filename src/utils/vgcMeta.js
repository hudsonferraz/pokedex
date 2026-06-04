import metaData from "../data/vgcMeta.json";
import { normalizeSpeciesId } from "./regulation";
import { getTeamWeaknesses } from "./teamAnalysis";

export function getMetaForRegulation(regulationId, liveMeta = null) {
  if (liveMeta?.topPokemon?.length) {
    return {
      sourceNote: liveMeta.source,
      sourceUrl: liveMeta.sourceUrl,
      updated: liveMeta.updated,
      live: liveMeta.live,
      topPokemon: liveMeta.topPokemon,
      cores: liveMeta.cores || [],
    };
  }
  const bundled = metaData[regulationId] || metaData["regulation-i"];
  return { ...bundled, live: false };
}

export function getMetaThreatTips(team, regulationId, liveMeta = null) {
  if (!team?.length) return [];

  const meta = getMetaForRegulation(regulationId, liveMeta);
  const tips = [];
  const teamIds = new Set(team.map((pokemon) => normalizeSpeciesId(pokemon.name)));

  const topList = meta.topPokemon || [];
  const missingMetaAnswers = topList
    .filter((speciesId, index, array) => array.indexOf(speciesId) === index)
    .filter((speciesId) => !teamIds.has(speciesId))
    .slice(0, 4);

  if (missingMetaAnswers.length >= 3) {
    tips.push(
      `Your roster skips several high-usage picks (${missingMetaAnswers
        .map((id) => id.replace(/-/g, " "))
        .join(", ")}). That can be fine for anti-meta teams — have a plan into them.`,
    );
  }

  const weaknesses = getTeamWeaknesses(team);
  const criticalWeaknesses = Object.entries(weaknesses)
    .filter(([, value]) => value === "super-effective")
    .map(([type]) => type);

  (meta.cores || []).forEach((core) => {
    const pokemonIds = (core.pokemon || []).map((id) => normalizeSpeciesId(id));
    const overlap = pokemonIds.filter((speciesId) => teamIds.has(speciesId)).length;
    const corePresent = overlap >= 2;
    const corePartial = overlap === 1;

    if (corePresent) {
      tips.push(`You run the ${core.name} core. ${core.hint}`);
      return;
    }

    if (!corePresent && !corePartial && pokemonIds.length >= 2) {
      const hasAnswer = pokemonIds.some((speciesId) => teamIds.has(speciesId));
      if (!hasAnswer) {
        tips.push(`No direct answer to ${core.name} on your team. ${core.hint}`);
      }
    }
  });

  if (
    tips.length === 0 &&
    criticalWeaknesses.length > 0 &&
    topList.includes("incineroar") &&
    !teamIds.has("incineroar")
  ) {
    tips.push(
      `Meta still leans on Incineroar (${liveMeta?.live ? "live usage" : "historical data"}). Consider Intimidate pressure or a physical-bulk answer.`,
    );
  }

  return tips.slice(0, 4);
}
