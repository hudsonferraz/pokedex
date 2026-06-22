import {
  getSpeciesClauseKey,
  getSpeciesRegulationStatus,
  validateTeamForRegulation,
} from "./regulation";
import { parseShowdownEvs } from "./regulationValidation";

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

  test("champions inherits regulation-i legality", () => {
    expect(getSpeciesRegulationStatus("miraidon", "champions-reg-ma").status).toBe("restricted");
  });
});

describe("species clause", () => {
  test("urshifu forms share a clause key", () => {
    expect(getSpeciesClauseKey("urshifu-rapid-strike")).toBe("urshifu");
    expect(getSpeciesClauseKey("urshifu-single-strike")).toBe("urshifu");
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
});

describe("parseShowdownEvs", () => {
  test("accepts valid spread", () => {
    expect(parseShowdownEvs("252 Atk / 4 Def / 252 Spe").valid).toBe(true);
  });
});
