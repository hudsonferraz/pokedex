import React from "react";
import { loadFromStorage, saveToStorage, generateId } from "../utils/teamStorage";
import {
  EMPTY_POKEMON_SET,
  getMovesFromSet,
  mergeSetUpdate,
  migrateTeamRecord,
  normalizeSetEntry,
} from "../utils/pokemonSets";

const TeamContext = React.createContext({
  teams: [],
  activeTeamId: null,
  activeTeam: null,
  team: [],
  setActiveTeam: () => null,
  addTeam: () => null,
  removeTeam: () => null,
  renameTeam: () => null,
  setCurrentTeamPokemon: () => null,
  getPokemonSet: () => ({ ...EMPTY_POKEMON_SET }),
  updatePokemonSet: () => null,
  setPokemonSets: () => null,
  getMoveset: () => [],
  setMoveset: () => null,
  getRole: () => "",
  setRole: () => null,
  getBringList: () => [],
  toggleBringPokemon: () => null,
  setBringList: () => null,
  addToTeam: () => null,
  removeFromTeam: () => null,
  clearTeam: () => null,
  isInTeam: () => false,
  canAddToTeam: () => false,
});

function pruneSetsAndRoles(teamRecord, names) {
  const sets = teamRecord.sets && typeof teamRecord.sets === "object" ? teamRecord.sets : {};
  const roles = teamRecord.roles && typeof teamRecord.roles === "object" ? teamRecord.roles : {};
  const keptSets = {};
  const keptRoles = {};
  Object.keys(sets).forEach((name) => {
    if (names.has(name)) keptSets[name] = sets[name];
  });
  Object.keys(roles).forEach((name) => {
    if (names.has(name)) keptRoles[name] = roles[name];
  });
  const bringList = (teamRecord.bringList || []).filter((name) => names.has(name)).slice(0, 4);
  return { keptSets, keptRoles, bringList };
}

function TeamProviderWithState({ children }) {
  const [state, setState] = React.useState(() => loadFromStorage());

  const persist = React.useCallback((teams, activeTeamId) => {
    setState({ teams, activeTeamId });
    saveToStorage(teams, activeTeamId);
  }, []);

  const activeTeam =
    state.teams.find((team) => team.id === state.activeTeamId) || state.teams[0] || null;
  const team = activeTeam ? activeTeam.pokemon : [];

  const setActiveTeam = React.useCallback(
    (id) => {
      if (!state.teams.some((team) => team.id === id)) return;
      persist(state.teams, id);
    },
    [state.teams, persist],
  );

  const addTeam = React.useCallback(
    (optionalName) => {
      const name =
        typeof optionalName === "string" && optionalName.trim()
          ? optionalName.trim()
          : `Team ${state.teams.length + 1}`;
      const newTeam = migrateTeamRecord({
        id: generateId(),
        name,
        pokemon: [],
        sets: {},
        roles: {},
        bringList: [],
      });
      const teams = [...state.teams, newTeam];
      persist(teams, newTeam.id);
    },
    [state.teams, persist],
  );

  const removeTeam = React.useCallback(
    (id) => {
      const teams = state.teams.filter((team) => team.id !== id);
      if (teams.length === 0) return;
      const nextActive = state.activeTeamId === id ? teams[0].id : state.activeTeamId;
      persist(teams, nextActive);
    },
    [state.teams, state.activeTeamId, persist],
  );

  const renameTeam = React.useCallback(
    (id, name) => {
      const trimmed = (name || "").trim();
      if (!trimmed) return;
      const teams = state.teams.map((team) =>
        team.id === id ? { ...team, name: trimmed } : team,
      );
      persist(teams, state.activeTeamId);
    },
    [state.teams, state.activeTeamId, persist],
  );

  const replaceTeamPokemon = React.useCallback(
    (id, pokemon) => {
      const nextPokemon = Array.isArray(pokemon) ? pokemon : [];
      const teams = state.teams.map((team) => {
        if (team.id !== id) return team;
        const names = new Set(nextPokemon.map((entry) => entry && entry.name).filter(Boolean));
        const { keptSets, keptRoles, bringList } = pruneSetsAndRoles(team, names);
        return { ...team, pokemon: nextPokemon, sets: keptSets, roles: keptRoles, bringList };
      });
      persist(teams, state.activeTeamId);
    },
    [state.teams, state.activeTeamId, persist],
  );

  const addToTeam = React.useCallback(
    (pokemon) => {
      if (!activeTeam) return false;
      if (activeTeam.pokemon.length >= 6) return false;
      if (activeTeam.pokemon.some((entry) => entry && entry.name === pokemon.name)) return false;
      const updated = [...activeTeam.pokemon, pokemon];
      replaceTeamPokemon(activeTeam.id, updated);
      return true;
    },
    [activeTeam, replaceTeamPokemon],
  );

  const removeFromTeam = React.useCallback(
    (pokemonName) => {
      if (!activeTeam) return;
      const updated = activeTeam.pokemon.filter((entry) => entry && entry.name !== pokemonName);
      replaceTeamPokemon(activeTeam.id, updated);
    },
    [activeTeam, replaceTeamPokemon],
  );

  const clearTeam = React.useCallback(() => {
    if (!activeTeam) return;
    const teams = state.teams.map((team) =>
      team.id === activeTeam.id
        ? { ...team, pokemon: [], sets: {}, roles: {}, bringList: [] }
        : team,
    );
    persist(teams, state.activeTeamId);
  }, [activeTeam, state.teams, state.activeTeamId, persist]);

  const isInTeam = React.useCallback(
    (pokemonName) =>
      activeTeam ? activeTeam.pokemon.some((entry) => entry && entry.name === pokemonName) : false,
    [activeTeam],
  );

  const canAddToTeam = React.useCallback(
    () => (activeTeam ? activeTeam.pokemon.length < 6 : false),
    [activeTeam],
  );

  const setCurrentTeamPokemon = React.useCallback(
    (pokemon, setsToApply) => {
      if (!activeTeam) return;
      const nextPokemon = Array.isArray(pokemon) ? pokemon : [];
      const names = new Set(nextPokemon.map((entry) => entry && entry.name).filter(Boolean));
      const { keptSets, keptRoles, bringList } = pruneSetsAndRoles(activeTeam, names);

      const applied = {};
      if (setsToApply && typeof setsToApply === "object") {
        Object.entries(setsToApply).forEach(([name, entry]) => {
          if (names.has(name)) applied[name] = normalizeSetEntry(entry);
        });
      }

      const sets = { ...keptSets, ...applied };
      const teams = state.teams.map((team) =>
        team.id === activeTeam.id
          ? { ...team, pokemon: nextPokemon, sets, roles: keptRoles, bringList }
          : team,
      );
      persist(teams, state.activeTeamId);
    },
    [activeTeam, state.teams, state.activeTeamId, persist],
  );

  const getPokemonSet = React.useCallback(
    (pokemonName) => {
      if (!activeTeam?.sets) return { ...EMPTY_POKEMON_SET };
      return normalizeSetEntry(activeTeam.sets[pokemonName]);
    },
    [activeTeam],
  );

  const updatePokemonSet = React.useCallback(
    (pokemonName, patch) => {
      if (!activeTeam) return;
      const current = normalizeSetEntry(activeTeam.sets?.[pokemonName]);
      const sets = {
        ...(activeTeam.sets || {}),
        [pokemonName]: mergeSetUpdate(current, patch),
      };
      const teams = state.teams.map((team) =>
        team.id === activeTeam.id ? { ...team, sets } : team,
      );
      persist(teams, state.activeTeamId);
    },
    [activeTeam, state.teams, state.activeTeamId, persist],
  );

  const setPokemonSets = React.useCallback(
    (nextSets) => {
      if (!activeTeam) return;
      const sets = {};
      if (nextSets && typeof nextSets === "object") {
        Object.entries(nextSets).forEach(([name, entry]) => {
          sets[name] = normalizeSetEntry(entry);
        });
      }
      const teams = state.teams.map((team) =>
        team.id === activeTeam.id ? { ...team, sets } : team,
      );
      persist(teams, state.activeTeamId);
    },
    [activeTeam, state.teams, state.activeTeamId, persist],
  );

  const getMoveset = React.useCallback(
    (pokemonName) => getMovesFromSet(getPokemonSet(pokemonName)),
    [getPokemonSet],
  );

  const setMoveset = React.useCallback(
    (pokemonName, moves, moveTypes) => {
      const patch = { moves: Array.isArray(moves) ? moves.slice(0, 4) : [] };
      if (moveTypes && typeof moveTypes === "object") {
        patch.moveTypes = moveTypes;
      }
      updatePokemonSet(pokemonName, patch);
    },
    [updatePokemonSet],
  );

  const getRole = React.useCallback(
    (pokemonName) => {
      if (!activeTeam?.roles) return "";
      return activeTeam.roles[pokemonName] || "";
    },
    [activeTeam],
  );

  const setRole = React.useCallback(
    (pokemonName, role) => {
      if (!activeTeam) return;
      const roles = { ...(activeTeam.roles || {}) };
      if (!role) {
        delete roles[pokemonName];
      } else {
        roles[pokemonName] = role;
      }
      const teams = state.teams.map((team) =>
        team.id === activeTeam.id ? { ...team, roles } : team,
      );
      persist(teams, state.activeTeamId);
    },
    [activeTeam, state.teams, state.activeTeamId, persist],
  );

  const getBringList = React.useCallback(() => {
    if (!activeTeam?.bringList) return [];
    return activeTeam.bringList.slice(0, 4);
  }, [activeTeam]);

  const setBringList = React.useCallback(
    (names) => {
      if (!activeTeam) return;
      const bringList = Array.isArray(names)
        ? names.filter((name) => activeTeam.pokemon.some((entry) => entry?.name === name)).slice(0, 4)
        : [];
      const teams = state.teams.map((team) =>
        team.id === activeTeam.id ? { ...team, bringList } : team,
      );
      persist(teams, state.activeTeamId);
    },
    [activeTeam, state.teams, state.activeTeamId, persist],
  );

  const toggleBringPokemon = React.useCallback(
    (pokemonName) => {
      if (!activeTeam) return;
      const current = getBringList();
      if (current.includes(pokemonName)) {
        setBringList(current.filter((name) => name !== pokemonName));
        return;
      }
      if (current.length >= 4) return;
      setBringList([...current, pokemonName]);
    },
    [activeTeam, getBringList, setBringList],
  );

  const value = {
    teams: state.teams,
    activeTeamId: state.activeTeamId,
    activeTeam,
    team,
    setActiveTeam,
    addTeam,
    removeTeam,
    renameTeam,
    setCurrentTeamPokemon,
    getPokemonSet,
    updatePokemonSet,
    setPokemonSets,
    getMoveset,
    setMoveset,
    getRole,
    setRole,
    getBringList,
    toggleBringPokemon,
    setBringList,
    addToTeam,
    removeFromTeam,
    clearTeam,
    isInTeam,
    canAddToTeam,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export const TeamProvider = TeamProviderWithState;
export default TeamContext;
