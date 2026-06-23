import regulationsData from "../data/regulations.json";
import regulationHBanned from "../data/regulation-h-banned.json";
import { validateTeamSets } from "./regulationValidation";

export const DEFAULT_REGULATION_ID = "champions-reg-ma";

const REGULATION_MAP = {
  ...regulationsData,
  "regulation-h": {
    ...regulationsData["regulation-h"],
    banned: regulationHBanned,
    restricted: [],
    maxRestricted: 0,
  },
};

export const SPECIES_CLAUSE_ALIASES = {
  "urshifu-single-strike": "urshifu",
  "urshifu-rapid-strike": "urshifu",
  "calyrex-ice-rider": "calyrex",
  "calyrex-shadow-rider": "calyrex",
  "dialga-origin": "dialga",
  "palkia-origin": "palkia",
  "giratina-origin": "giratina",
  "kyurem-black": "kyurem",
  "kyurem-white": "kyurem",
  "necrozma-dusk-mane": "necrozma",
  "necrozma-dawn-wings": "necrozma",
  "zacian-crowned": "zacian",
  "zamazenta-crowned": "zamazenta",
  "landorus-incarnate": "landorus",
  "landorus-therian": "landorus",
  "tornadus-incarnate": "tornadus",
  "tornadus-therian": "tornadus",
  "thundurus-incarnate": "thundurus",
  "thundurus-therian": "thundurus",
  "enamorus-incarnate": "enamorus",
  "enamorus-therian": "enamorus",
  "keldeo-resolute": "keldeo",
  "morpeko-hangry": "morpeko",
  "rotom-heat": "rotom",
  "rotom-wash": "rotom",
  "rotom-frost": "rotom",
  "rotom-fan": "rotom",
  "rotom-mow": "rotom",
  "deoxys-attack": "deoxys",
  "deoxys-defense": "deoxys",
  "deoxys-speed": "deoxys",
  "shaymin-sky": "shaymin",
  "hoopa-unbound": "hoopa",
  "magearna-original": "magearna",
  "zygarde-complete": "zygarde",
  "ogerpon-wellspring": "ogerpon",
  "ogerpon-hearthflame": "ogerpon",
  "ogerpon-cornerstone": "ogerpon",
  "ogerpon-teal": "ogerpon",
};

export function getRegulationById(regulationId) {
  return REGULATION_MAP[regulationId] || REGULATION_MAP[DEFAULT_REGULATION_ID];
}

export const REGULATIONS = Object.keys(regulationsData).map((id) => getRegulationById(id));

export function normalizeRegulationId(regulationId) {
  if (regulationId && REGULATION_MAP[regulationId]) {
    return regulationId;
  }
  return DEFAULT_REGULATION_ID;
}

export function isBanOnlyRegulation(regulation) {
  const legality = getEffectiveLegality(regulation);
  return (legality.maxRestricted ?? 2) === 0;
}

export function getEffectiveLegality(regulation) {
  const source = regulation.legalityInheritsFrom
    ? getRegulationById(regulation.legalityInheritsFrom)
    : regulation;

  return {
    banned: source.banned || [],
    restricted: source.restricted || [],
    maxRestricted: regulation.maxRestricted ?? source.maxRestricted ?? 2,
  };
}

export function isRegulationLegalityVerified(regulation) {
  if (regulation.isPlaceholder || regulation.legalityUnverified) {
    return false;
  }

  const legality = getEffectiveLegality(regulation);
  return legality.banned.length > 0 || legality.restricted.length > 0;
}

export const OFFICIAL_VGC_HANDBOOK_URL =
  "https://play.pokemon.com/en-us/resources/rules/?category=vgc";

export function getRegulationLegalityTransparency(regulation) {
  if (isRegulationLegalityVerified(regulation)) {
    return null;
  }

  const inheritedFrom = regulation.legalityInheritsFrom
    ? getRegulationById(regulation.legalityInheritsFrom)
    : null;

  if (regulation.isPlaceholder) {
    return {
      title: "Placeholder regulation",
      message: `${regulation.label} is a placeholder ruleset. Ban and Restricted lists mirror ${inheritedFrom?.label || "another regulation"} until Pokémon publishes official lists.`,
      detail: regulation.notes || null,
    };
  }

  if (regulation.legalityUnverified && inheritedFrom) {
    return {
      title: "Inherited legality — not independently verified",
      message: `${regulation.label} uses ban/restricted lists from ${inheritedFrom.label}. This app has not verified them against the latest official handbook for ${regulation.label}.`,
      detail: regulation.notes || null,
    };
  }

  return {
    title: "Legality lists incomplete",
    message: `${regulation.label} does not have bundled ban/restricted lists in this app. Species legality checks may be incomplete.`,
    detail: regulation.notes || null,
  };
}

export function normalizeSpeciesId(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .trim()
    .toLowerCase()
    .replace(/['.]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function getSpeciesClauseKey(speciesName) {
  const speciesId = normalizeSpeciesId(speciesName);
  return SPECIES_CLAUSE_ALIASES[speciesId] || speciesId;
}

function speciesMatchesList(speciesId, list) {
  const normalizedList = new Set((list || []).map(normalizeSpeciesId));
  if (normalizedList.has(speciesId)) return true;

  const clauseKey = SPECIES_CLAUSE_ALIASES[speciesId] || speciesId;
  if (normalizedList.has(clauseKey)) return true;

  const baseForm = speciesId.split("-")[0];
  return normalizedList.has(baseForm);
}

export function getSpeciesRegulationStatus(speciesName, regulationId) {
  const regulation = getRegulationById(regulationId);
  const speciesId = normalizeSpeciesId(speciesName);
  const legality = getEffectiveLegality(regulation);
  const hasLegalityData =
    legality.banned.length > 0 || legality.restricted.length > 0;

  if (!hasLegalityData) {
    return { status: "unknown", regulation, speciesId };
  }

  if (speciesMatchesList(speciesId, legality.banned)) {
    return { status: "banned", regulation, speciesId };
  }

  if (speciesMatchesList(speciesId, legality.restricted)) {
    return { status: "restricted", regulation, speciesId };
  }

  return { status: "legal", regulation, speciesId };
}

export function validateTeamForRegulation(team, regulationId, options = {}) {
  const regulation = getRegulationById(regulationId);
  const legality = getEffectiveLegality(regulation);
  const sets = options.sets || {};
  const issues = [];
  const warnings = [];

  if (!isRegulationLegalityVerified(regulation)) {
    warnings.push({
      type: "legality-unverified",
      message: `${regulation.label} legality lists are unverified or inherited — confirm against the official VGC handbook before events.`,
    });
  }

  if (!team || team.length === 0) {
    return {
      regulation,
      issues,
      warnings,
      restrictedCount: 0,
      legalityVerified: isRegulationLegalityVerified(regulation),
    };
  }

  let restrictedCount = 0;
  const seenSpeciesClauseKeys = new Set();

  team.forEach((pokemon) => {
    if (!pokemon?.name) return;
    const speciesId = normalizeSpeciesId(pokemon.name);
    const clauseKey = getSpeciesClauseKey(pokemon.name);

    if (seenSpeciesClauseKeys.has(clauseKey)) {
      issues.push({
        type: "duplicate-species",
        speciesId,
        message: `Species Clause: duplicate ${formatSpeciesLabel(clauseKey)} line (${pokemon.name})`,
      });
    }
    seenSpeciesClauseKeys.add(clauseKey);

    if (speciesMatchesList(speciesId, legality.banned)) {
      issues.push({
        type: "banned",
        speciesId,
        message: `${formatSpeciesLabel(speciesId)} is banned in ${regulation.label}`,
      });
    }

    if (speciesMatchesList(speciesId, legality.restricted)) {
      restrictedCount += 1;
    }
  });

  const maxRestricted = legality.maxRestricted ?? 2;
  if (!isBanOnlyRegulation(regulation) && restrictedCount > maxRestricted) {
    issues.push({
      type: "restricted-limit",
      message: `${restrictedCount} Restricted Pokémon — ${regulation.label} allows up to ${maxRestricted}`,
      restrictedCount,
      maxRestricted,
    });
  } else if (!isBanOnlyRegulation(regulation) && restrictedCount > 0) {
    warnings.push({
      type: "restricted-count",
      message: `${restrictedCount}/${maxRestricted} Restricted slots used`,
      restrictedCount,
      maxRestricted,
    });
  }

  const setValidation = validateTeamSets(team, sets, {
    regulationId,
    learnsetBySpecies: options.learnsetBySpecies,
    learnsetValidationPending: options.learnsetValidationPending,
  });
  issues.push(...setValidation.issues);
  warnings.push(...setValidation.warnings);

  return {
    regulation,
    issues,
    warnings,
    restrictedCount,
    legalityVerified: isRegulationLegalityVerified(regulation),
  };
}

export function formatSpeciesLabel(speciesId) {
  return (speciesId || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const REGULATION_STORAGE_KEY = "vgc-regulation-id";

export function getStoredRegulationId() {
  try {
    const stored = window.localStorage.getItem(REGULATION_STORAGE_KEY);
    if (stored && REGULATION_MAP[stored]) return stored;
  } catch {
    // ignore
  }
  return DEFAULT_REGULATION_ID;
}

export function setStoredRegulationId(regulationId) {
  try {
    window.localStorage.setItem(
      REGULATION_STORAGE_KEY,
      REGULATION_MAP[regulationId] ? regulationId : DEFAULT_REGULATION_ID,
    );
  } catch {
    // ignore
  }
}
