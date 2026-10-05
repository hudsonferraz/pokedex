import {
  buildTeamLibraryBackup,
  parseTeamLibraryBackup,
  mergeRestoredTeams,
} from "./teamStorage";
import { TEAM_SCHEMA_VERSION } from "./teamModel";

describe("team library backup", () => {
  test("buildTeamLibraryBackup includes version and compact teams", () => {
    const backup = buildTeamLibraryBackup([
      {
        id: "t1",
        name: "Alpha",
        pokemon: [{ name: "incineroar", types: [{ type: { name: "fire" } }] }],
        sets: {},
        roles: {},
        bringList: [],
        regulationId: "champions-reg-mc",
      },
    ]);

    expect(backup.version).toBe(TEAM_SCHEMA_VERSION);
    expect(backup.exportedAt).toEqual(expect.any(String));
    expect(backup.teams).toHaveLength(1);
    expect(backup.teams[0].name).toBe("Alpha");
  });

  test("parseTeamLibraryBackup rejects invalid payloads", () => {
    expect(parseTeamLibraryBackup("{").ok).toBe(false);
    expect(parseTeamLibraryBackup({ version: 3 }).ok).toBe(false);
    expect(parseTeamLibraryBackup({ version: 3, teams: [] }).ok).toBe(false);
  });

  test("mergeRestoredTeams appends with unique names and new ids", () => {
    const existing = [
      {
        id: "t1",
        name: "Team 1",
        pokemon: [],
        sets: {},
        roles: {},
        bringList: [],
        regulationId: "champions-reg-mc",
      },
    ];
    const restored = [
      {
        id: "old",
        name: "Team 1",
        pokemon: [],
        sets: {},
        roles: {},
        bringList: [],
        regulationId: "champions-reg-mc",
      },
    ];

    const merged = mergeRestoredTeams(existing, restored);
    expect(merged.teams).toHaveLength(2);
    expect(merged.addedCount).toBe(1);
    expect(merged.teams[1].id).not.toBe("old");
    expect(merged.teams[1].name).toMatch(/restored/i);
  });
});
