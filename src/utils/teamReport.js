/**
 * Build a ranked Team report from computeTeamBuildHealth() output.
 */

const SEVERITY_RANK = {
  error: 0,
  warn: 1,
  info: 2,
};

export function buildTeamReport(health, { teamLength = 0 } = {}) {
  if (teamLength === 0) {
    return {
      issues: [],
      emptyLabel: "Import a Showdown paste or add Pokémon to start.",
    };
  }

  if (!health) {
    return { issues: [], emptyLabel: "Add Pokémon to see team issues." };
  }

  const issues = [];
  const { completedSets, legality, speedControl, damageBalance, weaknesses } = health;

  if (completedSets.incompleteNames?.length > 0) {
    issues.push({
      id: "incomplete-sets",
      severity: "warn",
      title: `${completedSets.incompleteNames.length} incomplete set${
        completedSets.incompleteNames.length === 1 ? "" : "s"
      }`,
      detail: completedSets.incompleteNames.slice(0, 4).join(", "),
      stepId: "build",
      speciesName: completedSets.incompleteNames[0] || null,
    });
  }

  if (completedSets.rosterCount < 6) {
    issues.push({
      id: "roster-size",
      severity: "info",
      title: `${completedSets.rosterCount}/6 on the roster`,
      detail: "Fill remaining slots or import a full paste.",
      stepId: "build",
      speciesName: null,
    });
  }

  if (legality.status === "error" || legality.issueCount > 0) {
    issues.push({
      id: "legality-error",
      severity: "error",
      title: legality.label || "Legality issues",
      detail: "Open Check to review format rules.",
      stepId: "check",
      speciesName: null,
    });
  } else if (legality.status === "warn" || legality.status === "attention") {
    issues.push({
      id: "legality-warn",
      severity: "warn",
      title: legality.label || "Legality warnings",
      detail: "Open Check for details.",
      stepId: "check",
      speciesName: null,
    });
  }

  if (speedControl.status === "warn") {
    issues.push({
      id: "speed-control",
      severity: "warn",
      title: speedControl.label,
      detail: "Consider Tailwind or Trick Room.",
      stepId: "tune",
      speciesName: null,
      tuneTab: "speed",
    });
  }

  if (damageBalance.status === "warn" || damageBalance.status === "attention") {
    issues.push({
      id: "coverage",
      severity: damageBalance.status === "warn" ? "warn" : "info",
      title: damageBalance.label,
      detail:
        damageBalance.gaps?.length > 0
          ? `Gaps: ${damageBalance.gaps.slice(0, 3).join(", ")}`
          : "Review offensive coverage.",
      stepId: "tune",
      speciesName: null,
      tuneTab: "coverage",
    });
  }

  if (weaknesses.status === "warn" || weaknesses.status === "attention") {
    issues.push({
      id: "weaknesses",
      severity: weaknesses.status === "warn" ? "warn" : "info",
      title: `Shared 2×: ${weaknesses.label}`,
      detail: "Open Coverage to inspect defensive profile.",
      stepId: "tune",
      speciesName: null,
      tuneTab: "coverage",
    });
  }

  issues.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  if (issues.length === 0) {
    return {
      issues: [],
      emptyLabel: "No major issues flagged — ready to tune or share.",
    };
  }

  return { issues, emptyLabel: null };
}
