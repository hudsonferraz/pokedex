import {
  normalizeTeamRecord,
  compactTeamForStorage,
  expandTeamForUse,
  TEAM_SCHEMA_VERSION,
} from "./teamModel";
import { normalizeRegulationId, getStoredRegulationId } from "./regulation";
import { migrateTeamRecord } from "./pokemonSets";

describe("teamModel", () => {
  const pikachu = {
    id: 25,
    name: "pikachu",
    spriteUrl: "https://example.com/pikachu.png",
    types: ["electric"],
    stats: [{ stat: { name: "speed" }, base_stat: 90 }],
    abilities: ["static"],
  };

  test("migrates legacy movesets key into sets", () => {
    const team = normalizeTeamRecord(
      migrateTeamRecord({
        id: "t1",
        name: "Legacy",
        pokemon: [pikachu],
        movesets: { pikachu: { moves: ["thunderbolt", "protect", "fake-out", "volt-switch"] } },
      }),
    );

    expect(team.sets.pikachu.moves).toEqual([
      "thunderbolt",
      "protect",
      "fake-out",
      "volt-switch",
    ]);
    expect(team.movesets).toBeUndefined();
  });

  test("prunes sets and roles not on the roster", () => {
    const team = normalizeTeamRecord({
      id: "t1",
      name: "Team",
      regulationId: "regulation-i",
      pokemon: [pikachu],
      sets: {
        pikachu: { moves: ["thunderbolt"] },
        incineroar: { moves: ["fake-out"] },
      },
      roles: { pikachu: "lead", incineroar: "support" },
      bringList: ["pikachu", "incineroar"],
    });

    expect(Object.keys(team.sets)).toEqual(["pikachu"]);
    expect(Object.keys(team.roles)).toEqual(["pikachu"]);
    expect(team.bringList).toEqual(["pikachu"]);
  });

  test("compactTeamForStorage keeps only schema fields", () => {
    const stored = compactTeamForStorage({
      id: "t1",
      name: "Team",
      regulationId: "regulation-i",
      pokemon: [pikachu],
      sets: { pikachu: { moves: ["thunderbolt"] } },
      roles: {},
      bringList: [],
      extraField: true,
    });

    expect(stored.extraField).toBeUndefined();
    expect(stored.pokemon[0].spriteUrl).toBeTruthy();
    expect(stored.pokemon[0].moves).toBeUndefined();
    expect(stored.regulationId).toBe("regulation-i");
  });

  test("expandTeamForUse restores API-shaped pokemon", () => {
    const compact = compactTeamForStorage({
      id: "t1",
      name: "Team",
      regulationId: "regulation-i",
      pokemon: [pikachu],
      sets: {},
      roles: {},
      bringList: [],
    });

    const expanded = expandTeamForUse(compact);
    expect(expanded.pokemon[0].types[0].type.name).toBe("electric");
    expect(expanded.regulationId).toBe("regulation-i");
  });

  test("normalizes regulationId through migrateTeamRecord", () => {
    const team = migrateTeamRecord({
      id: "t1",
      name: "Team",
      pokemon: [],
      regulationId: "regulation-i",
    });
    expect(normalizeRegulationId(team.regulationId)).toBe("regulation-i");
  });

  test("TEAM_SCHEMA_VERSION is current", () => {
    expect(TEAM_SCHEMA_VERSION).toBe(3);
  });
});
