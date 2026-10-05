import { computeTeamBuildHealth, getSuggestedStepId, getSlotCompleteness } from "./teamBuildHealth";
import { buildTeamReport } from "./teamReport";

function makePokemon(name, types) {
  return {
    name,
    types: types.map((type) => ({ type: { name: type } })),
    stats: [
      { stat: { name: "hp" }, base_stat: 80 },
      { stat: { name: "attack" }, base_stat: 100 },
      { stat: { name: "defense" }, base_stat: 80 },
      { stat: { name: "special-attack" }, base_stat: 60 },
      { stat: { name: "special-defense" }, base_stat: 80 },
      { stat: { name: "speed" }, base_stat: 90 },
    ],
  };
}

const fullSet = {
  moves: ["protect", "fake-out", "flare-blitz", "knock-off"],
  moveTypes: {
    protect: "normal",
    "fake-out": "normal",
    "flare-blitz": "fire",
    "knock-off": "dark",
  },
  ability: "Intimidate",
  item: "Safety Goggles",
  nature: "Adamant",
};

describe("teamBuildHealth", () => {
  test("flags incomplete roster on build step", () => {
    const team = [makePokemon("Incineroar", ["fire", "dark"])];
    const result = computeTeamBuildHealth({
      team,
      sets: {},
      validateTeam: () => ({ issues: [], warnings: [{ message: "Team has 1/6" }] }),
    });

    expect(result.health.completedSets.count).toBe(0);
    expect(result.suggestedStepId).toBe("build");
    expect(result.steps.find((step) => step.id === "build").status).toBe("attention");
    expect(result.steps.map((step) => step.id)).toEqual([
      "build",
      "check",
      "tune",
      "share",
    ]);
  });

  test("detects speed control from moves", () => {
    const team = Array.from({ length: 6 }, (_, index) =>
      makePokemon(`Mon${index}`, ["normal"]),
    );
    const sets = {
      Mon0: {
        ...fullSet,
        moves: ["tailwind", "protect", "helping-hand", "taunt"],
        moveTypes: {
          tailwind: "flying",
          protect: "normal",
          "helping-hand": "normal",
          taunt: "dark",
        },
      },
    };

    const result = computeTeamBuildHealth({
      team,
      sets,
      validateTeam: () => ({ issues: [], warnings: [] }),
    });

    expect(result.health.speedControl.hasControl).toBe(true);
    expect(result.health.speedControl.label).toBe("Tailwind");
  });

  test("prioritizes attention steps for suggestion", () => {
    const steps = [
      { id: "build", status: "complete" },
      { id: "check", status: "attention" },
      { id: "tune", status: "complete" },
    ];
    expect(getSuggestedStepId(steps)).toBe("check");
  });

  test("suggests share on a healthy full roster", () => {
    const team = Array.from({ length: 6 }, (_, index) =>
      makePokemon(`Mon${index}`, ["normal"]),
    );
    const sets = Object.fromEntries(
      team.map((pokemon) => [
        pokemon.name,
        {
          ...fullSet,
          moves: ["protect", "fake-out", "u-turn", "knock-off"],
          moveTypes: {
            protect: "normal",
            "fake-out": "normal",
            "u-turn": "bug",
            "knock-off": "dark",
          },
        },
      ]),
    );

    const result = computeTeamBuildHealth({
      team,
      sets,
      validateTeam: () => ({ issues: [], warnings: [] }),
    });

    expect(result.steps.find((step) => step.id === "share").status).toBe("complete");
    expect(result.health.coachReady).toBe(true);
    expect(result.steps.find((step) => step.id === "coach")).toBeUndefined();
  });

  test("getSlotCompleteness requires moves ability item nature", () => {
    expect(getSlotCompleteness(fullSet).isComplete).toBe(true);
    expect(getSlotCompleteness({ moves: ["protect"] }).isComplete).toBe(false);
  });
});

describe("teamReport", () => {
  test("empty team returns import-oriented empty label", () => {
    const report = buildTeamReport(null, { teamLength: 0 });
    expect(report.issues).toEqual([]);
    expect(report.emptyLabel).toMatch(/Import/i);
  });

  test("ranks legality errors above roster info", () => {
    const health = {
      completedSets: {
        count: 0,
        total: 6,
        rosterCount: 2,
        incompleteNames: ["A", "B"],
        label: "0/2 sets",
      },
      legality: { status: "error", label: "2 issues", issueCount: 2, warningCount: 0 },
      speedControl: { status: "unknown", label: "—" },
      damageBalance: { status: "unknown", label: "—" },
      weaknesses: { status: "unknown", label: "—" },
    };

    const report = buildTeamReport(health, { teamLength: 2 });
    expect(report.issues[0].id).toBe("legality-error");
    expect(report.issues.some((issue) => issue.id === "incomplete-sets")).toBe(true);
  });
});
