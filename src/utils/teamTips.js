import {
  getTeamWeaknesses,
  getTeamTypeCoverage,
  getTeamStats,
  getUniqueTypes,
} from "./teamAnalysis";
import { getMetaThreatTips } from "./vgcMeta";
import { normalizeSetEntry } from "./pokemonSets";

const VGC_MOVES = {
  tailwind: ["tailwind"],
  trickRoom: ["trick-room"],
  fakeOut: ["fake-out"],
  protect: ["protect"],
  followMe: ["follow-me", "rage-powder"],
};

const WEATHER_ABILITIES = {
  sun: ["drought", "orichalcum pulse"],
  rain: ["drizzle", "primordial sea"],
  snow: ["snow warning", "snowscape"],
};

function teamHasMove(team, setsByName, moveIds) {
  return team.some((pokemon) => {
    const set = normalizeSetEntry(setsByName?.[pokemon.name]);
    return set.moves.some((move) => moveIds.includes(move));
  });
}

function countTeamsWithAbility(team, setsByName, abilityNeedle) {
  const needle = abilityNeedle.toLowerCase();
  return team.filter((pokemon) => {
    const set = normalizeSetEntry(setsByName?.[pokemon.name]);
    return (set.ability || "").toLowerCase().includes(needle);
  }).length;
}

function getRoleCounts(rolesByName) {
  const counts = {};
  Object.values(rolesByName || {}).forEach((role) => {
    if (!role) return;
    counts[role] = (counts[role] || 0) + 1;
  });
  return counts;
}

function getVgcCompositionTips(team, setsByName, rolesByName) {
  const tips = [];
  if (!team?.length) return tips;

  const hasTailwind = teamHasMove(team, setsByName, VGC_MOVES.tailwind);
  const hasTrickRoom = teamHasMove(team, setsByName, VGC_MOVES.trickRoom);
  const hasFakeOut = teamHasMove(team, setsByName, VGC_MOVES.fakeOut);
  const hasRedirect = teamHasMove(team, setsByName, VGC_MOVES.followMe);
  const intimidateCount = countTeamsWithAbility(team, setsByName, "intimidate");
  const roleCounts = getRoleCounts(rolesByName);
  const leadCount = roleCounts.lead || 0;

  if (!hasTailwind && !hasTrickRoom && team.length >= 4) {
    tips.push(
      "No Tailwind or Trick Room detected. Most VGC teams want speed control — consider one unless your matchup plan is hard anti-meta.",
    );
  }

  if (hasTailwind && hasTrickRoom) {
    tips.push(
      "You have both Tailwind and Trick Room. Make sure only one game plan is active per matchup (often split across different Pokémon).",
    );
  }

  if (intimidateCount > 1) {
    tips.push(
      `You have ${intimidateCount} Intimidate sources. Diminishing returns — one cycle is usually enough unless you target specific matchups.`,
    );
  }

  if (intimidateCount === 0 && team.length >= 5) {
    tips.push(
      "No Intimidate on the team. Many meta teams use physical attackers — consider how you handle -1 Attack pressure.",
    );
  }

  if (leadCount === 0 && team.length >= 4) {
    tips.push('Tag at least one "Lead" role and consider Fake Out or redirection for turn-one safety.');
  } else if (leadCount > 0 && !hasFakeOut && !hasRedirect && team.length >= 4) {
    tips.push(
      "Leads without Fake Out or Follow Me / Rage Powder can be punished. Ensure your turn-one plan is still safe.",
    );
  }

  if (roleCounts.weather >= 1) {
    const hasSun = team.some((pokemon) => {
      const set = normalizeSetEntry(setsByName?.[pokemon.name]);
      return WEATHER_ABILITIES.sun.some((ability) =>
        (set.ability || "").toLowerCase().includes(ability),
      );
    });
    const hasRain = team.some((pokemon) => {
      const set = normalizeSetEntry(setsByName?.[pokemon.name]);
      return WEATHER_ABILITIES.rain.some((ability) =>
        (set.ability || "").toLowerCase().includes(ability),
      );
    });
    if (hasSun && hasRain) {
      tips.push("Both sun and rain tools detected — avoid conflicting weather timers on the same board.");
    }
  }

  if (roleCounts.tr >= 2) {
    tips.push("Multiple Trick Room role tags — confirm you are not over-investing in slow mode without anti-speed answers.");
  }

  return tips;
}

/**
 * Rule-based tips (no API). VGC-aware when sets/roles/regulation are provided.
 */
export function getRuleBasedTips(team, context = {}) {
  const { sets, roles, regulationId } = context;
  const setsByName = sets || {};
  const rolesByName = roles || {};

  if (!team || team.length === 0) {
    return [
      "Add 1–6 Pokémon to your team to get VGC tips.",
      "Use Showdown paste import, then set roles, items, and moves for doubles-specific advice.",
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

  tips.push(...getVgcCompositionTips(team, setsByName, rolesByName));

  if (regulationId) {
    tips.push(...getMetaThreatTips(team, regulationId, context.liveMeta));
  }

  if (team.length < 6) {
    tips.push(`You have ${team.length}/6 Pokémon. Register a full box for real VGC team preview.`);
  }

  if (superEffectiveWeaknesses.length > 0) {
    const types = superEffectiveWeaknesses.slice(0, 5).join(", ");
    tips.push(`Team is weak to: ${types}. In doubles, spread damage punishes shared weaknesses — patch with typings or Tera.`);
  }

  if (noCoverageTypes.length > 0 && noCoverageTypes.length <= 5) {
    tips.push(
      `Limited offensive pressure into: ${noCoverageTypes.join(", ")}. Add move types or Tera blast targets.`,
    );
  }

  if (uniqueTypes.length <= 2 && team.length >= 3) {
    tips.push("Low type diversity — doubles rewards resisting common spread attacks (Heat Wave, Dazzling Gleam, etc.).");
  }

  if (stats.speed < 70 && team.length >= 4 && !teamHasMove(team, setsByName, VGC_MOVES.trickRoom)) {
    tips.push("Slow average Speed without Trick Room — you may need Tailwind, priority, or a TR mode.");
  }

  const seen = new Set();
  const unique = tips.filter((tip) => {
    if (seen.has(tip)) return false;
    seen.add(tip);
    return true;
  });

  if (unique.length === 0) {
    unique.push(
      "Solid baseline. Refine bring-4, speed tiers, and Tera plans for your regulation meta.",
    );
  }

  return unique.slice(0, 10);
}

/**
 * Rich team summary for AI (doubles / VGC context).
 */
export function getTeamSummaryForAI(team, context = {}) {
  if (!team || team.length === 0) {
    return "The user has no Pokémon in their team yet. They are building for Pokémon VGC doubles (6 registered, bring 4).";
  }

  const {
    sets,
    roles,
    bringList,
    regulationLabel,
    regulationId,
  } = context;

  const setsByName = sets || {};
  const rolesByName = roles || {};
  const weaknesses = getTeamWeaknesses(team);
  const superEffectiveWeaknesses = Object.entries(weaknesses)
    .filter(([, value]) => value === "super-effective")
    .map(([type]) => type);

  const memberLines = team.filter(Boolean).map((pokemon) => {
    const types = (pokemon.types || []).map((entry) => entry.type.name).join("/");
    const set = normalizeSetEntry(setsByName[pokemon.name]);
    const role = rolesByName[pokemon.name] || "unspecified";
    const moves =
      set.moves.length > 0
        ? set.moves.map((move) => move.replace(/-/g, " ")).join(", ")
        : "moves not set";
    const parts = [
      `${pokemon.name} (${types})`,
      `role: ${role}`,
      set.ability ? `ability: ${set.ability}` : null,
      set.item ? `item: ${set.item}` : null,
      set.nature ? `nature: ${set.nature}` : null,
      set.teraType ? `Tera: ${set.teraType}` : null,
      `moves: ${moves}`,
    ].filter(Boolean);
    return parts.join("; ");
  });

  let summary = `VGC doubles team (${team.length}/6 registered).`;
  if (regulationLabel || regulationId) {
    summary += ` Regulation: ${regulationLabel || regulationId}.`;
  }
  summary += ` Roster: ${memberLines.join(" | ")}.`;

  if (bringList?.length) {
    summary += ` Planned bring-4: ${bringList.join(", ")}.`;
  }

  if (superEffectiveWeaknesses.length > 0) {
    summary += ` Shared weaknesses: ${superEffectiveWeaknesses.join(", ")}.`;
  }

  const hasTailwind = teamHasMove(team, setsByName, VGC_MOVES.tailwind);
  const hasTr = teamHasMove(team, setsByName, VGC_MOVES.trickRoom);
  if (hasTailwind) summary += " Has Tailwind.";
  if (hasTr) summary += " Has Trick Room.";

  if (context.metaAppendix) {
    summary += ` ${context.metaAppendix}`;
  }

  return summary;
}
