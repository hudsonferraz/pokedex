const typeEffectiveness = {
  normal: { immune: ["ghost"], weak: ["fighting"], strong: [] },
  fire: { immune: [], weak: ["water", "ground", "rock"], strong: ["fire", "grass", "ice", "bug", "steel", "fairy"] },
  water: { immune: [], weak: ["electric", "grass"], strong: ["fire", "water", "ice", "steel"] },
  electric: { immune: [], weak: ["ground"], strong: ["electric", "flying", "steel"] },
  grass: { immune: [], weak: ["fire", "ice", "poison", "flying", "bug"], strong: ["water", "electric", "grass", "ground"] },
  ice: { immune: [], weak: ["fire", "fighting", "rock", "steel"], strong: ["ice"] },
  fighting: { immune: [], weak: ["flying", "psychic", "fairy"], strong: ["bug", "rock", "dark"] },
  poison: { immune: [], weak: ["ground", "psychic"], strong: ["grass", "fighting", "poison", "bug", "fairy"] },
  ground: { immune: ["electric"], weak: ["water", "grass", "ice"], strong: ["poison", "rock"] },
  flying: { immune: ["ground"], weak: ["electric", "ice", "rock"], strong: ["grass", "fighting", "bug"] },
  psychic: { immune: [], weak: ["bug", "ghost", "dark"], strong: ["fighting", "psychic"] },
  bug: { immune: [], weak: ["fire", "flying", "rock"], strong: ["grass", "fighting", "ground"] },
  rock: { immune: [], weak: ["water", "grass", "fighting", "ground", "steel"], strong: ["normal", "fire", "poison", "flying"] },
  ghost: { immune: ["normal", "fighting"], weak: ["ghost", "dark"], strong: ["poison", "bug"] },
  dragon: { immune: [], weak: ["ice", "dragon", "fairy"], strong: ["fire", "water", "electric", "grass"] },
  dark: { immune: ["psychic"], weak: ["fighting", "bug", "fairy"], strong: ["ghost", "dark"] },
  steel: { immune: ["poison"], weak: ["fire", "fighting", "ground"], strong: ["normal", "grass", "ice", "flying", "psychic", "bug", "rock", "dragon", "steel", "fairy"] },
  fairy: { immune: ["dragon"], weak: ["poison", "steel"], strong: ["fighting", "bug", "dark"] },
};

const calculateTypeEffectiveness = (attackingType, defendingTypes) => {
  let effectiveness = 1;
  
  defendingTypes.forEach(defendingType => {
    const typeData = typeEffectiveness[attackingType];
    if (!typeData) return;
    
    if (typeData.immune.includes(defendingType)) {
      effectiveness = 0;
    } else if (typeData.weak.includes(defendingType)) {
      effectiveness *= 0.5;
    } else if (typeData.strong.includes(defendingType)) {
      effectiveness *= 2;
    }
  });
  
  return effectiveness;
};

export const getTeamWeaknesses = (team) => {
  const allTypes = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];
  const weaknesses = {};
  
  allTypes.forEach(attackingType => {
    let totalEffectiveness = 0;
    
    team.forEach(pokemon => {
      if (!pokemon || !pokemon.types) return;
      const pokemonTypes = pokemon.types.map(t => t.type.name);
      const effectiveness = calculateTypeEffectiveness(attackingType, pokemonTypes);
      totalEffectiveness += effectiveness;
    });
    
    const averageEffectiveness = team.length > 0 ? totalEffectiveness / team.length : 0;
    
    if (averageEffectiveness >= 2) {
      weaknesses[attackingType] = "super-effective";
    } else if (averageEffectiveness >= 1.5) {
      weaknesses[attackingType] = "effective";
    } else if (averageEffectiveness <= 0.5) {
      weaknesses[attackingType] = "resistant";
    } else if (averageEffectiveness === 0) {
      weaknesses[attackingType] = "immune";
    }
  });
  
  return weaknesses;
};

export const getTeamTypeCoverage = (team) => {
  const allTypes = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];
  const coverage = {};
  
  allTypes.forEach(defendingType => {
    let bestEffectiveness = 0;
    
    team.forEach(pokemon => {
      if (!pokemon || !pokemon.types) return;
      pokemon.types.forEach(pokemonType => {
        const attackingType = pokemonType.type.name;
        const typeData = typeEffectiveness[attackingType];
        if (!typeData) return;
        
        let effectiveness = 1;
        if (typeData.immune.includes(defendingType)) {
          effectiveness = 0;
        } else if (typeData.weak.includes(defendingType)) {
          effectiveness = 0.5;
        } else if (typeData.strong.includes(defendingType)) {
          effectiveness = 2;
        }
        
        if (effectiveness > bestEffectiveness) {
          bestEffectiveness = effectiveness;
        }
      });
    });
    
    if (bestEffectiveness >= 2) {
      coverage[defendingType] = "super-effective";
    } else if (bestEffectiveness >= 1) {
      coverage[defendingType] = "effective";
    } else if (bestEffectiveness === 0) {
      coverage[defendingType] = "no-effect";
    } else {
      coverage[defendingType] = "not-very-effective";
    }
  });
  
  return coverage;
};

export const getTeamStats = (team) => {
  const stats = {
    hp: 0,
    attack: 0,
    defense: 0,
    "special-attack": 0,
    "special-defense": 0,
    speed: 0,
  };
  
  team.forEach(pokemon => {
    if (!pokemon || !pokemon.stats) return;
    pokemon.stats.forEach(stat => {
      const statName = stat.stat.name;
      if (stats.hasOwnProperty(statName)) {
        stats[statName] += stat.base_stat;
      }
    });
  });
  
  const averages = {};
  Object.keys(stats).forEach(stat => {
    averages[stat] = team.length > 0 ? Math.round(stats[stat] / team.length) : 0;
  });
  
  return averages;
};

export const getUniqueTypes = (team) => {
  const types = new Set();
  team.forEach(pokemon => {
    if (pokemon && pokemon.types) {
      pokemon.types.forEach(type => {
        types.add(type.type.name);
      });
    }
  });
  return Array.from(types);
};

