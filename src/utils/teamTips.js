import { getTeamWeaknesses, getTeamTypeCoverage, getTeamStats, getUniqueTypes } from "./teamAnalysis";

/**
 * Builds rule-based tips for the current team (no API, always free).
 * Used as fallback and alongside optional AI tips.
 */
export function getRuleBasedTips(team) {
  if (!team || team.length === 0) {
    return [
      "Add 1–6 Pokémon to your team to get tips.",
      "A balanced team usually has mixed types and roles (sweeper, wall, support).",
    ];
  }

  const weaknesses = getTeamWeaknesses(team);
  const coverage = getTeamTypeCoverage(team);
  const stats = getTeamStats(team);
  const uniqueTypes = getUniqueTypes(team);

  const superEffectiveWeaknesses = Object.entries(weaknesses)
    .filter(([, value]) => value === "super-effective")
    .map(([type]) => type);

  const noCoverageTypes = Object.entries(coverage)
    .filter(([, value]) => value === "no-effect")
    .map(([type]) => type);

  const tips = [];

  if (team.length < 6) {
    tips.push(`You have ${team.length}/6 Pokémon. Consider adding more for coverage and flexibility.`);
  }

  if (superEffectiveWeaknesses.length > 0) {
    const types = superEffectiveWeaknesses.slice(0, 5).join(", ");
    tips.push(`Your team is weak to: ${types}. Add a Pokémon that resists or can handle these types.`);
  }

  if (noCoverageTypes.length > 0 && noCoverageTypes.length <= 5) {
    const types = noCoverageTypes.join(", ");
    tips.push(`You have no super-effective damage against: ${types}. Consider a Pokémon with these attacking types.`);
  }

  if (uniqueTypes.length <= 2 && team.length >= 3) {
    tips.push("Your team has limited type diversity. Adding different types improves matchup options.");
  }

  const lowSpeed = stats.speed < 70 && team.length >= 4;
  const lowDefense = (stats.defense + stats["special-defense"]) / 2 < 75 && team.length >= 4;
  if (lowSpeed) {
    tips.push("Average Speed is on the lower side. Consider a fast Pokémon for revenge killing or setup.");
  }
  if (lowDefense) {
    tips.push("Bulk is a bit low. A defensive or support Pokémon can help your team last longer.");
  }

  if (tips.length === 0) {
    tips.push("Your team has decent type coverage and balance. Consider roles (lead, sweeper, wall) and move sets next.");
  }

  return tips;
}

/**
 * Builds a short text summary of the team for the AI context (names, types, weaknesses, coverage).
 */
export function getTeamSummaryForAI(team) {
  if (!team || team.length === 0) {
    return "The user has no Pokémon in their team yet.";
  }

  const weaknesses = getTeamWeaknesses(team);
  const coverage = getTeamTypeCoverage(team);
  const superEffectiveWeaknesses = Object.entries(weaknesses)
    .filter(([, value]) => value === "super-effective")
    .map(([type]) => type);
  const noCoverage = Object.entries(coverage)
    .filter(([, value]) => value === "no-effect")
    .map(([type]) => type);

  const namesAndTypes = team
    .filter(Boolean)
    .map((p) => {
      const types = (p.types || []).map((t) => t.type.name).join("/");
      return `${p.name} (${types})`;
    })
    .join(", ");

  let summary = `Team (${team.length}/6): ${namesAndTypes}.`;
  if (superEffectiveWeaknesses.length > 0) {
    summary += ` Weak to: ${superEffectiveWeaknesses.join(", ")}.`;
  }
  if (noCoverage.length > 0) {
    summary += ` No super-effective coverage vs: ${noCoverage.slice(0, 6).join(", ")}.`;
  }
  return summary;
}
