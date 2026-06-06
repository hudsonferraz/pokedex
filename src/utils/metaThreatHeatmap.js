import { calculateTypeEffectiveness } from "./teamAnalysis";
import { formatSpeciesLabel } from "./regulation";

export const THREAT_ROW_COUNT = 15;
export const SHARE_URL_SAFE_LENGTH = 1800;

export function getPokemonTypeNames(pokemon) {
  return (pokemon?.types || []).map((entry) => entry.type?.name).filter(Boolean);
}

export function getBestThreatMultiplier(threatTypes, defenderTypes) {
  if (!threatTypes.length || !defenderTypes.length) {
    return { multiplier: 1, bestType: null };
  }

  let maxMultiplier = 0;
  let bestType = threatTypes[0];

  threatTypes.forEach((attackingType) => {
    const multiplier = calculateTypeEffectiveness(attackingType, defenderTypes);
    if (multiplier > maxMultiplier) {
      maxMultiplier = multiplier;
      bestType = attackingType;
    }
  });

  return { multiplier: maxMultiplier || 1, bestType };
}

export function formatMultiplierLabel(multiplier) {
  if (multiplier === 0) return "0×";
  if (multiplier === 0.25) return "¼×";
  if (multiplier === 0.5) return "½×";
  if (multiplier === 1) return "1×";
  if (multiplier === 2) return "2×";
  if (multiplier === 4) return "4×";
  return `${multiplier}×`;
}

export function getHeatmapCellClass(multiplier) {
  if (multiplier >= 4) return "threat-4x";
  if (multiplier >= 2) return "threat-2x";
  if (multiplier <= 0) return "threat-0x";
  if (multiplier <= 0.25) return "threat-quarter";
  if (multiplier <= 0.5) return "threat-resist";
  return "threat-neutral";
}

/**
 * Builds heatmap rows: meta threats (rows) vs team slots (columns).
 * @param {object[]} team
 * @param {string[]} topSpeciesIds
 * @param {Record<string, string[]>} typesBySpeciesId
 */
export function buildThreatHeatmapRows(team, topSpeciesIds, typesBySpeciesId) {
  const threats = (topSpeciesIds || []).slice(0, THREAT_ROW_COUNT);
  const defenders = (team || []).filter(Boolean);

  if (!threats.length || !defenders.length) {
    return [];
  }

  return threats.map((speciesId) => {
    const threatTypes = typesBySpeciesId[speciesId] || [];
    const threatLabel = formatSpeciesLabel(speciesId);

    const cells = defenders.map((defender) => {
      const defenderTypes = getPokemonTypeNames(defender);
      const { multiplier, bestType } = getBestThreatMultiplier(threatTypes, defenderTypes);
      const defenderLabel = formatSpeciesLabel(defender.name);

      let tooltip;
      if (!threatTypes.length) {
        tooltip = `${threatLabel} vs ${defenderLabel}: type data loading`;
      } else if (bestType && multiplier !== 1) {
        tooltip = `${threatLabel} threatens ${defenderLabel} with ${bestType} ${formatMultiplierLabel(multiplier)}`;
      } else {
        tooltip = `${threatLabel} vs ${defenderLabel}: neutral (${formatMultiplierLabel(multiplier)})`;
      }

      return {
        defenderName: defender.name,
        defenderLabel,
        multiplier,
        bestType,
        tooltip,
        cellClass: getHeatmapCellClass(multiplier),
        label: formatMultiplierLabel(multiplier),
      };
    });

    const rowSeverity = cells.length ? Math.max(...cells.map((cell) => cell.multiplier)) : 0;

    return {
      speciesId,
      threatLabel,
      cells,
      rowSeverity,
    };
  });
}
