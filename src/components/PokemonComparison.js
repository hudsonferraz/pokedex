import React, { useState, useEffect } from "react";
import { searchPokemon } from "../api";
import { useToast } from "./ToastProvider";
import "./PokemonComparison.css";

const getTypeColor = (typeName) => {
  const typeColors = {
    normal: "#A8A878", fire: "#F08030", water: "#6890F0", electric: "#F8D030", grass: "#78C850", ice: "#98D8D8",
    fighting: "#C03028", poison: "#A040A0", ground: "#E0C068", flying: "#A890F0", psychic: "#F85888", bug: "#A8B820",
    rock: "#B8A038", ghost: "#705898", dragon: "#7038F8", dark: "#705848", steel: "#B8B8D0", fairy: "#EE99AC",
  };
  return typeColors[typeName] || "#A8A878";
};

const PokemonComparison = ({ pokemon1Name, pokemon2Name, onClose }) => {
  const { showToast } = useToast();
  const [pokemon1, setPokemon1] = useState(null);
  const [pokemon2, setPokemon2] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPokemons = async () => {
      try {
        setLoading(true);
        const [p1, p2] = await Promise.all([
          searchPokemon(pokemon1Name),
          searchPokemon(pokemon2Name)
        ]);
        setPokemon1(p1);
        setPokemon2(p2);
      } catch (error) {
        showToast("Error loading Pokemon for comparison", "error");
        console.log("Error fetching Pokemon:", error);
      } finally {
        setLoading(false);
      }
    };

    if (pokemon1Name && pokemon2Name) {
      fetchPokemons();
    }
  }, [pokemon1Name, pokemon2Name, showToast]);

  if (loading) {
    return (
      <div className="comparison-overlay" onClick={onClose}>
        <div className="comparison-modal" onClick={(e) => e.stopPropagation()}>
          <div className="comparison-loading">Loading comparison...</div>
        </div>
      </div>
    );
  }

  if (!pokemon1 || !pokemon2) {
    return null;
  }

  const getStatValue = (pokemon, statName) => {
    const stat = pokemon.stats.find(s => s.stat.name === statName);
    return stat?.base_stat || 0;
  };

  const stats = [
    { name: "HP", key: "hp" },
    { name: "Attack", key: "attack" },
    { name: "Defense", key: "defense" },
    { name: "Sp. Atk", key: "special-attack" },
    { name: "Sp. Def", key: "special-defense" },
    { name: "Speed", key: "speed" },
  ];

  const primaryType1 = pokemon1.types[0]?.type.name || "normal";
  const primaryType2 = pokemon2.types[0]?.type.name || "normal";
  const color1 = getTypeColor(primaryType1);
  const color2 = getTypeColor(primaryType2);

  return (
    <div className="comparison-overlay" onClick={onClose}>
      <div className="comparison-modal" onClick={(e) => e.stopPropagation()}>
        <div className="comparison-header">
          <h2>Pokemon Comparison</h2>
          <button onClick={onClose} className="comparison-close-btn" aria-label="Close comparison">
            ×
          </button>
        </div>
        <div className="comparison-content">
          <div className="comparison-pokemon">
            <div className="comparison-pokemon-header" style={{ backgroundColor: `${color1}20` }}>
              <img 
                src={pokemon1.sprites.other?.["official-artwork"]?.front_default || pokemon1.sprites.front_default}
                alt={pokemon1.name}
                className="comparison-pokemon-image"
              />
              <h3 className="comparison-pokemon-name">{pokemon1.name}</h3>
              <span className="comparison-pokemon-id">#{pokemon1.id}</span>
              <div className="comparison-pokemon-types">
                {pokemon1.types.map((type, index) => (
                  <span
                    key={index}
                    className="comparison-type-badge"
                    style={{ backgroundColor: getTypeColor(type.type.name) }}
                  >
                    {type.type.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="comparison-stats">
              {stats.map((stat) => {
                const value1 = getStatValue(pokemon1, stat.key);
                const value2 = getStatValue(pokemon2, stat.key);
                const maxValue = Math.max(value1, value2, 255);
                const winner = value1 > value2 ? 1 : value2 > value1 ? 2 : 0;
                return (
                  <div key={stat.key} className="comparison-stat-row">
                    <span className="comparison-stat-name">{stat.name}</span>
                    <div className="comparison-stat-bar-container">
                      <div
                        className="comparison-stat-bar"
                        style={{
                          width: `${(value1 / maxValue) * 100}%`,
                          backgroundColor: color1,
                        }}
                      >
                        <span className="comparison-stat-value">{value1}</span>
                      </div>
                      {winner === 1 && <span className="comparison-winner">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="comparison-vs">VS</div>
          <div className="comparison-pokemon">
            <div className="comparison-pokemon-header" style={{ backgroundColor: `${color2}20` }}>
              <img 
                src={pokemon2.sprites.other?.["official-artwork"]?.front_default || pokemon2.sprites.front_default}
                alt={pokemon2.name}
                className="comparison-pokemon-image"
              />
              <h3 className="comparison-pokemon-name">{pokemon2.name}</h3>
              <span className="comparison-pokemon-id">#{pokemon2.id}</span>
              <div className="comparison-pokemon-types">
                {pokemon2.types.map((type, index) => (
                  <span
                    key={index}
                    className="comparison-type-badge"
                    style={{ backgroundColor: getTypeColor(type.type.name) }}
                  >
                    {type.type.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="comparison-stats">
              {stats.map((stat) => {
                const value1 = getStatValue(pokemon1, stat.key);
                const value2 = getStatValue(pokemon2, stat.key);
                const maxValue = Math.max(value1, value2, 255);
                const winner = value1 > value2 ? 1 : value2 > value1 ? 2 : 0;
                return (
                  <div key={stat.key} className="comparison-stat-row">
                    <span className="comparison-stat-name">{stat.name}</span>
                    <div className="comparison-stat-bar-container">
                      <div
                        className="comparison-stat-bar"
                        style={{
                          width: `${(value2 / maxValue) * 100}%`,
                          backgroundColor: color2,
                        }}
                      >
                        <span className="comparison-stat-value">{value2}</span>
                      </div>
                      {winner === 2 && <span className="comparison-winner">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonComparison;

