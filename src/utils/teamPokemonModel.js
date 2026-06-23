import { seedLearnsetFromPokemon } from "./learnsetCache";

export function compactPokemonFromApi(pokemon) {
  if (!pokemon?.name) {
    return null;
  }

  if (
    pokemon.spriteUrl &&
    Array.isArray(pokemon.types) &&
    typeof pokemon.types[0] === "string"
  ) {
    return {
      id: pokemon.id,
      name: pokemon.name,
      spriteUrl: pokemon.spriteUrl,
      types: pokemon.types,
      stats: pokemon.stats || [],
      abilities: pokemon.abilities || [],
    };
  }

  const spriteUrl =
    pokemon.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon.sprites?.front_default ||
    "";

  const types = (pokemon.types || [])
    .map((entry) => entry?.type?.name)
    .filter(Boolean);

  const stats = (pokemon.stats || [])
    .map((entry) => ({
      stat: { name: entry?.stat?.name || entry?.stat },
      base_stat: entry?.base_stat ?? 0,
    }))
    .filter((entry) => entry.stat.name);

  const abilities = (pokemon.abilities || [])
    .map((entry) => entry?.ability?.name || entry?.ability)
    .filter(Boolean);

  return {
    id: pokemon.id,
    name: pokemon.name,
    spriteUrl,
    types,
    stats,
    abilities,
  };
}

export function expandCompactPokemon(compact) {
  if (!compact?.name) {
    return null;
  }

  if (Array.isArray(compact.moves) && compact.moves[0]?.move?.url) {
    return compact;
  }

  const spriteUrl = compact.spriteUrl || "";
  const typeNames = (compact.types || []).map((entry) =>
    typeof entry === "string" ? entry : entry?.type?.name,
  ).filter(Boolean);

  const stats = (compact.stats || []).map((entry) => ({
    stat: { name: entry?.stat?.name || entry?.stat },
    base_stat: entry?.base_stat ?? 0,
  }));

  const abilityNames = (compact.abilities || []).map((entry) =>
    typeof entry === "string" ? entry : entry?.ability?.name || entry?.ability,
  ).filter(Boolean);

  return {
    id: compact.id,
    name: compact.name,
    types: typeNames.map((typeName, index) => ({
      slot: index + 1,
      type: { name: typeName },
    })),
    stats,
    abilities: abilityNames.map((abilityName, index) => ({
      ability: { name: abilityName },
      is_hidden: index > 0,
      slot: index + 1,
    })),
    sprites: {
      front_default: spriteUrl,
      other: {
        "official-artwork": { front_default: spriteUrl },
      },
    },
    moves: [],
  };
}

export function compactTeamRecord(teamRecord) {
  return {
    ...teamRecord,
    pokemon: (teamRecord.pokemon || [])
      .map((entry) => compactPokemonFromApi(entry))
      .filter(Boolean),
  };
}

export function expandTeamRecord(teamRecord) {
  return {
    ...teamRecord,
    pokemon: (teamRecord.pokemon || [])
      .map((entry) => expandCompactPokemon(entry))
      .filter(Boolean),
  };
}

export function pokemonNeedsLearnset(pokemon) {
  return !(
    Array.isArray(pokemon?.moves) &&
    pokemon.moves.length > 0 &&
    pokemon.moves[0]?.move?.url
  );
}

export function normalizeTeamPokemonList(pokemonList) {
  return (pokemonList || [])
    .map((entry) => expandCompactPokemon(compactPokemonFromApi(entry)))
    .filter(Boolean);
}

export async function ensurePokemonHasLearnset(pokemon) {
  if (!pokemon?.name) {
    return pokemon;
  }

  if (!pokemonNeedsLearnset(pokemon)) {
    seedLearnsetFromPokemon(pokemon);
    return pokemon;
  }

  const { searchPokemon } = await import("../api");
  const fullPokemon = await searchPokemon(pokemon.name);
  if (!fullPokemon) {
    return expandCompactPokemon(pokemon);
  }

  const expanded = expandCompactPokemon(compactPokemonFromApi(fullPokemon));
  const hydratedPokemon = {
    ...expanded,
    moves: fullPokemon.moves || [],
    abilities: fullPokemon.abilities?.length
      ? fullPokemon.abilities
      : expanded.abilities,
  };
  seedLearnsetFromPokemon(hydratedPokemon);
  return hydratedPokemon;
}
