import metaData from "../data/vgcMeta.json";
import { normalizeSpeciesId } from "./regulation";
import { getTeamWeaknesses } from "./teamAnalysis";

export function getMetaForRegulation(regulationId) {
  return metaData[regulationId] || metaData["regulation-i"];
}

export function getMetaThreatTips(team, regulationId) {
  if (!team?.length) return [];

  const meta = getMetaForRegulation(regulationId);
  const tips = [];
  const teamIds = new Set(team.map((pokemon) => normalizeSpeciesId(pokemon.name)));

  const missingMetaAnswers = (meta.topPokemon || [])
    .filter((speciesId, index, array) => array.indexOf(speciesId) === index)
    .filter((speciesId) => !teamIds.has(speciesId))
    .slice(0, 4);

  if (missingMetaAnswers.length >= 3) {
    tips.push(
      `Your roster does not include common meta picks (${missingMetaAnswers
        .map((id) => id.replace(/-/g, " "))
        .join(", ")}). That can be fine for anti-meta teams — make sure you have a plan into them.`,
    );
  }

  const weaknesses = getTeamWeaknesses(team);
  const criticalWeaknesses = Object.entries(weaknesses)
    .filter(([, value]) => value === "super-effective")
    .map(([type]) => type);

  (meta.cores || []).forEach((core) => {
    const overlap = core.pokemon.filter((speciesId) => teamIds.has(speciesId)).length;
    const corePresent = overlap >= 2;
    const corePartial = overlap === 1;

    if (corePresent) {
      tips.push(`You run the ${core.name} core (${overlap}/${core.pokemon.length} pieces). ${core.hint}`);
      return;
    }

    if (!corePartial && criticalWeaknesses.length > 0) {
      const weakToFireGrass =
        criticalWeaknesses.includes("fire") || criticalWeaknesses.includes("grass");
      if (core.id === "fire-grass" && weakToFireGrass) {
        tips.push(`Meta threat — ${core.name}: ${core.hint}`);
      }
    }

    if (!corePresent && !corePartial) {
      const hasAnswer = core.pokemon.some((speciesId) => teamIds.has(speciesId));
      if (!hasAnswer && ["fire-grass", "trick-room", "rain"].includes(core.id)) {
        tips.push(`No direct answer to ${core.name} on your team. ${core.hint}`);
      }
    }
  });

  return tips.slice(0, 4);
}
