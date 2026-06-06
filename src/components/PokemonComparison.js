import React, { useState, useEffect } from "react";
import { searchPokemon } from "../api";
import { useToast } from "./ToastProvider";
import { useMetaData } from "../contexts/MetaDataContext";
import { useRegulation } from "../contexts/RegulationContext";
import { fetchPokemonMeta } from "../services/metaDataService";
import {
  getUsagePercentFromMeta,
  getWinRateFromSpeciesMeta,
} from "../utils/usageStats";
import { formatSpeciesLabel } from "../utils/regulation";
import { getTypeColor } from "../constants/typeColors";
import "./PokemonComparison.css";

const PokemonComparison = ({ pokemon1Name, pokemon2Name, onClose }) => {
  const { showToast } = useToast();
  const { meta, speciesMeta } = useMetaData();
  const { regulation } = useRegulation();
  const [pokemon1, setPokemon1] = useState(null);
  const [pokemon2, setPokemon2] = useState(null);
  const [meta1, setMeta1] = useState(null);
  const [meta2, setMeta2] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPokemons = async () => {
      try {
        setLoading(true);
        const [first, second, firstMeta, secondMeta] = await Promise.all([
          searchPokemon(pokemon1Name),
          searchPokemon(pokemon2Name),
          fetchPokemonMeta(regulation.id, pokemon1Name),
          fetchPokemonMeta(regulation.id, pokemon2Name),
        ]);
        setPokemon1(first);
        setPokemon2(second);
        setMeta1(firstMeta.error ? null : firstMeta);
        setMeta2(secondMeta.error ? null : secondMeta);
      } catch (error) {
        showToast("Error loading Pokémon for comparison", "error");
        console.error("Error fetching Pokémon:", error);
      } finally {
        setLoading(false);
      }
    };

    if (pokemon1Name && pokemon2Name) {
      fetchPokemons();
    }
  }, [pokemon1Name, pokemon2Name, regulation.id, showToast]);

  if (loading) {
    return (
      <div className="comparison-overlay" onClick={onClose}>
        <div className="comparison-modal" onClick={(event) => event.stopPropagation()}>
          <div className="comparison-loading">Loading comparison…</div>
        </div>
      </div>
    );
  }

  if (!pokemon1 || !pokemon2) {
    return null;
  }

  const getStatValue = (pokemon, statName) => {
    const stat = pokemon.stats.find((entry) => entry.stat.name === statName);
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

  const getMetaDisplay = (pokemon, detailMeta) => {
    const usage =
      detailMeta?.usage ?? getUsagePercentFromMeta(meta, pokemon.name);
    const winRate =
      detailMeta?.winRate ??
      getWinRateFromSpeciesMeta(speciesMeta, pokemon.name);
    return { usage, winRate };
  };

  const metaDisplay1 = getMetaDisplay(pokemon1, meta1);
  const metaDisplay2 = getMetaDisplay(pokemon2, meta2);
  const hasMeta =
    metaDisplay1.usage != null ||
    metaDisplay1.winRate != null ||
    metaDisplay2.usage != null ||
    metaDisplay2.winRate != null;

  const renderMetaValue = (value, suffix) =>
    value != null ? `${value.toFixed(1)}${suffix}` : "—";

  return (
    <div className="comparison-overlay" onClick={onClose}>
      <div className="comparison-modal" onClick={(event) => event.stopPropagation()}>
        <div className="comparison-header">
          <div>
            <h2>Pokémon comparison</h2>
            <p className="comparison-subtitle">{regulation.label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="comparison-close-btn"
            aria-label="Close comparison"
          >
            ×
          </button>
        </div>

        {hasMeta && (
          <div className="comparison-meta-table card-surface">
            <div className="comparison-meta-row comparison-meta-header">
              <span className="comparison-meta-label">VGC meta</span>
              <span>{formatSpeciesLabel(pokemon1.name)}</span>
              <span>{formatSpeciesLabel(pokemon2.name)}</span>
            </div>
            <div className="comparison-meta-row">
              <span className="comparison-meta-label">Usage</span>
              <span>{renderMetaValue(metaDisplay1.usage, "%")}</span>
              <span>{renderMetaValue(metaDisplay2.usage, "%")}</span>
            </div>
            <div className="comparison-meta-row">
              <span className="comparison-meta-label">Win rate</span>
              <span>{renderMetaValue(metaDisplay1.winRate, "%")}</span>
              <span>{renderMetaValue(metaDisplay2.winRate, "%")}</span>
            </div>
          </div>
        )}

        <div className="comparison-content">
          <div className="comparison-pokemon">
            <div
              className="comparison-pokemon-header"
              style={{ backgroundColor: `${color1}20` }}
            >
              <img
                src={
                  pokemon1.sprites.other?.["official-artwork"]?.front_default ||
                  pokemon1.sprites.front_default
                }
                alt=""
                className="comparison-pokemon-image"
              />
              <h3 className="comparison-pokemon-name">
                {formatSpeciesLabel(pokemon1.name)}
              </h3>
              <span className="comparison-pokemon-id">#{pokemon1.id}</span>
              <div className="comparison-pokemon-types">
                {pokemon1.types.map((typeEntry) => (
                  <span
                    key={typeEntry.type.name}
                    className="comparison-type-badge"
                    style={{ backgroundColor: getTypeColor(typeEntry.type.name) }}
                  >
                    {typeEntry.type.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="comparison-vs">VS</div>

          <div className="comparison-pokemon">
            <div
              className="comparison-pokemon-header"
              style={{ backgroundColor: `${color2}20` }}
            >
              <img
                src={
                  pokemon2.sprites.other?.["official-artwork"]?.front_default ||
                  pokemon2.sprites.front_default
                }
                alt=""
                className="comparison-pokemon-image"
              />
              <h3 className="comparison-pokemon-name">
                {formatSpeciesLabel(pokemon2.name)}
              </h3>
              <span className="comparison-pokemon-id">#{pokemon2.id}</span>
              <div className="comparison-pokemon-types">
                {pokemon2.types.map((typeEntry) => (
                  <span
                    key={typeEntry.type.name}
                    className="comparison-type-badge"
                    style={{ backgroundColor: getTypeColor(typeEntry.type.name) }}
                  >
                    {typeEntry.type.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="comparison-unified-stats">
          {stats.map((stat) => {
            const value1 = getStatValue(pokemon1, stat.key);
            const value2 = getStatValue(pokemon2, stat.key);
            const maxValue = Math.max(value1, value2, 255);
            const winner =
              value1 > value2 ? 1 : value2 > value1 ? 2 : 0;

            return (
              <div key={stat.key} className="comparison-unified-stat-row">
                <span className="comparison-stat-name">{stat.name}</span>
                <div className="comparison-dual-bars">
                  <div className="comparison-dual-bar-wrap">
                    <div
                      className="comparison-dual-bar left"
                      style={{
                        width: `${(value1 / maxValue) * 100}%`,
                        backgroundColor: color1,
                      }}
                    >
                      <span className="comparison-stat-value">{value1}</span>
                    </div>
                    {winner === 1 && <span className="comparison-winner">✓</span>}
                  </div>
                  <div className="comparison-dual-bar-wrap">
                    <div
                      className="comparison-dual-bar right"
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PokemonComparison;
