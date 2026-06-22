import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchMoveInfo,
  fetchMoveInfoBatch,
  getCachedMoveInfo,
} from "../utils/moveDetailsCache";

const SEARCH_FETCH_LIMIT = 60;
const INITIAL_VISIBLE_LIMIT = 32;

export function useLazyMoveDetails({
  pokemon,
  selectedMoves,
  metaMoveIds,
  searchQuery,
  filteredMoveNames,
}) {
  const [moveDetails, setMoveDetails] = useState({});

  const learnsetByName = useMemo(() => {
    const map = {};
    (pokemon?.moves || []).forEach((entry) => {
      const moveName = entry?.move?.name;
      if (moveName) {
        map[moveName] = entry;
      }
    });
    return map;
  }, [pokemon?.moves]);

  const mergeMoveInfo = useCallback((info) => {
    if (!info?.name) {
      return;
    }
    setMoveDetails((previous) => {
      if (previous[info.name]) {
        return previous;
      }
      return { ...previous, [info.name]: info };
    });
  }, []);

  const seedFromCache = useCallback((moveNames) => {
    const seeded = {};
    moveNames.forEach((moveName) => {
      const cached = getCachedMoveInfo(moveName);
      if (cached) {
        seeded[moveName] = cached;
      }
    });
    if (Object.keys(seeded).length > 0) {
      setMoveDetails((previous) => ({ ...seeded, ...previous }));
    }
  }, []);

  useEffect(() => {
    setMoveDetails({});
  }, [pokemon?.name]);

  useEffect(() => {
    const priorityNames = [
      ...(selectedMoves || []),
      ...(metaMoveIds || []),
    ].filter(Boolean);
    seedFromCache(priorityNames);
  }, [pokemon?.name, selectedMoves, metaMoveIds, seedFromCache]);

  useEffect(() => {
    const abortController = new AbortController();
    const priorityNames = [
      ...new Set([...(selectedMoves || []), ...(metaMoveIds || [])]),
    ].filter(Boolean);

    fetchMoveInfoBatch(priorityNames, learnsetByName, {
      signal: abortController.signal,
      onEach: mergeMoveInfo,
    });

    return () => abortController.abort();
  }, [pokemon?.name, selectedMoves, metaMoveIds, learnsetByName, mergeMoveInfo]);

  useEffect(() => {
    const abortController = new AbortController();
    const normalizedSearch = searchQuery.trim().toLowerCase();

    let namesToFetch = [];
    if (normalizedSearch) {
      namesToFetch = filteredMoveNames.slice(0, SEARCH_FETCH_LIMIT);
    } else {
      namesToFetch = filteredMoveNames.slice(0, INITIAL_VISIBLE_LIMIT);
    }

    seedFromCache(namesToFetch);
    fetchMoveInfoBatch(namesToFetch, learnsetByName, {
      signal: abortController.signal,
      onEach: mergeMoveInfo,
    });

    return () => abortController.abort();
  }, [
    searchQuery,
    filteredMoveNames,
    learnsetByName,
    mergeMoveInfo,
    seedFromCache,
  ]);

  const requestMoveDetails = useCallback(
    (moveName) => {
      if (!moveName) {
        return;
      }
      const cached = getCachedMoveInfo(moveName);
      if (cached) {
        mergeMoveInfo(cached);
        return;
      }
      fetchMoveInfo(moveName, learnsetByName[moveName]).then((info) => {
        if (info) {
          mergeMoveInfo(info);
        }
      });
    },
    [learnsetByName, mergeMoveInfo],
  );

  return {
    moveDetails,
    requestMoveDetails,
  };
}
