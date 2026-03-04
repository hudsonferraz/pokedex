function handleResponse(response) {
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    console.error(err);
    return undefined;
  }
  return response.json();
}

export const searchPokemon = async (pokemon) => {
  try {
    const url = `https://pokeapi.co/api/v2/pokemon/${pokemon}`;
    const response = await fetch(url);
    return await handleResponse(response);
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

export const getPokemons = async (limit = 50, offset = 0) => {
  try {
    const url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    return await handleResponse(response);
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

export const getPokemonData = async (url) => {
  try {
    const response = await fetch(url);
    return await handleResponse(response);
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

export const getPokemonSpecies = async (pokemonId) => {
  try {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`;
    const response = await fetch(url);
    return await handleResponse(response);
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

export const getEvolutionChain = async (url) => {
  try {
    const response = await fetch(url);
    return await handleResponse(response);
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

export const getAbilityDetails = async (url) => {
  try {
    const response = await fetch(url);
    return await handleResponse(response);
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

export const getMoveDetails = async (url) => {
  try {
    const response = await fetch(url);
    return await handleResponse(response);
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

export const getPokemonForms = async (speciesData) => {
  try {
    if (speciesData && speciesData.varieties && speciesData.varieties.length > 1) {
      const forms = await Promise.all(
        speciesData.varieties.map(async (variety) => {
          try {
            const pokemonResponse = await fetch(variety.pokemon.url);
            const pokemonData = await handleResponse(pokemonResponse);
            if (!pokemonData) return null;
            return {
              name: pokemonData.name,
              id: pokemonData.id,
              is_default: variety.is_default,
              sprite: pokemonData.sprites?.other?.["official-artwork"]?.front_default || pokemonData.sprites?.front_default
            };
          } catch (error) {
            console.error(error);
            return null;
          }
        })
      );
      return forms.filter(form => form !== null);
    }
    return [];
  } catch (error) {
    console.error(error);
    return [];
  }
};
