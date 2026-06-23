import {
  parseShowdownPaste,
  parseShowdownSpeciesLine,
  showdownSpeciesToApiId,
  exportShowdownPaste,
  parsedShowdownToSet,
} from "./showdownTeam";
import { normalizeSetEntry } from "./pokemonSets";

function buildSampleTeam() {
  return {
    team: [
      { name: "incineroar" },
      { name: "rillaboom" },
      { name: "urshifu-rapid-strike" },
    ],
    sets: {
      incineroar: {
        item: "Safety Goggles",
        ability: "Intimidate",
        level: 50,
        gender: "M",
        teraType: "Grass",
        evs: "252 HP / 4 Atk / 252 Spe",
        ivs: "31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe",
        nature: "Careful",
        moves: ["fake-out", "parting-shot", "flare-blitz", "knock-off"],
        moveTypes: {},
      },
      rillaboom: {
        nickname: "Drummer",
        item: "Assault Vest",
        ability: "Grassy Surge",
        level: 50,
        teraType: "Fire",
        evs: "236 HP / 252 Atk / 20 Spe",
        nature: "Adamant",
        moves: ["fake-out", "grassy-glide", "wood-hammer", "u-turn"],
        moveTypes: {},
      },
      "urshifu-rapid-strike": {
        item: "Focus Sash",
        ability: "Unseen Fist",
        level: 50,
        shiny: true,
        happiness: 255,
        teraType: "Water",
        evs: "4 HP / 252 Atk / 252 Spe",
        nature: "Jolly",
        moves: ["close-combat", "surging-strikes", "aqua-jet", "protect"],
        moveTypes: {},
      },
    },
    teamName: "VGC Sample",
  };
}

function expectParsedMatchesSet(parsedEntry, originalSet, apiId) {
  const normalized = parsedShowdownToSet(parsedEntry);
  const expected = normalizeSetEntry(originalSet);

  expect(parsedEntry.apiId).toBe(apiId);
  expect(normalized.nickname).toBe(expected.nickname);
  expect(normalized.item).toBe(expected.item);
  expect(normalized.ability).toBe(expected.ability);
  expect(normalized.level).toBe(expected.level);
  expect(normalized.gender).toBe(expected.gender);
  expect(normalized.shiny).toBe(expected.shiny);
  expect(normalized.happiness).toBe(expected.happiness);
  expect(normalized.teraType).toBe(expected.teraType);
  expect(normalized.evs).toBe(expected.evs);
  expect(normalized.ivs).toBe(expected.ivs);
  expect(normalized.nature).toBe(expected.nature);
  expect(normalized.moves).toEqual(expected.moves);
}

describe("parseShowdownSpeciesLine", () => {
  test("parses nickname (species) format", () => {
    expect(parseShowdownSpeciesLine("Sparky (Pikachu)")).toEqual({
      speciesLine: "Pikachu",
      nickname: "Sparky",
      gender: "",
      apiId: "pikachu",
    });
  });

  test("parses gender suffix on species", () => {
    expect(parseShowdownSpeciesLine("Incineroar (M)")).toEqual({
      speciesLine: "Incineroar",
      nickname: "",
      gender: "M",
      apiId: "incineroar",
    });
  });

  test("parses hyphenated form species", () => {
    expect(parseShowdownSpeciesLine("Urshifu-Rapid-Strike")).toEqual({
      speciesLine: "Urshifu-Rapid-Strike",
      nickname: "",
      gender: "",
      apiId: "urshifu-rapid-strike",
    });
  });
});

describe("showdownSpeciesToApiId", () => {
  test("resolves nicknamed species with item", () => {
    expect(showdownSpeciesToApiId("Sparky (Pikachu) @ Light Ball")).toBe("pikachu");
  });
});

describe("parseShowdownPaste", () => {
  test("parses nicknamed pokemon with extended fields", () => {
    const paste = `Sparky (Pikachu) @ Light Ball
Ability: Static
Level: 100
Shiny: Yes
Gender: Male
Happiness: 200
Tera Type: Electric
EVs: 4 HP / 252 Spe
IVs: 31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe
Timid Nature
- Thunderbolt
- Volt Switch
- Fake Out
- Protect`;

    const [entry] = parseShowdownPaste(paste);
    expect(entry.apiId).toBe("pikachu");
    expect(entry.nickname).toBe("Sparky");
    expect(entry.item).toBe("Light Ball");
    expect(entry.level).toBe(100);
    expect(entry.shiny).toBe(true);
    expect(entry.gender).toBe("M");
    expect(entry.happiness).toBe(200);
    expect(entry.ivs).toBe("31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe");
    expect(entry.moves).toEqual(["thunderbolt", "volt-switch", "fake-out", "protect"]);
  });

  test("skips leading team name header", () => {
    const paste = `Worlds Practice

Incineroar (M) @ Safety Goggles
Ability: Intimidate
Level: 50
Careful Nature
- Fake Out
- Parting Shot
- Flare Blitz
- Knock Off`;

    const parsed = parseShowdownPaste(paste);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].apiId).toBe("incineroar");
  });
});

describe("exportShowdownPaste round-trip", () => {
  test("round-trips nickname and level", () => {
    const team = [{ name: "pikachu" }];
    const sets = {
      pikachu: {
        nickname: "Sparky",
        item: "Light Ball",
        ability: "Static",
        level: 100,
        shiny: true,
        gender: "M",
        happiness: 200,
        teraType: "Electric",
        evs: "4 HP / 252 Spe",
        ivs: "31 HP / 31 Spe",
        nature: "Timid",
        moves: ["thunderbolt", "protect"],
        moveTypes: {},
      },
    };

    const exported = exportShowdownPaste(team, sets, "Test Team");
    const parsed = parseShowdownPaste(exported);

    expect(exported.startsWith("Test Team\n\n")).toBe(true);
    expect(parsed).toHaveLength(1);
    expectParsedMatchesSet(parsed[0], sets.pikachu, "pikachu");
  });

  test("round-trips multi-mon team with forms and team header", () => {
    const { team, sets, teamName } = buildSampleTeam();
    const exported = exportShowdownPaste(team, sets, teamName);
    const parsed = parseShowdownPaste(exported);

    expect(parsed).toHaveLength(team.length);
    parsed.forEach((entry, index) => {
      expectParsedMatchesSet(entry, sets[team[index].name], team[index].name);
    });

    const exportedAgain = exportShowdownPaste(
      parsed.map((entry) => ({ name: entry.apiId })),
      Object.fromEntries(parsed.map((entry) => [entry.apiId, parsedShowdownToSet(entry)])),
      teamName,
    );
    const parsedAgain = parseShowdownPaste(exportedAgain);
    expect(parsedAgain).toHaveLength(team.length);
    parsedAgain.forEach((entry, index) => {
      expectParsedMatchesSet(entry, sets[team[index].name], team[index].name);
    });
  });

  test("exports hyphenated Showdown species names", () => {
    const exported = exportShowdownPaste(
      [{ name: "urshifu-rapid-strike" }],
      {
        "urshifu-rapid-strike": {
          moves: ["protect"],
          moveTypes: {},
        },
      },
    );

    expect(exported).toContain("Urshifu-Rapid-Strike");
    expect(parseShowdownPaste(exported)[0].apiId).toBe("urshifu-rapid-strike");
  });
});
