import {
  compactPokemonFromApi,
  expandCompactPokemon,
  compactTeamRecord,
  expandTeamRecord,
} from "./teamPokemonModel";

describe("teamPokemonModel", () => {
  const fullPikachu = {
    id: 25,
    name: "pikachu",
    types: [{ slot: 1, type: { name: "electric" } }],
    stats: [{ stat: { name: "speed" }, base_stat: 90 }],
    abilities: [{ ability: { name: "static" }, is_hidden: false, slot: 1 }],
    sprites: {
      front_default: "https://example.com/pikachu.png",
      other: { "official-artwork": { front_default: "https://example.com/pikachu-art.png" } },
    },
    moves: Array.from({ length: 120 }, (_, index) => ({
      move: { name: `move-${index}`, url: `https://pokeapi.co/api/v2/move/${index}/` },
    })),
  };

  test("compactPokemonFromApi strips learnset payload", () => {
    const compact = compactPokemonFromApi(fullPikachu);

    expect(compact.name).toBe("pikachu");
    expect(compact.spriteUrl).toBe("https://example.com/pikachu-art.png");
    expect(compact.types).toEqual(["electric"]);
    expect(compact.abilities).toEqual(["static"]);
    expect(compact.moves).toBeUndefined();
    expect(JSON.stringify(compact).length).toBeLessThan(500);
  });

  test("expandCompactPokemon restores API-compatible team fields without moves", () => {
    const compact = compactPokemonFromApi(fullPikachu);
    const expanded = expandCompactPokemon(compact);

    expect(expanded.types[0].type.name).toBe("electric");
    expect(expanded.stats[0].base_stat).toBe(90);
    expect(expanded.sprites.other["official-artwork"].front_default).toBe(
      "https://example.com/pikachu-art.png",
    );
    expect(expanded.moves).toEqual([]);
  });

  test("compactTeamRecord shrinks stored team pokemon arrays", () => {
    const team = {
      id: "t1",
      name: "Team 1",
      pokemon: [fullPikachu],
      sets: { pikachu: { moves: ["thunderbolt"] } },
      roles: {},
      bringList: [],
    };

    const stored = compactTeamRecord(team);
    expect(stored.pokemon[0].spriteUrl).toBeTruthy();
    expect(stored.pokemon[0].moves).toBeUndefined();

    const restored = expandTeamRecord(stored);
    expect(restored.pokemon[0].name).toBe("pikachu");
    expect(restored.sets.pikachu.moves).toEqual(["thunderbolt"]);
  });
});
