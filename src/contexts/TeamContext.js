import React from "react";
import { loadFromStorage, saveToStorage, generateId } from "../utils/teamStorage";
import { normalizeTeamPokemonList } from "../utils/teamPokemonModel";
import {
  EMPTY_POKEMON_SET,
  getMovesFromSet,
  mergeSetUpdate,
  normalizeSetEntry,
  createEmptyTeamRecord,
} from "../utils/pokemonSets";
import { DEFAULT_REGULATION_ID, normalizeRegulationId } from "../utils/regulation";

const TeamContext = React.createContext({
  teams: [],
  activeTeamId: null,
  activeTeam: null,
  team: [],
  setActiveTeam: () => null,
  addTeam: () => null,
  addTeamWithRoster: () => null,
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
  addPokemonToTeamWithSet: () => null,
  removeFromTeam: () => null,
  clearTeam: () => null,
  isInTeam: () => false,
  canAddToTeam: () => false,
  storageError: null,
  clearStorageError: () => null,
  setTeamRegulationId: () => null,
  undoLastChange: () => false,
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

function applyRosterToTeamRecord(
  teamRecord,
  pokemon,
  setsToApply,
  rolesToApply,
  bringListNames,
) {
  const nextPokemon = normalizeTeamPokemonList(pokemon);
  const names = new Set(
    nextPokemon.map((entry) => entry?.name).filter(Boolean),
  );
  const { keptSets, keptRoles, bringList: prunedBringList } = pruneSetsAndRoles(
    teamRecord,
    names,
  );

  const appliedSets = {};
  if (setsToApply && typeof setsToApply === "object") {
    Object.entries(setsToApply).forEach(([speciesName, entry]) => {
      if (names.has(speciesName)) {
        appliedSets[speciesName] = normalizeSetEntry(entry);
      }
    });
  }

  const appliedRoles = { ...keptRoles };
  if (rolesToApply && typeof rolesToApply === "object") {
    Object.entries(rolesToApply).forEach(([speciesName, role]) => {
      if (names.has(speciesName) && typeof role === "string" && role.trim()) {
        appliedRoles[speciesName] = role.trim();
      }
    });
  }

  let bringList = prunedBringList;
  if (Array.isArray(bringListNames) && bringListNames.length > 0) {
    bringList = bringListNames
      .filter((speciesName) => names.has(speciesName))
      .slice(0, 4);
  }

  return {
    ...teamRecord,
    pokemon: nextPokemon,
    sets: { ...keptSets, ...appliedSets },
    roles: appliedRoles,
    bringList,
  };
}

function clonePersistedState(state) {
  return JSON.parse(JSON.stringify(state));
}

function TeamProviderWithState({ children }) {
  const [state, setState] = React.useState(() => loadFromStorage());
  const [storageError, setStorageError] = React.useState(null);
  const undoSnapshotRef = React.useRef(null);

  const persist = React.useCallback((teams, activeTeamId) => {
    setState({ teams, activeTeamId });
    const result = saveToStorage(teams, activeTeamId);
    if (result.ok) {
      setStorageError(null);
    } else {
      setStorageError(result.message || "Team could not be saved.");
    }
  }, []);

  const captureUndoSnapshot = React.useCallback(() => {
    undoSnapshotRef.current = clonePersistedState({
      teams: state.teams,
      activeTeamId: state.activeTeamId,
    });
  }, [state.teams, state.activeTeamId]);

  const undoLastChange = React.useCallback(() => {
    const snapshot = undoSnapshotRef.current;
    if (!snapshot) {
      return false;
    }
    persist(snapshot.teams, snapshot.activeTeamId);
    undoSnapshotRef.current = null;
    return true;
  }, [persist]);

  const clearUndoSnapshot = React.useCallback(() => {
    undoSnapshotRef.current = null;
  }, []);

  const clearStorageError = React.useCallback(() => {
    setStorageError(null);
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
      const sourceTeam =
        state.teams.find((team) => team.id === state.activeTeamId) || state.teams[0];
      const newTeam = createEmptyTeamRecord({
        id: generateId(),
        name,
        regulationId: sourceTeam?.regulationId || DEFAULT_REGULATION_ID,
      });
      const teams = [...state.teams, newTeam];
      persist(teams, newTeam.id);
    },
    [state.teams, state.activeTeamId, persist],
  );

  const addTeamWithRoster = React.useCallback(
    (optionalName, pokemon, setsToApply, rolesToApply, bringListNames, regulationId) => {
      const newTeamId = generateId();

      setState((previousState) => {
        undoSnapshotRef.current = clonePersistedState({
          teams: previousState.teams,
          activeTeamId: previousState.activeTeamId,
        });

        const name =
          typeof optionalName === "string" && optionalName.trim()
            ? optionalName.trim()
            : `Team ${previousState.teams.length + 1}`;

        const sourceTeam =
          previousState.teams.find((team) => team.id === previousState.activeTeamId) ||
          previousState.teams[0];

        const emptyTeam = createEmptyTeamRecord({
          id: newTeamId,
          name,
          regulationId:
            regulationId != null
              ? normalizeRegulationId(regulationId)
              : sourceTeam?.regulationId || DEFAULT_REGULATION_ID,
        });
        const populatedTeam = applyRosterToTeamRecord(
          emptyTeam,
          pokemon,
          setsToApply,
          rolesToApply,
          bringListNames,
        );

        const teams = [...previousState.teams, populatedTeam];
        saveToStorage(teams, newTeamId);
        return { teams, activeTeamId: newTeamId };
      });

      return newTeamId;
    },
    [],
  );

  const removeTeam = React.useCallback(
    (id) => {
      const teams = state.teams.filter((team) => team.id !== id);
      if (teams.length === 0) return;
      captureUndoSnapshot();
      const nextActive = state.activeTeamId === id ? teams[0].id : state.activeTeamId;
      persist(teams, nextActive);
    },
    [state.teams, state.activeTeamId, persist, captureUndoSnapshot],
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
      const nextPokemon = normalizeTeamPokemonList(pokemon);
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

  const addPokemonToTeamWithSet = React.useCallback((pokemon, patch) => {
    if (!pokemon?.name) {
      return false;
    }

    let added = false;

    setState((previousState) => {
      const activeTeamId = previousState.activeTeamId;
      const currentTeam =
        previousState.teams.find((team) => team.id === activeTeamId) ||
        previousState.teams[0];

      if (!currentTeam) {
        return previousState;
      }

      if (currentTeam.pokemon.length >= 6) {
        return previousState;
      }

      if (currentTeam.pokemon.some((entry) => entry?.name === pokemon.name)) {
        return previousState;
      }

      const nextPokemon = normalizeTeamPokemonList([...currentTeam.pokemon, pokemon]);
      const names = new Set(
        nextPokemon.map((entry) => entry?.name).filter(Boolean),
      );
      const { keptSets, keptRoles, bringList } = pruneSetsAndRoles(
        currentTeam,
        names,
      );
      const sets = {
        ...keptSets,
        [pokemon.name]: mergeSetUpdate(
          normalizeSetEntry(keptSets[pokemon.name]),
          patch || {},
        ),
      };

      const teams = previousState.teams.map((team) =>
        team.id === currentTeam.id
          ? { ...team, pokemon: nextPokemon, sets, roles: keptRoles, bringList }
          : team,
      );

      const saveResult = saveToStorage(teams, activeTeamId);
      if (!saveResult.ok) {
        window.queueMicrotask(() => {
          setStorageError(saveResult.message || "Team could not be saved.");
        });
      } else {
        window.queueMicrotask(() => {
          setStorageError(null);
        });
      }

      added = true;
      return { teams, activeTeamId };
    });

    return added;
  }, []);

  const removeFromTeam = React.useCallback(
    (pokemonName) => {
      if (!activeTeam) return;
      captureUndoSnapshot();
      const updated = activeTeam.pokemon.filter((entry) => entry && entry.name !== pokemonName);
      replaceTeamPokemon(activeTeam.id, updated);
    },
    [activeTeam, replaceTeamPokemon, captureUndoSnapshot],
  );

  const clearTeam = React.useCallback(() => {
    if (!activeTeam) return;
    captureUndoSnapshot();
    const teams = state.teams.map((team) =>
      team.id === activeTeam.id
        ? { ...team, pokemon: [], sets: {}, roles: {}, bringList: [] }
        : team,
    );
    persist(teams, state.activeTeamId);
  }, [activeTeam, state.teams, state.activeTeamId, persist, captureUndoSnapshot]);

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
    (pokemon, setsToApply, rolesToApply) => {
      if (!activeTeam) return;
      captureUndoSnapshot();
      const teams = state.teams.map((team) =>
        team.id === activeTeam.id
          ? applyRosterToTeamRecord(team, pokemon, setsToApply, rolesToApply)
          : team,
      );
      persist(teams, state.activeTeamId);
    },
    [activeTeam, state.teams, state.activeTeamId, persist, captureUndoSnapshot],
  );

  const setTeamRegulationId = React.useCallback(
    (regulationId) => {
      if (!activeTeam) return;
      const normalizedId = normalizeRegulationId(regulationId);
      const teams = state.teams.map((team) =>
        team.id === activeTeam.id ? { ...team, regulationId: normalizedId } : team,
      );
      clearUndoSnapshot();
      persist(teams, state.activeTeamId);
    },
    [activeTeam, state.teams, state.activeTeamId, persist, clearUndoSnapshot],
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
    addTeamWithRoster,
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
    addPokemonToTeamWithSet,
    removeFromTeam,
    clearTeam,
    isInTeam,
    canAddToTeam,
    storageError,
    clearStorageError,
    setTeamRegulationId,
    undoLastChange,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export const TeamProvider = TeamProviderWithState;
export default TeamContext;
