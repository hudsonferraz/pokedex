const TEAMS_KEY = "pokemon-teams";
const LEGACY_TEAM_KEY = "pokemon-team";

function generateId() {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage() {
  try {
    const raw = window.localStorage.getItem(TEAMS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.teams && Array.isArray(data.teams) && data.teams.length > 0) {
        const teams = data.teams.map((t) => ({
          ...t,
          movesets: t.movesets && typeof t.movesets === "object" ? t.movesets : {},
        }));
        return {
          teams,
          activeTeamId: data.activeTeamId || data.teams[0].id,
        };
      }
    }
  } catch {
    // ignore load error
  }

  // Migrate legacy single team
  try {
    const legacy = window.localStorage.getItem(LEGACY_TEAM_KEY);
    if (legacy) {
      const pokemon = JSON.parse(legacy);
      if (Array.isArray(pokemon) && pokemon.length > 0) {
        const team = { id: generateId(), name: "My Team", pokemon, movesets: {} };
        window.localStorage.removeItem(LEGACY_TEAM_KEY);
        const payload = { teams: [team], activeTeamId: team.id };
        window.localStorage.setItem(TEAMS_KEY, JSON.stringify(payload));
        return payload;
      }
    }
  } catch {
    // ignore migration error
  }

  const defaultTeam = { id: generateId(), name: "Team 1", pokemon: [], movesets: {} };
  return { teams: [defaultTeam], activeTeamId: defaultTeam.id };
}

function saveToStorage(teams, activeTeamId) {
  window.localStorage.setItem(TEAMS_KEY, JSON.stringify({ teams, activeTeamId }));
}

export { loadFromStorage, saveToStorage, generateId, TEAMS_KEY };
