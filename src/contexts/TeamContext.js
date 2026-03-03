import React from "react";
import { loadFromStorage, saveToStorage, generateId } from "../utils/teamStorage";

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
  getMoveset: () => [],
  setMoveset: () => null,
  setMovesets: () => null,
  addToTeam: () => null,
  removeFromTeam: () => null,
  clearTeam: () => null,
  isInTeam: () => false,
  canAddToTeam: () => false,
});

function TeamProviderWithState({ children }) {
  const [state, setState] = React.useState(() => loadFromStorage());

  const persist = React.useCallback((teams, activeTeamId) => {
    setState({ teams, activeTeamId });
    saveToStorage(teams, activeTeamId);
  }, []);

  const activeTeam = state.teams.find((t) => t.id === state.activeTeamId) || state.teams[0] || null;
  const team = activeTeam ? activeTeam.pokemon : [];

  const setActiveTeam = React.useCallback(
    (id) => {
      if (!state.teams.some((t) => t.id === id)) return;
      persist(state.teams, id);
    },
    [state.teams, persist]
  );

  const addTeam = React.useCallback(
    (optionalName) => {
      const name =
        typeof optionalName === "string" && optionalName.trim()
          ? optionalName.trim()
          : `Team ${state.teams.length + 1}`;
      const newTeam = { id: generateId(), name, pokemon: [], movesets: {} };
      const teams = [...state.teams, newTeam];
      persist(teams, newTeam.id);
    },
    [state.teams, persist]
  );

  const removeTeam = React.useCallback(
    (id) => {
      const teams = state.teams.filter((t) => t.id !== id);
      if (teams.length === 0) return;
      const nextActive = state.activeTeamId === id ? teams[0].id : state.activeTeamId;
      persist(teams, nextActive);
    },
    [state.teams, state.activeTeamId, persist]
  );

  const renameTeam = React.useCallback(
    (id, name) => {
      const trimmed = (name || "").trim();
      if (!trimmed) return;
      const teams = state.teams.map((t) => (t.id === id ? { ...t, name: trimmed } : t));
      persist(teams, state.activeTeamId);
    },
    [state.teams, state.activeTeamId, persist]
  );

  const replaceTeamPokemon = React.useCallback(
    (id, pokemon) => {
      const nextPokemon = Array.isArray(pokemon) ? pokemon : [];
      const teams = state.teams.map((t) => {
        if (t.id !== id) return t;
        const names = new Set(nextPokemon.map((p) => p && p.name).filter(Boolean));
        const movesets = t.movesets && typeof t.movesets === "object" ? t.movesets : {};
        const keptMovesets = {};
        Object.keys(movesets).forEach((name) => {
          if (names.has(name)) keptMovesets[name] = movesets[name];
        });
        return { ...t, pokemon: nextPokemon, movesets: keptMovesets };
      });
      persist(teams, state.activeTeamId);
    },
    [state.teams, state.activeTeamId, persist]
  );

  const addToTeam = React.useCallback(
    (pokemon) => {
      if (!activeTeam) return false;
      if (activeTeam.pokemon.length >= 6) return false;
      if (activeTeam.pokemon.some((p) => p && p.name === pokemon.name)) return false;
      const updated = [...activeTeam.pokemon, pokemon];
      replaceTeamPokemon(activeTeam.id, updated);
      return true;
    },
    [activeTeam, replaceTeamPokemon]
  );

  const removeFromTeam = React.useCallback(
    (pokemonName) => {
      if (!activeTeam) return;
      const updated = activeTeam.pokemon.filter((p) => p && p.name !== pokemonName);
      replaceTeamPokemon(activeTeam.id, updated);
    },
    [activeTeam, replaceTeamPokemon]
  );

  const clearTeam = React.useCallback(() => {
    if (!activeTeam) return;
    replaceTeamPokemon(activeTeam.id, []);
  }, [activeTeam, replaceTeamPokemon]);

  const isInTeam = React.useCallback(
    (pokemonName) => (activeTeam ? activeTeam.pokemon.some((p) => p && p.name === pokemonName) : false),
    [activeTeam]
  );

  const canAddToTeam = React.useCallback(() => (activeTeam ? activeTeam.pokemon.length < 6 : false), [activeTeam]);

  const setCurrentTeamPokemon = React.useCallback(
    (pokemon, movesetsToApply) => {
      if (!activeTeam) return;
      const nextPokemon = Array.isArray(pokemon) ? pokemon : [];
      const names = new Set(nextPokemon.map((p) => p && p.name).filter(Boolean));
      const currentMovesets = activeTeam.movesets && typeof activeTeam.movesets === "object" ? activeTeam.movesets : {};
      const keptMovesets = {};
      Object.keys(currentMovesets).forEach((name) => {
        if (names.has(name)) keptMovesets[name] = currentMovesets[name];
      });
      const applied = movesetsToApply && typeof movesetsToApply === "object"
        ? Object.fromEntries(
            Object.entries(movesetsToApply)
              .filter(([name, moves]) => names.has(name) && Array.isArray(moves))
              .map(([name, moves]) => [name, moves.slice(0, 4)])
          )
        : {};
      const movesets = { ...keptMovesets, ...applied };
      const teams = state.teams.map((t) =>
        t.id === activeTeam.id ? { ...t, pokemon: nextPokemon, movesets } : t
      );
      persist(teams, state.activeTeamId);
    },
    [activeTeam, state.teams, state.activeTeamId, persist]
  );

  const getMoveset = React.useCallback(
    (pokemonName) => {
      if (!activeTeam || !activeTeam.movesets) return [];
      const moves = activeTeam.movesets[pokemonName];
      return Array.isArray(moves) ? moves.slice(0, 4) : [];
    },
    [activeTeam]
  );

  const setMoveset = React.useCallback(
    (pokemonName, moves) => {
      if (!activeTeam) return;
      const list = Array.isArray(moves) ? moves.slice(0, 4) : [];
      const movesets = { ...(activeTeam.movesets || {}), [pokemonName]: list };
      const teams = state.teams.map((t) =>
        t.id === activeTeam.id ? { ...t, movesets } : t
      );
      persist(teams, state.activeTeamId);
    },
    [activeTeam, state.teams, state.activeTeamId, persist]
  );

  const setMovesets = React.useCallback(
    (nextMovesets) => {
      if (!activeTeam) return;
      const movesets = nextMovesets && typeof nextMovesets === "object" ? nextMovesets : {};
      const teams = state.teams.map((t) =>
        t.id === activeTeam.id ? { ...t, movesets } : t
      );
      persist(teams, state.activeTeamId);
    },
    [activeTeam, state.teams, state.activeTeamId, persist]
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
    getMoveset,
    setMoveset,
    setMovesets,
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
