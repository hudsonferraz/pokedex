export const searchPokemon = async (pokemon) => {
  try {
    let url = `https://pokeapi.co/api/v2/pokemon/${pokemon}`;
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.log(error);
  }
};

export const getPokemons = async (limit = 50, offset = 0) => {
  try {
    let url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.log(error);
  }
};

export const getPokemonData = async (url) => {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.log(error);
  }
};

export const getPokemonSpecies = async (pokemonId) => {
  try {
    let url = `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`;
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.log(error);
  }
};

export const getEvolutionChain = async (url) => {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.log(error);
  }
};

export const getAbilityDetails = async (url) => {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.log(error);
  }
};

export const getMoveDetails = async (url) => {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.log(error);
  }
};

export const getPokemonForms = async (speciesData) => {
  try {
    if (speciesData && speciesData.varieties && speciesData.varieties.length > 1) {
      const forms = await Promise.all(
        speciesData.varieties.map(async (variety) => {
          try {
            const pokemonResponse = await fetch(variety.pokemon.url);
            const pokemonData = await pokemonResponse.json();
            return {
              name: pokemonData.name,
              id: pokemonData.id,
              is_default: variety.is_default,
              sprite: pokemonData.sprites?.other?.["official-artwork"]?.front_default || pokemonData.sprites?.front_default
            };
          } catch (error) {
            return null;
          }
        })
      );
      return forms.filter(form => form !== null);
    }
    return [];
  } catch (error) {
    console.log(error);
    return [];
  }
};
