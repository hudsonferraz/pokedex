import { TERA_TYPES, VGC_NATURES } from "../constants/vgcOptions";
import { normalizeSpeciesId, formatSpeciesLabel } from "./regulation";
import { normalizeSetEntry } from "./pokemonSets";

const VALID_TERA_TYPES = new Set(
  TERA_TYPES.filter(Boolean).map((entry) => entry.toLowerCase()),
);
const VALID_NATURES = new Set(
  VGC_NATURES.filter(Boolean).map((entry) => entry.toLowerCase()),
);

const EV_STAT_ALIASES = {
  hp: "hp",
  atk: "attack",
  attack: "attack",
  def: "defense",
  defense: "defense",
  spa: "special-attack",
  "sp atk": "special-attack",
  "special-attack": "special-attack",
  "special attack": "special-attack",
  spd: "special-defense",
  "sp def": "special-defense",
  "special-defense": "special-defense",
  "special defense": "special-defense",
  spe: "speed",
  speed: "speed",
};

function normalizeItemKey(item) {
  return (item || "").trim().toLowerCase();
}

function normalizeAbilityKey(ability) {
  return (ability || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function resolveEvStatKey(label) {
  return EV_STAT_ALIASES[label.trim().toLowerCase()] || null;
}

export function parseShowdownEvs(evsString) {
  const trimmed = (evsString || "").trim();
  if (!trimmed) {
    return { valid: true, total: 0, stats: {} };
  }

  const stats = {};
  let total = 0;
  const segments = trimmed.split("/");

  for (const segment of segments) {
    const part = segment.trim();
    if (!part) {
      continue;
    }

    const match = part.match(/^(\d+)\s+(.+)$/);
    if (!match) {
      return { valid: false, total, stats, error: `Invalid EV segment: "${part}"` };
    }

    const value = Number.parseInt(match[1], 10);
    const statKey = resolveEvStatKey(match[2]);
    if (!statKey) {
      return { valid: false, total, stats, error: `Unknown EV stat: "${match[2]}"` };
    }
    if (value < 0 || value > 252) {
      return { valid: false, total, stats, error: "Each EV must be between 0 and 252" };
    }

    stats[statKey] = (stats[statKey] || 0) + value;
    total += value;
  }

  if (total > 510) {
    return { valid: false, total, stats, error: `EV total is ${total} (max 510)` };
  }

  return { valid: true, total, stats };
}

function getPokemonAbilityIds(pokemon) {
  return (pokemon?.abilities || [])
    .map((entry) => normalizeAbilityKey(entry?.ability?.name || entry?.ability || ""))
    .filter(Boolean);
}

function getPokemonLearnset(pokemon, learnsetBySpecies = {}) {
  const fromPokemon = new Set(
    (pokemon?.moves || [])
      .map((entry) => normalizeSpeciesId(entry?.move?.name || ""))
      .filter(Boolean),
  );

  if (fromPokemon.size > 0) {
    return fromPokemon;
  }

  const speciesKey = normalizeSpeciesId(pokemon?.name);
  const fromCache = learnsetBySpecies[speciesKey];
  if (!fromCache) {
    return new Set();
  }

  return fromCache instanceof Set ? fromCache : new Set(fromCache);
}

function validatePokemonSet(pokemon, set, options = {}) {
  const issues = [];
  const warnings = [];
  const speciesLabel = formatSpeciesLabel(pokemon.name);
  const normalizedSet = normalizeSetEntry(set);
  const learnset = getPokemonLearnset(pokemon, options.learnsetBySpecies);
  const abilityIds = getPokemonAbilityIds(pokemon);

  if (normalizedSet.moves.length === 0) {
    warnings.push({
      type: "incomplete-set",
      speciesId: normalizeSpeciesId(pokemon.name),
      message: `${speciesLabel}: no moves configured`,
    });
  } else if (normalizedSet.moves.length < 4) {
    warnings.push({
      type: "incomplete-set",
      speciesId: normalizeSpeciesId(pokemon.name),
      message: `${speciesLabel}: only ${normalizedSet.moves.length}/4 moves configured`,
    });
  }

  const seenMoves = new Set();
  const hasConfiguredMoves = normalizedSet.moves.length > 0;
  const learnsetUnavailable =
    hasConfiguredMoves && learnset.size === 0 && !options.learnsetValidationPending;

  if (learnsetUnavailable) {
    warnings.push({
      type: "learnset-unavailable",
      speciesId: normalizeSpeciesId(pokemon.name),
      message: `${speciesLabel}: learnset not loaded — move legality cannot be verified yet`,
    });
  }

  normalizedSet.moves.forEach((moveName) => {
    const moveId = normalizeSpeciesId(moveName);
    if (seenMoves.has(moveId)) {
      issues.push({
        type: "duplicate-move",
        speciesId: normalizeSpeciesId(pokemon.name),
        message: `${speciesLabel}: duplicate move "${moveName.replace(/-/g, " ")}"`,
      });
    }
    seenMoves.add(moveId);

    if (learnset.size > 0 && !learnset.has(moveId)) {
      warnings.push({
        type: "move-not-in-learnset",
        speciesId: normalizeSpeciesId(pokemon.name),
        message: `${speciesLabel}: "${moveName.replace(/-/g, " ")}" is not in this Pokémon's bundled learnset`,
      });
    }
  });

  if (normalizedSet.ability) {
    const abilityId = normalizeAbilityKey(normalizedSet.ability);
    if (abilityIds.length > 0 && !abilityIds.includes(abilityId)) {
      issues.push({
        type: "invalid-ability",
        speciesId: normalizeSpeciesId(pokemon.name),
        message: `${speciesLabel}: "${normalizedSet.ability}" is not a listed ability for this species`,
      });
    }
  }

  if (normalizedSet.nature) {
    if (!VALID_NATURES.has(normalizedSet.nature.toLowerCase())) {
      issues.push({
        type: "invalid-nature",
        speciesId: normalizeSpeciesId(pokemon.name),
        message: `${speciesLabel}: invalid nature "${normalizedSet.nature}"`,
      });
    }
  }

  if (normalizedSet.teraType) {
    const teraKey = normalizedSet.teraType.toLowerCase();
    if (!VALID_TERA_TYPES.has(teraKey)) {
      issues.push({
        type: "invalid-tera",
        speciesId: normalizeSpeciesId(pokemon.name),
        message: `${speciesLabel}: invalid Tera Type "${normalizedSet.teraType}"`,
      });
    } else if (teraKey === "stellar" && !normalizeSpeciesId(pokemon.name).startsWith("terapagos")) {
      warnings.push({
        type: "stellar-tera",
        speciesId: normalizeSpeciesId(pokemon.name),
        message: `${speciesLabel}: Stellar Tera is normally only available to Terapagos`,
      });
    }
  }

  const evResult = parseShowdownEvs(normalizedSet.evs);
  if (!evResult.valid) {
    issues.push({
      type: "invalid-evs",
      speciesId: normalizeSpeciesId(pokemon.name),
      message: `${speciesLabel}: ${evResult.error}`,
    });
  }

  return { issues, warnings };
}

export function validateTeamSets(team, setsByName, options = {}) {
  const issues = [];
  const warnings = [];

  if (!team?.length) {
    return { issues, warnings };
  }

  if (team.length < 6) {
    warnings.push({
      type: "team-size",
      message: `Team has ${team.length}/6 Pokémon`,
    });
  }

  const seenItems = new Map();

  team.forEach((pokemon) => {
    if (!pokemon?.name) {
      return;
    }

    const set = normalizeSetEntry(setsByName?.[pokemon.name]);
    const { issues: setIssues, warnings: setWarnings } = validatePokemonSet(
      pokemon,
      set,
      options,
    );
    issues.push(...setIssues);
    warnings.push(...setWarnings);

    const itemKey = normalizeItemKey(set.item);
    if (itemKey) {
      if (seenItems.has(itemKey)) {
        issues.push({
          type: "duplicate-item",
          message: `Item Clause: "${set.item}" is used on both ${formatSpeciesLabel(seenItems.get(itemKey))} and ${formatSpeciesLabel(pokemon.name)}`,
        });
      } else {
        seenItems.set(itemKey, pokemon.name);
      }
    }
  });

  return { issues, warnings };
}
