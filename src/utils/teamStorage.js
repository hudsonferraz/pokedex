import { migrateTeamRecord, createEmptyTeamRecord } from "./pokemonSets";
import {
  compactTeamForStorage,
  expandTeamForUse,
  TEAM_SCHEMA_VERSION,
} from "./teamModel";
import { normalizeTeamPokemonList } from "./teamPokemonModel";

const TEAMS_KEY = "pokemon-teams";
const LEGACY_TEAM_KEY = "pokemon-team";

function generateId() {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeLoadedTeams(teams) {
  return teams.map((team) => expandTeamForUse(migrateTeamRecord(team)));
}

function loadFromStorage() {
  try {
    const raw = window.localStorage.getItem(TEAMS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.teams && Array.isArray(data.teams) && data.teams.length > 0) {
        const teams = normalizeLoadedTeams(data.teams);
        const activeTeamId =
          data.activeTeamId && teams.some((team) => team.id === data.activeTeamId)
            ? data.activeTeamId
            : teams[0].id;
        return { teams, activeTeamId };
      }
    }
  } catch {
    // ignore load error
  }

  try {
    const legacy = window.localStorage.getItem(LEGACY_TEAM_KEY);
    if (legacy) {
      const pokemon = JSON.parse(legacy);
      if (Array.isArray(pokemon) && pokemon.length > 0) {
        const team = expandTeamForUse(
          migrateTeamRecord(
            createEmptyTeamRecord({
              id: generateId(),
              name: "My Team",
            }),
          ),
        );
        team.pokemon = normalizeTeamPokemonList(pokemon);
        window.localStorage.removeItem(LEGACY_TEAM_KEY);
        const saveResult = saveToStorage([team], team.id);
        if (!saveResult.ok) {
          return { teams: [team], activeTeamId: team.id };
        }
        return { teams: [team], activeTeamId: team.id };
      }
    }
  } catch {
    // ignore migration error
  }

  const defaultTeam = expandTeamForUse(
    migrateTeamRecord(
      createEmptyTeamRecord({
        id: generateId(),
        name: "Team 1",
      }),
    ),
  );
  return { teams: [defaultTeam], activeTeamId: defaultTeam.id };
}

function saveToStorage(teams, activeTeamId) {
  const payload = {
    version: TEAM_SCHEMA_VERSION,
    teams: teams.map((team) => compactTeamForStorage(migrateTeamRecord(team))),
    activeTeamId,
  };

  try {
    window.localStorage.setItem(TEAMS_KEY, JSON.stringify(payload));
    return { ok: true };
  } catch (error) {
    const isQuotaExceeded =
      error?.name === "QuotaExceededError" ||
      error?.code === 22 ||
      error?.code === 1014;

    return {
      ok: false,
      reason: isQuotaExceeded ? "quota" : "write-failed",
      message: isQuotaExceeded
        ? "Team could not be saved — browser storage is full. Export your team or remove an older team."
        : "Team could not be saved to browser storage.",
    };
  }
}

function buildTeamLibraryBackup(teams) {
  return {
    version: TEAM_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    teams: (teams || []).map((team) => compactTeamForStorage(migrateTeamRecord(team))),
  };
}

function parseTeamLibraryBackup(raw) {
  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return { ok: false, error: "Backup file is not valid JSON." };
    }
  }

  if (!data || typeof data !== "object" || !Array.isArray(data.teams)) {
    return { ok: false, error: "Backup file is missing a teams list." };
  }

  if (data.version != null && Number(data.version) > TEAM_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Backup schema version ${data.version} is newer than this app supports.`,
    };
  }

  try {
    const teams = normalizeLoadedTeams(data.teams);
    if (teams.length === 0) {
      return { ok: false, error: "Backup file contains no teams." };
    }
    return { ok: true, teams, exportedAt: data.exportedAt || null };
  } catch {
    return { ok: false, error: "Backup file could not be read." };
  }
}

function uniqueRestoredName(desiredName, existingNames) {
  const base = (desiredName || "Restored team").trim() || "Restored team";
  if (!existingNames.has(base.toLowerCase())) {
    return base;
  }

  let suffix = 2;
  let candidate = `${base} (restored)`;
  while (existingNames.has(candidate.toLowerCase())) {
    candidate = `${base} (restored ${suffix})`;
    suffix += 1;
  }
  return candidate;
}

function mergeRestoredTeams(existingTeams, restoredTeams) {
  const existingNames = new Set(
    (existingTeams || []).map((team) => (team.name || "").trim().toLowerCase()).filter(Boolean),
  );

  const mergedAdditions = (restoredTeams || []).map((team) => {
    const name = uniqueRestoredName(team.name, existingNames);
    existingNames.add(name.toLowerCase());
    return {
      ...migrateTeamRecord(team),
      id: generateId(),
      name,
    };
  });

  const teams = [...(existingTeams || []), ...mergedAdditions].map((team) =>
    expandTeamForUse(migrateTeamRecord(team)),
  );

  return {
    teams,
    addedCount: mergedAdditions.length,
    activeTeamId: mergedAdditions[0]?.id || existingTeams?.[0]?.id || null,
  };
}

export {
  loadFromStorage,
  saveToStorage,
  generateId,
  TEAMS_KEY,
  buildTeamLibraryBackup,
  parseTeamLibraryBackup,
  mergeRestoredTeams,
};
