import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { searchPokemon, getPokemonSpecies, getEvolutionChain, getAbilityDetails, getPokemons, getMoveDetails } from "../api";
import FavoriteContext from "../contexts/favoritesContext";
import { useToast } from "./ToastProvider";
import StatsRadarChart from "./StatsRadarChart";
import { addToRecentlyViewed } from "../utils/recentlyViewed";
import "./PokemonDetail.css";

// Simple cache for Pokemon data
const pokemonCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  const { showToast } = useToast();
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evolutionChain, setEvolutionChain] = useState([]);
  const [abilityDescriptions, setAbilityDescriptions] = useState({});
  const [hoveredAbility, setHoveredAbility] = useState(null);
  const [pokemonDescription, setPokemonDescription] = useState("");
  const [moves, setMoves] = useState([]);
  const [allMoves, setAllMoves] = useState([]);
  const [showAllMoves, setShowAllMoves] = useState(false);
  const [hoveredMove, setHoveredMove] = useState(null);
  const [moveDetails, setMoveDetails] = useState({});
  const [prevPokemon, setPrevPokemon] = useState(null);
  const [nextPokemon, setNextPokemon] = useState(null);

  const parseEvolutionChain = (chain) => {
    const evolutions = [];
    let current = chain;
    
    while (current) {
      const pokemonName = current.species.name;
      const pokemonId = current.species.url.split('/').slice(-2, -1)[0];
      const evolutionDetails = current.evolution_details?.[0];
      let condition = "";
      
      if (evolutionDetails) {
        if (evolutionDetails.min_level) {
          condition = `Level ${evolutionDetails.min_level}`;
        } else if (evolutionDetails.item) {
          condition = evolutionDetails.item.name.replace(/-/g, " ");
        } else if (evolutionDetails.trigger?.name === "trade") {
          condition = "Trade";
        } else if (evolutionDetails.trigger?.name === "use-item") {
          condition = "Use Item";
        }
      }
      
      evolutions.push({ 
        name: pokemonName, 
        id: pokemonId,
        condition: condition
      });
      current = current.evolves_to?.[0];
    }
    
    return evolutions;
  };

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cacheKey = name.toLowerCase();
        const cached = pokemonCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setPokemon(cached.data);
          setLoading(false);
          // Still fetch fresh data in background
        }
        
        const data = await searchPokemon(name);
        setPokemon(data);
        
        // Cache the data
        if (data) {
          pokemonCache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
          });
          // Add to recently viewed
          addToRecentlyViewed(data);
        }
        
        if (data) {
          if (data.moves && data.moves.length > 0) {
            const movesPromises = data.moves.map(async (move) => {
              try {
                const moveData = await getMoveDetails(move.move.url);
                const moveInfo = {
                  name: move.move.name,
                  level: move.version_group_details[0]?.level_learned_at || 0,
                  type: moveData?.type?.name || "normal",
                  power: moveData?.power || null,
                  accuracy: moveData?.accuracy || null,
                  pp: moveData?.pp || null,
                  damageClass: moveData?.damage_class?.name || null,
                };
                setMoveDetails(prev => ({ ...prev, [move.move.name]: moveInfo }));
                return moveInfo;
              } catch (error) {
                const moveInfo = {
                  name: move.move.name,
                  level: move.version_group_details[0]?.level_learned_at || 0,
                  type: "normal",
                  power: null,
                  accuracy: null,
                  pp: null,
                  damageClass: null,
                };
                setMoveDetails(prev => ({ ...prev, [move.move.name]: moveInfo }));
                return moveInfo;
              }
            });
            const allMovesList = await Promise.all(movesPromises);
            allMovesList.sort((a, b) => a.level - b.level);
            setAllMoves(allMovesList);
            setMoves(allMovesList.slice(0, 20));
          }

          const speciesData = await getPokemonSpecies(data.id);
          
          if (speciesData) {
            const englishFlavorText = speciesData?.flavor_text_entries?.find(
              (entry) => entry.language.name === "en"
            )?.flavor_text;
            if (englishFlavorText) {
              const cleanDescription = englishFlavorText.replace(/\f/g, " ").replace(/\n/g, " ");
              setPokemonDescription(cleanDescription);
            }
          }
          
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

          const prevId = data.id > 1 ? data.id - 1 : null;
          const nextId = data.id < 1025 ? data.id + 1 : null;

          if (prevId) {
            try {
              const prevData = await searchPokemon(prevId);
              setPrevPokemon(prevData);
            } catch (error) {
              setPrevPokemon(null);
            }
          } else {
            setPrevPokemon(null);
          }

          if (nextId) {
            try {
              const nextData = await searchPokemon(nextId);
              setNextPokemon(nextData);
            } catch (error) {
              setNextPokemon(null);
            }
          } else {
            setNextPokemon(null);
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
    const wasFavorite = favoritePokemons.includes(pokemon.name);
    updateFavoritePokemons(pokemon.name);
    if (wasFavorite) {
      showToast(`${pokemon.name} removed from favorites`, "info");
    } else {
      showToast(`${pokemon.name} added to favorites! ❤️`, "success");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard!", "success");
    } catch (error) {
      showToast("Failed to copy link", "error");
    }
  };

  // Keyboard navigation - must be before any early returns
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowLeft" && prevPokemon) {
        navigate(`/pokemon/${prevPokemon.name}`);
      } else if (e.key === "ArrowRight" && nextPokemon) {
        navigate(`/pokemon/${nextPokemon.name}`);
      } else if (e.key === "Escape") {
        navigate("/");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [prevPokemon, nextPokemon, navigate]);

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
      <div className="pokemon-detail-navigation">
        <button 
          onClick={() => navigate("/")} 
          className="back-button"
          aria-label="Back to Pokedex"
        >
          ← Back to Pokedex
        </button>
        <div className="pokemon-nav-buttons">
          {prevPokemon && (
            <button 
              onClick={() => navigate(`/pokemon/${prevPokemon.name}`)}
              className="nav-pokemon-btn prev-btn"
              aria-label={`Previous Pokemon: ${prevPokemon.name}`}
            >
              ← #{prevPokemon.id} {prevPokemon.name}
            </button>
          )}
          {nextPokemon && (
            <button 
              onClick={() => navigate(`/pokemon/${nextPokemon.name}`)}
              className="nav-pokemon-btn next-btn"
              aria-label={`Next Pokemon: ${nextPokemon.name}`}
            >
              #{nextPokemon.id} {nextPokemon.name} →
            </button>
          )}
        </div>
      </div>
      <div className="pokemon-detail-card" style={{ borderColor: cardColor }}>
        <div className="pokemon-detail-header">
          <div className="pokemon-detail-image-section">
            <img
              src={pokemon.sprites.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default}
              alt={pokemon.name}
              className="pokemon-detail-image"
              loading="eager"
            />
            <div className="pokemon-sprites-evolution-container">
              <div className="pokemon-sprites-comparison">
                <div className="sprite-group">
                  <h3 className="sprite-label">Original</h3>
                  <div className="sprite-pair">
                  {pokemon.sprites.front_default && (
                    <div className="sprite-item">
                      <img src={pokemon.sprites.front_default} alt="Front Original" className="pokemon-sprite" loading="lazy" />
                      <span className="sprite-caption">Front</span>
                    </div>
                  )}
                  {pokemon.sprites.back_default && (
                    <div className="sprite-item">
                      <img src={pokemon.sprites.back_default} alt="Back Original" className="pokemon-sprite" loading="lazy" />
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
                      <img src={pokemon.sprites.front_shiny} alt="Front Shiny" className="pokemon-sprite" loading="lazy" />
                      <span className="sprite-caption">Front</span>
                    </div>
                  )}
                  {pokemon.sprites.back_shiny && (
                    <div className="sprite-item">
                      <img src={pokemon.sprites.back_shiny} alt="Back Shiny" className="pokemon-sprite" loading="lazy" />
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
                            loading="lazy"
                          />
                          <span className="evolution-name">{evolution.name}</span>
                          {evolution.condition && index > 0 && (
                            <span className="evolution-condition">{evolution.condition}</span>
                          )}
                        </div>
                        {index < evolutionChain.length - 1 && (
                          <div className="evolution-arrow-container">
                            <span className="evolution-arrow">→</span>
                            {evolutionChain[index + 1]?.condition && (
                              <span className="evolution-arrow-condition">{evolutionChain[index + 1].condition}</span>
                            )}
                          </div>
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
              <div className="pokemon-detail-actions">
                <button className="share-button" onClick={handleShare} title="Share Pokemon">
                  🔗
                </button>
                <button className="pokemon-detail-heart-btn" onClick={onHeartClick}>
                  {favoritePokemons.includes(pokemon.name) ? "❤️" : "🖤"}
                </button>
              </div>
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
            {pokemonDescription && (
              <div className="pokemon-description-box" style={{ borderLeftColor: cardColor }}>
                <h3 className="description-title">Description</h3>
                <p className="description-text">{pokemonDescription}</p>
              </div>
            )}
          </div>
        </div>
        <div className="pokemon-detail-stats-section">
          <h2>Base Stats</h2>
          <StatsRadarChart stats={pokemon.stats} color={cardColor} />
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
        {allMoves.length > 0 && (
          <div className="pokemon-detail-moves">
            <div className="moves-header">
              <h2>Moves ({allMoves.length})</h2>
              {allMoves.length > 20 && (
                <button 
                  onClick={() => setShowAllMoves(!showAllMoves)}
                  className="show-all-moves-btn"
                >
                  {showAllMoves ? "Show Less" : `Show All (${allMoves.length})`}
                </button>
              )}
            </div>
            <div className="moves-list">
              {(showAllMoves ? allMoves : moves).map((move, index) => {
                const details = moveDetails[move.name] || move;
                return (
                  <div
                    key={index}
                    className="move-badge-container"
                    onMouseEnter={() => setHoveredMove(move.name)}
                    onMouseLeave={() => setHoveredMove(null)}
                  >
                    <span 
                      className="move-badge"
                      style={{ backgroundColor: getTypeColor(move.type) }}
                    >
                      {move.name}
                      {move.level > 0 && <span className="move-level"> (Lv. {move.level})</span>}
                    </span>
                    {hoveredMove === move.name && details && (
                      <div className="move-tooltip">
                        <h4 className="move-tooltip-title">{details.name}</h4>
                        <div className="move-tooltip-details">
                          <span className="move-tooltip-type" style={{ backgroundColor: getTypeColor(details.type) }}>
                            {details.type}
                          </span>
                          {details.power !== null && (
                            <span className="move-tooltip-stat">Power: {details.power}</span>
                          )}
                          {details.accuracy !== null && (
                            <span className="move-tooltip-stat">Accuracy: {details.accuracy}%</span>
                          )}
                          {details.pp !== null && (
                            <span className="move-tooltip-stat">PP: {details.pp}</span>
                          )}
                          {details.damageClass && (
                            <span className="move-tooltip-stat">Class: {details.damageClass}</span>
                          )}
                        </div>
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

