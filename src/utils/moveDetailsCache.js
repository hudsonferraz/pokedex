import { getMoveDetails } from "../api";
import { buildMoveInfoFromApi } from "./moveDetails";

const moveInfoCache = new Map();
const pendingRequests = new Map();

const DEFAULT_BATCH_SIZE = 8;

export function getCachedMoveInfo(moveName) {
  if (!moveName) {
    return null;
  }
  return moveInfoCache.get(moveName) || null;
}

export function getCachedMoveType(moveName) {
  return getCachedMoveInfo(moveName)?.type || "";
}

function buildLearnsetEntry(moveName, learnsetEntry) {
  if (learnsetEntry?.move?.name) {
    return learnsetEntry;
  }
  return { move: { name: moveName } };
}

export async function fetchMoveInfo(moveName, learnsetEntry = null) {
  if (!moveName) {
    return null;
  }

  const cached = moveInfoCache.get(moveName);
  if (cached) {
    return cached;
  }

  const pending = pendingRequests.get(moveName);
  if (pending) {
    return pending;
  }

  const request = (async () => {
    const url =
      learnsetEntry?.move?.url ||
      `https://pokeapi.co/api/v2/move/${moveName}`;
    const moveData = await getMoveDetails(url);
    const info = buildMoveInfoFromApi(
      moveData,
      buildLearnsetEntry(moveName, learnsetEntry),
    );
    moveInfoCache.set(moveName, info);
    pendingRequests.delete(moveName);
    return info;
  })();

  pendingRequests.set(moveName, request);

  try {
    return await request;
  } catch {
    pendingRequests.delete(moveName);
    return null;
  }
}

export async function fetchMoveInfoBatch(
  moveNames,
  learnsetByName = {},
  { signal, batchSize = DEFAULT_BATCH_SIZE, onEach } = {},
) {
  const uniqueNames = [...new Set(moveNames.filter(Boolean))];
  const namesToFetch = uniqueNames.filter((name) => !moveInfoCache.has(name));

  for (let index = 0; index < namesToFetch.length; index += batchSize) {
    if (signal?.aborted) {
      return;
    }

    const batch = namesToFetch.slice(index, index + batchSize);
    await Promise.all(
      batch.map(async (moveName) => {
        if (signal?.aborted) {
          return null;
        }
        const info = await fetchMoveInfo(moveName, learnsetByName[moveName]);
        if (info && onEach) {
          onEach(info);
        }
        return info;
      }),
    );
  }
}
