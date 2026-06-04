import { ALL_POKEMON_TYPES } from "../constants/typeColors";
import {
  calculateTypeEffectiveness,
  getTeamMoveCoverage,
  getTeamWeaknesses,
  getTeamTypeCoverage,
} from "./teamAnalysis";
import { normalizeSetEntry } from "./pokemonSets";

function getPokemonTypes(pokemon) {
  return (pokemon?.types || []).map((entry) => entry.type.name);
}

function getAttackingTypesFromTeam(team, setsByName) {
  const types = new Set();
  team.forEach((pokemon) => {
    if (!pokemon) return;
    getPokemonTypes(pokemon).forEach((type) => types.add(type));
    const set = normalizeSetEntry(setsByName?.[pokemon.name]);
    Object.values(set.moveTypes || {}).forEach((type) => {
      if (type) types.add(type.toLowerCase());
    });
  });
  return Array.from(types);
}

/**
 * How hard `attackingTeam` hits `defendingTeam` (by typings), per attacking type.
 */
export function getOffensivePressure(attackingTeam, defendingTeam, attackingSets = null) {
  const result = {};
  const attackTypes = attackingSets
    ? getAttackingTypesFromTeam(attackingTeam, attackingSets)
    : attackingTeam.flatMap((pokemon) => getPokemonTypes(pokemon));

  const uniqueAttackTypes = [...new Set(attackTypes)];

  ALL_POKEMON_TYPES.forEach((defendingType) => {
    let best = 0;
    uniqueAttackTypes.forEach((attackingType) => {
      defendingTeam.forEach((pokemon) => {
        if (!pokemon) return;
        const effectiveness = calculateTypeEffectiveness(
          attackingType,
          getPokemonTypes(pokemon),
        );
        if (effectiveness > best) best = effectiveness;
      });
    });
    if (best >= 2) result[defendingType] = "super-effective";
    else if (best >= 1) result[defendingType] = "effective";
    else if (best === 0) result[defendingType] = "no-effect";
    else result[defendingType] = "not-very-effective";
  });

  return result;
}

export function getPreviewMatchup(yourActive, opponentActive, yourSets = null) {
  const yourTeam = yourActive.filter(Boolean);
  const opponentTeam = opponentActive.filter(Boolean);

  if (yourTeam.length === 0 || opponentTeam.length === 0) {
    return {
      ready: false,
      yourOffense: {},
      opponentOffense: {},
      yourDefensiveWeaknesses: [],
      opponentDefensiveWeaknesses: [],
    };
  }

  const yourOffense = yourSets
    ? getTeamMoveCoverage(yourTeam, yourSets)
    : getTeamTypeCoverage(yourTeam);
  const opponentOffense = getTeamTypeCoverage(opponentTeam);

  const yourWeaknesses = getTeamWeaknesses(yourTeam);
  const opponentWeaknesses = getTeamWeaknesses(opponentTeam);

  const yourDefensiveWeaknesses = Object.entries(yourWeaknesses)
    .filter(([, value]) => value === "super-effective")
    .map(([type]) => type);

  const opponentDefensiveWeaknesses = Object.entries(opponentWeaknesses)
    .filter(([, value]) => value === "super-effective")
    .map(([type]) => type);

  const yourPressure = getOffensivePressure(yourTeam, opponentTeam, yourSets);
  const opponentPressure = getOffensivePressure(opponentTeam, yourTeam);

  const yourSuperEffective = Object.entries(yourPressure)
    .filter(([, value]) => value === "super-effective")
    .map(([type]) => type);
  const opponentSuperEffective = Object.entries(opponentPressure)
    .filter(([, value]) => value === "super-effective")
    .map(([type]) => type);

  return {
    ready: true,
    yourOffense,
    opponentOffense,
    yourPressure,
    opponentPressure,
    yourDefensiveWeaknesses,
    opponentDefensiveWeaknesses,
    yourSuperEffective,
    opponentSuperEffective,
    yourCoverageSource: yourSets ? "moves" : "types",
  };
}

export function fillBattleBox(team, selectedNames, slotCount = 4) {
  const slots = Array(slotCount).fill(null);
  const nameSet = new Set(selectedNames || []);
  const selected = team.filter((pokemon) => pokemon && nameSet.has(pokemon.name));
  selected.slice(0, slotCount).forEach((pokemon, index) => {
    slots[index] = pokemon;
  });
  return slots;
}

export function battleBoxToNames(box) {
  return box.filter(Boolean).map((pokemon) => pokemon.name);
}
