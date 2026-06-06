import regulationsData from "../data/regulations.json";

export const REGULATIONS = Object.values(regulationsData);

export const DEFAULT_REGULATION_ID = "champions-reg-ma";

const REGULATION_MAP = regulationsData;

export function getRegulationById(regulationId) {
  return REGULATION_MAP[regulationId] || REGULATION_MAP[DEFAULT_REGULATION_ID];
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

function speciesMatchesList(speciesId, list) {
  const normalizedList = new Set((list || []).map(normalizeSpeciesId));
  if (normalizedList.has(speciesId)) return true;
  const baseForm = speciesId.split("-")[0];
  return normalizedList.has(baseForm);
}

export function getSpeciesRegulationStatus(speciesName, regulationId) {
  const regulation = getRegulationById(regulationId);
  const speciesId = normalizeSpeciesId(speciesName);

  if (speciesMatchesList(speciesId, regulation.banned)) {
    return { status: "banned", regulation, speciesId };
  }

  if (speciesMatchesList(speciesId, regulation.restricted)) {
    return { status: "restricted", regulation, speciesId };
  }

  return { status: "legal", regulation, speciesId };
}

export function validateTeamForRegulation(team, regulationId) {
  const regulation = getRegulationById(regulationId);
  const issues = [];
  const warnings = [];

  if (!team || team.length === 0) {
    return { regulation, issues, warnings, restrictedCount: 0 };
  }

  let restrictedCount = 0;
  const seenSpecies = new Set();

  team.forEach((pokemon) => {
    if (!pokemon?.name) return;
    const speciesId = normalizeSpeciesId(pokemon.name);

    if (seenSpecies.has(speciesId)) {
      issues.push({
        type: "duplicate",
        speciesId,
        message: `Duplicate species: ${pokemon.name}`,
      });
    }
    seenSpecies.add(speciesId);

    if (speciesMatchesList(speciesId, regulation.banned)) {
      issues.push({
        type: "banned",
        speciesId,
        message: `${formatSpeciesLabel(speciesId)} is banned in ${regulation.label}`,
      });
    }

    if (speciesMatchesList(speciesId, regulation.restricted)) {
      restrictedCount += 1;
    }
  });

  const maxRestricted = regulation.maxRestricted ?? 2;
  if (restrictedCount > maxRestricted) {
    issues.push({
      type: "restricted-limit",
      message: `${restrictedCount} Restricted Pokémon — ${regulation.label} allows up to ${maxRestricted}`,
      restrictedCount,
      maxRestricted,
    });
  } else if (restrictedCount > 0) {
    warnings.push({
      type: "restricted-count",
      message: `${restrictedCount}/${maxRestricted} Restricted slots used`,
      restrictedCount,
      maxRestricted,
    });
  }

  return { regulation, issues, warnings, restrictedCount };
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
