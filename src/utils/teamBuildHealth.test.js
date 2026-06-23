import { computeTeamBuildHealth, getSuggestedStepId } from "./teamBuildHealth";

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
  test("flags incomplete roster", () => {
    const team = [makePokemon("Incineroar", ["fire", "dark"])];
    const result = computeTeamBuildHealth({
      team,
      sets: {},
      validateTeam: () => ({ issues: [], warnings: [{ message: "Team has 1/6" }] }),
    });

    expect(result.health.completedSets.count).toBe(0);
    expect(result.suggestedStepId).toBe("roster");
    expect(result.steps.find((step) => step.id === "roster").status).toBe("attention");
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
      { id: "roster", status: "complete" },
      { id: "sets", status: "attention" },
      { id: "legality", status: "complete" },
    ];
    expect(getSuggestedStepId(steps)).toBe("sets");
  });
});
