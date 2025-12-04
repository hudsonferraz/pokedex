import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { searchPokemon, getPokemonSpecies, getEvolutionChain, getAbilityDetails } from "../api";
import FavoriteContext from "../contexts/favoritesContext";
import "./PokemonDetail.css";

const getTypeColor = (typeName) => {
  const typeColors = {
    normal: "#A8A878",
    fire: "#F08030",
    water: "#6890F0",
    electric: "#F8D030",
    grass: "#78C850",
    ice: "#98D8D8",
    fighting: "#C03028",
    poison: "#A040A0",
    ground: "#E0C068",
    flying: "#A890F0",
    psychic: "#F85888",
    bug: "#A8B820",
    rock: "#B8A038",
    ghost: "#705898",
    dragon: "#7038F8",
    dark: "#705848",
    steel: "#B8B8D0",
    fairy: "#EE99AC",
  };
  return typeColors[typeName] || "#A8A878";
};

const PokemonDetail = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const { favoritePokemons, updateFavoritePokemons } = useContext(FavoriteContext);
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evolutionChain, setEvolutionChain] = useState([]);
  const [abilityDescriptions, setAbilityDescriptions] = useState({});
  const [hoveredAbility, setHoveredAbility] = useState(null);

  const parseEvolutionChain = (chain) => {
    const evolutions = [];
    let current = chain;
    
    while (current) {
      const pokemonName = current.species.name;
      const pokemonId = current.species.url.split('/').slice(-2, -1)[0];
      evolutions.push({ name: pokemonName, id: pokemonId });
      current = current.evolves_to?.[0];
    }
    
    return evolutions;
  };

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        setLoading(true);
        const data = await searchPokemon(name);
        setPokemon(data);
        
        if (data) {
          const speciesData = await getPokemonSpecies(data.id);
          if (speciesData?.evolution_chain?.url) {
            const evolutionData = await getEvolutionChain(speciesData.evolution_chain.url);
            if (evolutionData?.chain) {
              const chain = parseEvolutionChain(evolutionData.chain);
              setEvolutionChain(chain);
            }
          }

          if (data.abilities && data.abilities.length > 0) {
            const abilityPromises = data.abilities.map(async (ability) => {
              try {
                const abilityData = await getAbilityDetails(ability.ability.url);
                const englishDescription = abilityData?.effect_entries?.find(
                  (entry) => entry.language.name === "en"
                )?.effect || abilityData?.flavor_text_entries?.find(
                  (entry) => entry.language.name === "en"
                )?.flavor_text || "No description available.";
                return {
                  name: ability.ability.name,
                  description: englishDescription,
                };
              } catch (error) {
                return {
                  name: ability.ability.name,
                  description: "No description available.",
                };
              }
            });
            const abilities = await Promise.all(abilityPromises);
            const descriptionsMap = {};
            abilities.forEach((ability) => {
              descriptionsMap[ability.name] = ability.description;
            });
            setAbilityDescriptions(descriptionsMap);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.log("Error fetching pokemon:", error);
        setLoading(false);
      }
    };
    fetchPokemon();
  }, [name]);

  const onHeartClick = () => {
    updateFavoritePokemons(pokemon.name);
  };

  if (loading) {
    return <div className="pokemon-detail-loading">Loading...</div>;
  }

  if (!pokemon) {
    return (
      <div className="pokemon-detail-container">
        <div className="pokemon-detail-error">
          <h2>Pokemon not found!</h2>
          <button onClick={() => navigate("/")} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const primaryType = pokemon.types[0]?.type.name || "normal";
  const cardColor = getTypeColor(primaryType);

  const formatStatName = (statName) => {
    return statName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatHeight = (height) => {
    return `${(height / 10).toFixed(1)} m`;
  };

  const formatWeight = (weight) => {
    return `${(weight / 10).toFixed(1)} kg`;
  };

  return (
    <div className="pokemon-detail-container" style={{ backgroundColor: `${cardColor}20` }}>
      <button onClick={() => navigate("/")} className="back-button">
        ← Back to Pokedex
      </button>
      <div className="pokemon-detail-card" style={{ borderColor: cardColor }}>
        <div className="pokemon-detail-header">
          <div className="pokemon-detail-image-section">
            <img
              src={pokemon.sprites.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default}
              alt={pokemon.name}
              className="pokemon-detail-image"
            />
            <div className="pokemon-sprites-evolution-container">
              <div className="pokemon-sprites-comparison">
                <div className="sprite-group">
                  <h3 className="sprite-label">Original</h3>
                  <div className="sprite-pair">
                    {pokemon.sprites.front_default && (
                      <div className="sprite-item">
                        <img src={pokemon.sprites.front_default} alt="Front Original" className="pokemon-sprite" />
                        <span className="sprite-caption">Front</span>
                      </div>
                    )}
                    {pokemon.sprites.back_default && (
                      <div className="sprite-item">
                        <img src={pokemon.sprites.back_default} alt="Back Original" className="pokemon-sprite" />
                        <span className="sprite-caption">Back</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="sprite-group">
                  <h3 className="sprite-label">Shiny</h3>
                  <div className="sprite-pair">
                    {pokemon.sprites.front_shiny && (
                      <div className="sprite-item">
                        <img src={pokemon.sprites.front_shiny} alt="Front Shiny" className="pokemon-sprite" />
                        <span className="sprite-caption">Front</span>
                      </div>
                    )}
                    {pokemon.sprites.back_shiny && (
                      <div className="sprite-item">
                        <img src={pokemon.sprites.back_shiny} alt="Back Shiny" className="pokemon-sprite" />
                        <span className="sprite-caption">Back</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {evolutionChain.length > 1 && (
                <div className="evolution-chain-group">
                  <h3 className="sprite-label">Evolution</h3>
                  <div className="evolution-chain">
                    {evolutionChain.map((evolution, index) => (
                      <React.Fragment key={evolution.id}>
                        <div 
                          className={`evolution-item ${evolution.name === pokemon.name ? 'current-evolution' : ''}`}
                          onClick={() => navigate(`/pokemon/${evolution.name}`)}
                          style={{ cursor: evolution.name === pokemon.name ? 'default' : 'pointer' }}
                        >
                          <img 
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evolution.id}.png`}
                            alt={evolution.name}
                            className="evolution-sprite"
                          />
                          <span className="evolution-name">{evolution.name}</span>
                        </div>
                        {index < evolutionChain.length - 1 && (
                          <span className="evolution-arrow">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="pokemon-detail-info">
            <div className="pokemon-detail-title">
              <h1 className="pokemon-detail-name">{pokemon.name}</h1>
              <span className="pokemon-detail-id">#{pokemon.id}</span>
              <button className="pokemon-detail-heart-btn" onClick={onHeartClick}>
                {favoritePokemons.includes(pokemon.name) ? "❤️" : "🖤"}
              </button>
            </div>
            <div className="pokemon-detail-types">
              {pokemon.types.map((type, index) => (
                <span
                  key={index}
                  className="pokemon-detail-type-badge"
                  style={{ backgroundColor: getTypeColor(type.type.name) }}
                >
                  {type.type.name}
                </span>
              ))}
            </div>
            <div className="pokemon-detail-stats-grid">
              <div className="pokemon-detail-stat">
                <span className="stat-label">Height</span>
                <span className="stat-value">{formatHeight(pokemon.height)}</span>
              </div>
              <div className="pokemon-detail-stat">
                <span className="stat-label">Weight</span>
                <span className="stat-value">{formatWeight(pokemon.weight)}</span>
              </div>
              <div className="pokemon-detail-stat">
                <span className="stat-label">Base Experience</span>
                <span className="stat-value">{pokemon.base_experience}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="pokemon-detail-stats-section">
          <h2>Base Stats</h2>
          <div className="pokemon-stats-list">
            {pokemon.stats.map((stat, index) => (
              <div key={index} className="pokemon-stat-row">
                <span className="stat-name">{formatStatName(stat.stat.name)}</span>
                <div className="stat-bar-container">
                  <div
                    className="stat-bar"
                    style={{
                      width: `${(stat.base_stat / 255) * 100}%`,
                      backgroundColor: cardColor,
                    }}
                  >
                    <span className="stat-value-number">{stat.base_stat}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {pokemon.abilities && pokemon.abilities.length > 0 && (
          <div className="pokemon-detail-abilities">
            <h2>Abilities</h2>
            <div className="abilities-list">
              {pokemon.abilities.map((ability, index) => {
                const abilityName = ability.ability.name;
                const description = abilityDescriptions[abilityName];
                return (
                  <div
                    key={index}
                    className="ability-badge-container"
                    onMouseEnter={() => setHoveredAbility(abilityName)}
                    onMouseLeave={() => setHoveredAbility(null)}
                  >
                    <span className="ability-badge">
                      {abilityName}
                      {ability.is_hidden && <span className="hidden-indicator"> (Hidden)</span>}
                    </span>
                    {hoveredAbility === abilityName && description && (
                      <div className="ability-tooltip">
                        <h4 className="ability-tooltip-title">{abilityName}</h4>
                        <p className="ability-tooltip-description">{description}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PokemonDetail;

