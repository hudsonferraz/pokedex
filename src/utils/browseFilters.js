import { getRegulationById, isRegulationLegalityVerified, getSpeciesRegulationStatus, normalizeSpeciesId } from "./regulation";
import {
  getTopUsageFromMeta,
  getUsagePercentFromMeta,
  getWinRateFromSpeciesMeta,
} from "./usageStats";
import { speciesMatchesSelectedTypes } from "./pokemonTypeCache";

export const GENERATION_RANGES = {
  1: { min: 1, max: 151 },
  2: { min: 152, max: 251 },
  3: { min: 252, max: 386 },
  4: { min: 387, max: 493 },
  5: { min: 494, max: 649 },
  6: { min: 650, max: 721 },
  7: { min: 722, max: 809 },
  8: { min: 810, max: 905 },
  9: { min: 906, max: 1025 },
};

export const SORT_OPTIONS = [
  { id: "dex", label: "Dex #" },
  { id: "name", label: "Name A–Z" },
  { id: "usage", label: "Usage ↓" },
  { id: "winRate", label: "Win rate ↓" },
];

export function filterByGeneration(speciesList, generation) {
  if (!generation) {
    return speciesList;
  }

  const range = GENERATION_RANGES[generation];
  if (!range) {
    return speciesList;
  }

  return speciesList.filter(
    (entry) => entry.id >= range.min && entry.id <= range.max,
  );
}

export function filterBySelectedTypes(speciesList, selectedTypes) {
  if (!selectedTypes.length) {
    return speciesList;
  }

  return speciesList.filter((entry) =>
    speciesMatchesSelectedTypes(entry.name, selectedTypes),
  );
}

export function filterByVgcOptions(speciesList, vgcFilters, meta, regulationId) {
  let result = speciesList;

  if (vgcFilters.top30Meta && meta?.usage) {
    const topThirty = new Set(
      getTopUsageFromMeta(meta, 30).map((entry) => entry.speciesId),
    );
    result = result.filter((entry) =>
      topThirty.has(normalizeSpeciesId(entry.name)),
    );
  }

  if (vgcFilters.hasUsageData && meta?.usage) {
    result = result.filter(
      (entry) => getUsagePercentFromMeta(meta, entry.name) != null,
    );
  }

  if (vgcFilters.legalInRegulation) {
    const regulation = getRegulationById(regulationId);
    if (!isRegulationLegalityVerified(regulation)) {
      return result;
    }

    result = result.filter((entry) => {
      const { status } = getSpeciesRegulationStatus(entry.name, regulationId);
      return status !== "banned";
    });
  }

  return result;
}

export function sortSpeciesList(speciesList, sortBy, meta, speciesMeta) {
  const list = [...speciesList];

  switch (sortBy) {
    case "name":
      return list.sort((first, second) =>
        first.name.localeCompare(second.name),
      );
    case "usage":
      return list.sort((first, second) => {
        const firstUsage = getUsagePercentFromMeta(meta, first.name) ?? -1;
        const secondUsage = getUsagePercentFromMeta(meta, second.name) ?? -1;
        if (secondUsage !== firstUsage) {
          return secondUsage - firstUsage;
        }
        return first.id - second.id;
      });
    case "winRate":
      return list.sort((first, second) => {
        const firstWinRate =
          getWinRateFromSpeciesMeta(speciesMeta, first.name) ?? -1;
        const secondWinRate =
          getWinRateFromSpeciesMeta(speciesMeta, second.name) ?? -1;
        if (secondWinRate !== firstWinRate) {
          return secondWinRate - firstWinRate;
        }
        return first.id - second.id;
      });
    default:
      return list.sort((first, second) => first.id - second.id);
  }
}

export function getSortLabel(sortBy) {
  return SORT_OPTIONS.find((option) => option.id === sortBy)?.label || "Dex #";
}

export function regulationHasBanList(regulationId) {
  const regulation = getRegulationById(regulationId);
  return (regulation.banned?.length ?? 0) > 0;
}

export function buildBrowseCatalog(
  speciesIndex,
  {
    selectedGeneration,
    selectedTypes,
    vgcFilters,
    sortBy,
    meta,
    speciesMeta,
    regulationId,
  },
) {
  if (!speciesIndex?.length) {
    return [];
  }

  let list = filterByGeneration(speciesIndex, selectedGeneration);
  list = filterBySelectedTypes(list, selectedTypes);
  list = filterByVgcOptions(list, vgcFilters, meta, regulationId);
  return sortSpeciesList(list, sortBy, meta, speciesMeta);
}
