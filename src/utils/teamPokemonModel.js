import { seedLearnsetFromPokemon } from "./learnsetCache";

function compactAbilityEntry(entry) {
  if (!entry) {
    return null;
  }

  if (typeof entry === "string") {
    const name = entry.trim();
    return name ? { name, is_hidden: false } : null;
  }

  if (typeof entry === "object") {
    const name = (entry.name || entry.ability?.name || entry.ability || "").trim();
    if (!name) {
      return null;
    }

    return {
      name,
      is_hidden: Boolean(entry.is_hidden),
    };
  }

  return null;
}

function expandAbilityEntry(entry, index) {
  const compact = compactAbilityEntry(entry);
  if (!compact) {
    return null;
  }

  return {
    ability: { name: compact.name },
    is_hidden: compact.is_hidden,
    slot: index + 1,
  };
}

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
      abilities: (pokemon.abilities || []).map(compactAbilityEntry).filter(Boolean),
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

  const abilities = (pokemon.abilities || []).map(compactAbilityEntry).filter(Boolean);

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

  const abilities = (compact.abilities || [])
    .map((entry, index) => expandAbilityEntry(entry, index))
    .filter(Boolean);

  return {
    id: compact.id,
    name: compact.name,
    types: typeNames.map((typeName, index) => ({
      slot: index + 1,
      type: { name: typeName },
    })),
    stats,
    abilities,
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
