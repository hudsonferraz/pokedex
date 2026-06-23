import { validateTeamSets } from "./regulationValidation";

describe("validateTeamSets learnset validation", () => {
  const incineroar = {
    name: "incineroar",
    abilities: [{ ability: { name: "intimidate" } }],
    moves: [],
  };

  test("warns when learnset is unavailable for configured moves", () => {
    const result = validateTeamSets([incineroar], {
      incineroar: {
        moves: ["fake-out", "flare-blitz", "knock-off", "parting-shot"],
      },
    });

    expect(result.warnings.some((warning) => warning.type === "learnset-unavailable")).toBe(
      true,
    );
    expect(result.warnings.some((warning) => warning.type === "move-not-in-learnset")).toBe(
      false,
    );
  });

  test("skips unavailable warning while learnset validation is pending", () => {
    const result = validateTeamSets(
      [incineroar],
      {
        incineroar: {
          moves: ["fake-out", "flare-blitz", "knock-off", "parting-shot"],
        },
      },
      { learnsetValidationPending: true },
    );

    expect(result.warnings.some((warning) => warning.type === "learnset-unavailable")).toBe(
      false,
    );
  });

  test("flags illegal moves when cached learnset is provided", () => {
    const result = validateTeamSets(
      [incineroar],
      {
        incineroar: {
          moves: ["transform", "flare-blitz", "knock-off", "parting-shot"],
        },
      },
      {
        learnsetBySpecies: {
          incineroar: new Set(["fake-out", "flare-blitz", "knock-off", "parting-shot"]),
        },
      },
    );

    expect(result.warnings.some((warning) => warning.type === "move-not-in-learnset")).toBe(
      true,
    );
    expect(result.warnings.some((warning) => warning.type === "learnset-unavailable")).toBe(
      false,
    );
  });
});
