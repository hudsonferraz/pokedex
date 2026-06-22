import {
  parseShowdownPaste,
  parseShowdownSpeciesLine,
  showdownSpeciesToApiId,
  exportShowdownPaste,
} from "./showdownTeam";

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

  test("parses plain species name", () => {
    expect(parseShowdownSpeciesLine("Flutter Mane")).toEqual({
      speciesLine: "Flutter Mane",
      nickname: "",
      gender: "",
      apiId: "flutter-mane",
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
});

describe("exportShowdownPaste", () => {
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

    const exported = exportShowdownPaste(team, sets);
    const [entry] = parseShowdownPaste(exported);

    expect(entry.apiId).toBe("pikachu");
    expect(entry.nickname).toBe("Sparky");
    expect(entry.level).toBe(100);
    expect(entry.shiny).toBe(true);
    expect(entry.gender).toBe("M");
    expect(entry.happiness).toBe(200);
    expect(entry.ivs).toBe("31 HP / 31 Spe");
  });
});
