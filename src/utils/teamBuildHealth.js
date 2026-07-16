import {
  getTeamWeaknesses,
  getTeamStats,
  getTeamMoveCoverage,
  getMoveCoverageGaps,
} from "./teamAnalysis";
import { normalizeSetEntry } from "./pokemonSets";

const VGC_SPEED_MOVES = {
  tailwind: ["tailwind"],
  trickRoom: ["trick-room"],
};

export const BUILD_STEP_IDS = [
  "roster",
  "sets",
  "legality",
  "matchups",
  "coach",
  "export",
];

export const BUILD_STEPS = [
  {
    id: "roster",
    label: "Build six Pokémon",
    shortLabel: "Roster",
    help: "Fill all six slots. Partner suggestions and the sixth-slot tool help when you are one short.",
  },
  {
    id: "sets",
    label: "Complete sets",
    shortLabel: "Sets",
    help: "Give each Pokémon four moves plus ability, item, and nature — or import a Showdown paste.",
  },
  {
    id: "legality",
    label: "Review legality",
    shortLabel: "Legality",
    help: "Check species clause, restricteds, items, and learnsets for your selected regulation.",
  },
  {
    id: "matchups",
    label: "Inspect matchup gaps",
    shortLabel: "Matchups",
    help: "Review meta threats, shared weaknesses, speed control, and bring-4 before you lock the squad.",
  },
  {
    id: "coach",
    label: "Ask the coach",
    shortLabel: "Coach",
    help: "Optional: get rule-based tips, then ask one focused question about speed, typing, or meta.",
  },
  {
    id: "export",
    label: "Export or share",
    shortLabel: "Export",
    help: "Copy a Showdown paste, plain-text summary, or share link with regulation and roles included.",
  },
];

function teamHasMove(team, setsByName, moveIds) {
  return team.some((pokemon) => {
    const set = normalizeSetEntry(setsByName?.[pokemon.name]);
    return set.moves.some((move) => moveIds.includes(move));
  });
}

function countCompleteSets(team, setsByName) {
  if (!team?.length) {
    return { complete: 0, total: 6, incompleteNames: [] };
  }

  const incompleteNames = [];
  let complete = 0;

  team.forEach((pokemon) => {
    if (!pokemon) return;
    const set = normalizeSetEntry(setsByName?.[pokemon.name]);
    const hasFourMoves = set.moves.length === 4;
    const hasCoreFields = Boolean(set.ability && set.item && set.nature);
    if (hasFourMoves && hasCoreFields) {
      complete += 1;
    } else {
      incompleteNames.push(pokemon.name);
    }
  });

  return { complete, total: 6, incompleteNames };
}

function getSpeedControlSummary(team, setsByName) {
  if (!team?.length) {
    return { status: "unknown", label: "—", hasControl: false };
  }

  const hasTailwind = teamHasMove(team, setsByName, VGC_SPEED_MOVES.tailwind);
  const hasTrickRoom = teamHasMove(team, setsByName, VGC_SPEED_MOVES.trickRoom);

  if (hasTailwind && hasTrickRoom) {
    return { status: "warn", label: "Tailwind + TR", hasControl: true };
  }
  if (hasTailwind) {
    return { status: "ok", label: "Tailwind", hasControl: true };
  }
  if (hasTrickRoom) {
    return { status: "ok", label: "Trick Room", hasControl: true };
  }
  if (team.length >= 4) {
    return { status: "warn", label: "No speed control", hasControl: false };
  }
  return { status: "unknown", label: "—", hasControl: false };
}

function getDamageBalanceSummary(team, setsByName) {
  if (!team?.length) {
    return { status: "unknown", label: "—", gapCount: 0, gaps: [] };
  }

  const stats = getTeamStats(team);
  const physicalBias = stats.attack - stats["special-attack"];
  let biasLabel = "Balanced";
  if (physicalBias >= 25) {
    biasLabel = "Physical-heavy";
  } else if (physicalBias <= -25) {
    biasLabel = "Special-heavy";
  }

  const coverage = getTeamMoveCoverage(team, setsByName);
  const gaps = getMoveCoverageGaps(coverage);
  const hasMoves = team.some((pokemon) => {
    const set = normalizeSetEntry(setsByName?.[pokemon.name]);
    return set.moves.length > 0;
  });

  if (!hasMoves) {
    return { status: "unknown", label: "Set moves first", gapCount: 0, gaps: [] };
  }

  const status = gaps.length >= 3 ? "warn" : gaps.length > 0 ? "attention" : "ok";
  const gapPreview =
    gaps.length > 0 ? `${biasLabel} · ${gaps.length} gap${gaps.length === 1 ? "" : "s"}` : biasLabel;

  return { status, label: gapPreview, gapCount: gaps.length, gaps };
}

function getMajorWeaknesses(team) {
  if (!team?.length) {
    return { status: "unknown", label: "—", types: [] };
  }

  const weaknesses = getTeamWeaknesses(team);
  const types = Object.entries(weaknesses)
    .filter(([, value]) => value === "super-effective")
    .map(([type]) => type);

  const status = types.length >= 3 ? "warn" : types.length > 0 ? "attention" : "ok";
  const label =
    types.length === 0
      ? "No shared 2×"
      : types
          .slice(0, 3)
          .map((type) => type.charAt(0).toUpperCase() + type.slice(1))
          .join(", ");

  return { status, label, types };
}

function getLegalitySummary(validation, { learnsetValidationPending = false } = {}) {
  if (learnsetValidationPending) {
    return {
      status: "attention",
      label: "Checking learnsets",
      issueCount: validation.issues?.length || 0,
      warningCount: validation.warnings?.length || 0,
    };
  }

  const issueCount = validation.issues?.length || 0;
  const warningCount = validation.warnings?.length || 0;

  if (issueCount > 0) {
    return {
      status: "error",
      label: `${issueCount} issue${issueCount === 1 ? "" : "s"}`,
      issueCount,
      warningCount,
    };
  }
  if (warningCount > 0) {
    return {
      status: "warn",
      label: `${warningCount} warning${warningCount === 1 ? "" : "s"}`,
      issueCount,
      warningCount,
    };
  }
  return { status: "ok", label: "Legal", issueCount: 0, warningCount: 0 };
}

function getStepStatus(stepId, context) {
  const { team, setCompletion, legality, speedControl, damageBalance, weaknesses } =
    context;

  switch (stepId) {
    case "roster":
      if (team.length === 0) return "upcoming";
      if (team.length < 6) return "attention";
      return "complete";

    case "sets":
      if (team.length === 0) return "upcoming";
      if (setCompletion.complete < team.length) return "attention";
      if (setCompletion.complete === 6) return "complete";
      return "attention";

    case "legality":
      if (team.length === 0) return "upcoming";
      if (legality.status === "error") return "attention";
      if (legality.status === "warn") return "attention";
      return "complete";

    case "matchups":
      if (team.length < 3) return "upcoming";
      if (
        weaknesses.status === "warn" ||
        damageBalance.status === "warn" ||
        speedControl.status === "warn"
      ) {
        return "attention";
      }
      return team.length >= 6 ? "complete" : "upcoming";

    case "coach":
      // Optional advisory step. Available once the roster is coach-ready;
      // complete at a full six so suggestion can advance to Export.
      if (team.length < 4) return "upcoming";
      if (team.length < 6) return "attention";
      return "complete";

    case "export":
      if (team.length < 6) return "upcoming";
      if (legality.status === "error") return "attention";
      return "complete";

    default:
      return "upcoming";
  }
}

export function getSuggestedStepId(steps) {
  const attentionStep = steps.find((step) => step.status === "attention");
  if (attentionStep) return attentionStep.id;

  const firstIncomplete = steps.find((step) => step.status !== "complete");
  if (firstIncomplete) return firstIncomplete.id;

  return "export";
}

export function computeTeamBuildHealth({
  team,
  sets,
  validateTeam,
  learnsetValidationPending = false,
}) {
  const roster = team.filter(Boolean);
  const setsByName = sets || {};
  const setCompletion = countCompleteSets(roster, setsByName);
  const validation = validateTeam
    ? validateTeam(roster, { sets, learnsetValidationPending })
    : { issues: [], warnings: [] };
  const legality = getLegalitySummary(validation, { learnsetValidationPending });
  const speedControl = getSpeedControlSummary(roster, setsByName);
  const damageBalance = getDamageBalanceSummary(roster, setsByName);
  const weaknesses = getMajorWeaknesses(roster);

  const stepContext = {
    team: roster,
    setCompletion,
    legality,
    speedControl,
    damageBalance,
    weaknesses,
  };

  const steps = BUILD_STEPS.map((step) => ({
    ...step,
    status: getStepStatus(step.id, stepContext),
  }));

  return {
    steps,
    suggestedStepId: getSuggestedStepId(steps),
    health: {
      legality,
      completedSets: {
        count: setCompletion.complete,
        total: setCompletion.total,
        rosterCount: roster.length,
        label: `${setCompletion.complete}/${roster.length || 6} sets`,
        incompleteNames: setCompletion.incompleteNames,
      },
      speedControl,
      damageBalance,
      weaknesses,
    },
  };
}
