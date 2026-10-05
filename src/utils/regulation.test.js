import {
  getSpeciesClauseKey,
  getSpeciesRegulationStatus,
  getRegulationLegalityTransparency,
  validateTeamForRegulation,
} from "./regulation";
import { parseShowdownEvs } from "./regulationValidation";
import { migrateTeamRecord } from "./pokemonSets";

describe("regulation legality", () => {
  test("flutter-mane is legal in regulation-i", () => {
    expect(getSpeciesRegulationStatus("flutter-mane", "regulation-i").status).toBe("legal");
  });

  test("urshifu is legal in regulation-i", () => {
    expect(getSpeciesRegulationStatus("urshifu-rapid-strike", "regulation-i").status).toBe(
      "legal",
    );
  });

  test("miraidon is restricted in regulation-i", () => {
    expect(getSpeciesRegulationStatus("miraidon", "regulation-i").status).toBe("restricted");
  });

  test("pecharunt is banned in regulation-i", () => {
    expect(getSpeciesRegulationStatus("pecharunt", "regulation-i").status).toBe("banned");
  });

  test("champions reg m-a uses curated ban-only legality", () => {
    expect(getSpeciesRegulationStatus("miraidon", "champions-reg-ma").status).toBe("banned");
  });

  test("champions reg m-b uses curated ban-only legality", () => {
    expect(getSpeciesRegulationStatus("koraidon", "champions-reg-mb").status).toBe("banned");
    expect(getSpeciesRegulationStatus("incineroar", "champions-reg-mb").status).toBe("legal");
  });

  test("champions reg m-c bans legendary mythical and paradox", () => {
    expect(getSpeciesRegulationStatus("miraidon", "champions-reg-mc").status).toBe("banned");
    expect(getSpeciesRegulationStatus("mewtwo", "champions-reg-mc").status).toBe("banned");
    expect(getSpeciesRegulationStatus("flutter-mane", "champions-reg-mc").status).toBe("banned");
    expect(getSpeciesRegulationStatus("rillaboom", "champions-reg-mc").status).toBe("legal");
    expect(getSpeciesRegulationStatus("incineroar", "champions-reg-mc").status).toBe("legal");
  });

  test("incineroar is legal in regulation-h", () => {
    expect(getSpeciesRegulationStatus("incineroar", "regulation-h").status).toBe("legal");
  });

  test("flutter-mane is banned in regulation-h", () => {
    expect(getSpeciesRegulationStatus("flutter-mane", "regulation-h").status).toBe("banned");
  });

  test("koraidon is banned in regulation-h", () => {
    expect(getSpeciesRegulationStatus("koraidon", "regulation-h").status).toBe("banned");
  });
});

describe("species clause", () => {
  test("urshifu forms share a clause key", () => {
    expect(getSpeciesClauseKey("urshifu-rapid-strike")).toBe("urshifu");
    expect(getSpeciesClauseKey("urshifu-single-strike")).toBe("urshifu");
  });
});

describe("regulation transparency", () => {
  test("returns null for verified champions reg m-c", () => {
    const notice = getRegulationLegalityTransparency(
      validateTeamForRegulation([], "champions-reg-mc").regulation,
    );

    expect(notice).toBeNull();
  });

  test("returns null for verified regulation-i", () => {
    const notice = getRegulationLegalityTransparency(
      validateTeamForRegulation([], "regulation-i").regulation,
    );

    expect(notice).toBeNull();
  });

  test("does not emit legality-unverified warning for champions reg m-c", () => {
    const result = validateTeamForRegulation([], "champions-reg-mc");
    expect(result.warnings.some((warning) => warning.type === "legality-unverified")).toBe(
      false,
    );
  });
});

describe("validateTeamForRegulation", () => {
  const incineroar = {
    name: "incineroar",
    abilities: [{ ability: { name: "intimidate" } }],
    moves: [{ move: { name: "fake-out" } }, { move: { name: "flare-blitz" } }],
  };

  test("flags duplicate items", () => {
    const result = validateTeamForRegulation(
      [incineroar, { ...incineroar, name: "rillaboom" }],
      "regulation-i",
      {
        sets: {
          incineroar: { item: "Sitrus Berry", moves: ["fake-out", "flare-blitz", "knock-off", "parting-shot"] },
          rillaboom: { item: "Sitrus Berry", moves: ["fake-out", "grassy-glide", "u-turn", "wood-hammer"] },
        },
      },
    );

    expect(result.issues.some((issue) => issue.type === "duplicate-item")).toBe(true);
  });

  test("flags duplicate urshifu forms under species clause", () => {
    const result = validateTeamForRegulation(
      [
        { name: "urshifu-rapid-strike" },
        { name: "urshifu-single-strike" },
      ],
      "regulation-i",
      { sets: {} },
    );

    expect(result.issues.some((issue) => issue.type === "duplicate-species")).toBe(true);
  });

  test("flags invalid EV totals", () => {
    const result = validateTeamForRegulation([incineroar], "regulation-i", {
      sets: {
        incineroar: {
          moves: ["fake-out", "flare-blitz", "knock-off", "parting-shot"],
          evs: "252 Atk / 252 Spe / 252 HP",
        },
      },
    });

    expect(result.issues.some((issue) => issue.type === "invalid-evs")).toBe(true);
  });

  test("flags banned paradox pokemon in regulation-h", () => {
    const result = validateTeamForRegulation(
      [incineroar, { name: "flutter-mane" }],
      "regulation-h",
      {
        sets: {
          incineroar: { moves: ["fake-out", "flare-blitz", "knock-off", "parting-shot"] },
          "flutter-mane": { moves: ["moonblast", "dazzling-gleam", "shadow-ball", "protect"] },
        },
      },
    );

    expect(result.issues.some((issue) => issue.type === "banned")).toBe(true);
    expect(result.issues.some((issue) => issue.type === "restricted-limit")).toBe(false);
  });
});

describe("parseShowdownEvs", () => {
  test("accepts valid spread", () => {
    expect(parseShowdownEvs("252 Atk / 4 Def / 252 Spe").valid).toBe(true);
  });
});

describe("per-team regulation migration", () => {
  test("migrateTeamRecord preserves regulationId on team records", () => {
    const team = migrateTeamRecord({
      id: "t1",
      name: "Team 1",
      pokemon: [],
      regulationId: "regulation-i",
    });
    expect(team.regulationId).toBe("regulation-i");
  });
});
