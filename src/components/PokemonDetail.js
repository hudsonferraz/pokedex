import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  searchPokemon,
  getPokemonSpecies,
  getEvolutionChain,
  getAbilityDetails,
  getMoveDetails,
  getPokemonForms,
} from "../api";
import TeamContext from "../contexts/TeamContext";
import { useToast } from "./ToastProvider";
import { useComparison } from "../contexts/ComparisonContext";
import PokemonComparison from "./PokemonComparison";
import { addToRecentlyViewed } from "../utils/recentlyViewed";
import { getTypeColor } from "../constants/typeColors";
import Navbar from "./Navbar";
import BrowseEmptyState from "./BrowseEmptyState";
import PokemonDetailSkeleton from "./PokemonDetailSkeleton";
import PokemonDetailHero from "./PokemonDetailHero";
import PokemonStatsSection from "./PokemonStatsSection";
import PokemonEvolutionSection from "./PokemonEvolutionSection";
import PokemonMovesSection from "./PokemonMovesSection";
import "./PokemonDetail.css";

const pokemonCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

const PokemonDetail = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const { addToTeam, isInTeam, canAddToTeam, getMoveset, setMoveset } =
    useContext(TeamContext);
  const { showToast } = useToast();
  const { comparisonPokemon, addToComparison, clearComparison } = useComparison();
  const [pokemon, setPokemon] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [loading, setLoading] = useState(true);
  const [evolutionChain, setEvolutionChain] = useState([]);
  const [abilityDescriptions, setAbilityDescriptions] = useState({});
  const [pokemonDescription, setPokemonDescription] = useState("");
  const [moves, setMoves] = useState([]);
  const [allMoves, setAllMoves] = useState([]);
  const [showAllMoves, setShowAllMoves] = useState(false);
  const [moveDetails, setMoveDetails] = useState({});
  const [prevPokemon, setPrevPokemon] = useState(null);
  const [nextPokemon, setNextPokemon] = useState(null);
  const [pokemonForms, setPokemonForms] = useState([]);
  const [currentFormIndex, setCurrentFormIndex] = useState(0);

  const parseEvolutionChain = (chain) => {
    const evolutions = [];
    let current = chain;

    while (current) {
      const pokemonName = current.species.name;
      const pokemonId = current.species.url.split("/").slice(-2, -1)[0];
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
        condition,
      });
      current = current.evolves_to?.[0];
    }

    return evolutions;
  };

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        setLoading(true);
        setPokemonForms([]);
        setCurrentFormIndex(0);
        setShowAllMoves(false);

        const cacheKey = name.toLowerCase();
        const cached = pokemonCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setPokemon(cached.data);
        }

        const data = await searchPokemon(name);
        setPokemon(data);

        if (data) {
          pokemonCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
          });
          addToRecentlyViewed(data);
        }

        if (data) {
          if (data.moves?.length > 0) {
            const movesPromises = data.moves.map(async (move) => {
              try {
                const moveData = await getMoveDetails(move.move.url);
                const englishEffect = moveData?.effect_entries?.find(
                  (entry) => entry.language?.name === "en",
                );
                let effect =
                  englishEffect?.short_effect || englishEffect?.effect || null;
                const effectChance =
                  moveData?.effect_chance != null ? moveData.effect_chance : null;
                if (effect && effectChance != null) {
                  effect = effect.replace(/\$effect_chance/g, String(effectChance));
                }
                const moveInfo = {
                  name: move.move.name,
                  level: move.version_group_details[0]?.level_learned_at || 0,
                  type: moveData?.type?.name || "normal",
                  power: moveData?.power ?? null,
                  accuracy: moveData?.accuracy ?? null,
                  pp: moveData?.pp ?? null,
                  damageClass: moveData?.damage_class?.name || null,
                  effect,
                  effectChance,
                };
                setMoveDetails((previous) => ({
                  ...previous,
                  [move.move.name]: moveInfo,
                }));
                return moveInfo;
              } catch {
                const moveInfo = {
                  name: move.move.name,
                  level: move.version_group_details[0]?.level_learned_at || 0,
                  type: "normal",
                  power: null,
                  accuracy: null,
                  pp: null,
                  damageClass: null,
                  effect: null,
                  effectChance: null,
                };
                setMoveDetails((previous) => ({
                  ...previous,
                  [move.move.name]: moveInfo,
                }));
                return moveInfo;
              }
            });
            const allMovesList = await Promise.all(movesPromises);
            allMovesList.sort((first, second) => first.level - second.level);
            setAllMoves(allMovesList);
            setMoves(allMovesList.slice(0, 20));
          } else {
            setAllMoves([]);
            setMoves([]);
          }

          let speciesData;
          if (data.species?.url) {
            const speciesResponse = await fetch(data.species.url);
            speciesData = await speciesResponse.json();
          } else {
            speciesData = await getPokemonSpecies(data.id);
          }

          if (speciesData) {
            const englishFlavorText = speciesData?.flavor_text_entries?.find(
              (entry) => entry.language.name === "en",
            )?.flavor_text;
            if (englishFlavorText) {
              setPokemonDescription(
                englishFlavorText.replace(/\f/g, " ").replace(/\n/g, " "),
              );
            } else {
              setPokemonDescription("");
            }

            const forms = await getPokemonForms(speciesData);
            if (forms?.length > 1) {
              forms.sort((first, second) => {
                if (first.is_default && !second.is_default) return -1;
                if (!first.is_default && second.is_default) return 1;
                return first.id - second.id;
              });
              setPokemonForms(forms);
              const currentIndex = forms.findIndex(
                (form) => form.name.toLowerCase() === data.name.toLowerCase(),
              );
              setCurrentFormIndex(currentIndex >= 0 ? currentIndex : 0);
            } else {
              setPokemonForms([]);
              setCurrentFormIndex(0);
            }
          }

          if (speciesData?.evolution_chain?.url) {
            const evolutionData = await getEvolutionChain(
              speciesData.evolution_chain.url,
            );
            if (evolutionData?.chain) {
              setEvolutionChain(parseEvolutionChain(evolutionData.chain));
            } else {
              setEvolutionChain([]);
            }
          } else {
            setEvolutionChain([]);
          }

          if (data.abilities?.length > 0) {
            const abilityPromises = data.abilities.map(async (ability) => {
              try {
                const abilityData = await getAbilityDetails(ability.ability.url);
                const englishDescription =
                  abilityData?.effect_entries?.find(
                    (entry) => entry.language.name === "en",
                  )?.effect ||
                  abilityData?.flavor_text_entries?.find(
                    (entry) => entry.language.name === "en",
                  )?.flavor_text ||
                  "No description available.";
                return {
                  name: ability.ability.name,
                  description: englishDescription,
                };
              } catch {
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
          } else {
            setAbilityDescriptions({});
          }

          const prevId = data.id > 1 ? data.id - 1 : null;
          const nextId = data.id < 1025 ? data.id + 1 : null;

          if (prevId) {
            try {
              setPrevPokemon(await searchPokemon(prevId));
            } catch {
              setPrevPokemon(null);
            }
          } else {
            setPrevPokemon(null);
          }

          if (nextId) {
            try {
              setNextPokemon(await searchPokemon(nextId));
            } catch {
              setNextPokemon(null);
            }
          } else {
            setNextPokemon(null);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching pokemon:", error);
        setLoading(false);
      }
    };

    fetchPokemon();
  }, [name]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "ArrowLeft" && prevPokemon) {
        navigate(`/pokemon/${prevPokemon.name}`);
      } else if (event.key === "ArrowRight" && nextPokemon) {
        navigate(`/pokemon/${nextPokemon.name}`);
      } else if (event.key === "Escape") {
        navigate("/browse");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [prevPokemon, nextPokemon, navigate]);

  const handleFormChange = (direction) => {
    if (pokemonForms.length <= 1) {
      return;
    }

    const newIndex =
      direction === "next"
        ? (currentFormIndex + 1) % pokemonForms.length
        : (currentFormIndex - 1 + pokemonForms.length) % pokemonForms.length;

    const newForm = pokemonForms[newIndex];
    if (newForm) {
      navigate(`/pokemon/${newForm.name}`);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard!", "success");
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  const handleAddToTeam = () => {
    if (!pokemon) {
      return;
    }
    if (!canAddToTeam()) {
      showToast("Team is full! Remove a Pokémon from your team first.", "error");
      return;
    }
    if (isInTeam(pokemon.name)) {
      showToast(`${pokemon.name} is already in your team!`, "info");
      return;
    }
    if (addToTeam(pokemon)) {
      showToast(`${pokemon.name} added to team!`, "success");
    }
  };

  const handleCompare = () => {
    if (!pokemon) {
      return;
    }
    addToComparison(pokemon.name);
    if (comparisonPokemon.length === 1) {
      setShowComparison(true);
    } else {
      showToast("Select another Pokémon to compare", "info");
    }
  };

  const handleApplyMetaSet = () => {
    showToast("Apply meta set — coming in the next sprint (Phase D)", "info");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pokemon-detail-page">
          <div className="pokemon-detail-container">
            <PokemonDetailSkeleton />
          </div>
        </div>
      </>
    );
  }

  if (!pokemon) {
    return (
      <>
        <Navbar />
        <div className="pokemon-detail-page">
          <div className="pokemon-detail-container">
            <BrowseEmptyState
              title="Pokémon not found"
              message="This species could not be loaded. It may not exist or the name may be misspelled."
              primaryLabel="Back to Browse"
              onPrimaryAction={() => navigate("/browse")}
            />
          </div>
        </div>
      </>
    );
  }

  const primaryType = pokemon.types[0]?.type.name || "normal";
  const cardColor = getTypeColor(primaryType);

  const formatStatName = (statName) =>
    statName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const formatHeight = (height) => `${(height / 10).toFixed(1)} m`;
  const formatWeight = (weight) => `${(weight / 10).toFixed(1)} kg`;

  return (
    <>
      <Navbar />
      <div className="pokemon-detail-page">
        <div className="pokemon-detail-container">
          <div className="pokemon-detail-navigation">
            <div className="pokemon-detail-breadcrumb">
              <button
                type="button"
                onClick={() => navigate("/browse")}
                className="back-button"
                aria-label="Back to Browse"
              >
                ← Back to Browse
              </button>
              <Link to="/" className="pokemon-detail-team-link">
                Team Builder
              </Link>
            </div>
            <div className="pokemon-nav-buttons">
              {prevPokemon && (
                <button
                  type="button"
                  onClick={() => navigate(`/pokemon/${prevPokemon.name}`)}
                  className="nav-pokemon-btn prev-btn"
                  aria-label={`Previous Pokémon: ${prevPokemon.name}`}
                >
                  ← #{prevPokemon.id} {prevPokemon.name}
                </button>
              )}
              {nextPokemon && (
                <button
                  type="button"
                  onClick={() => navigate(`/pokemon/${nextPokemon.name}`)}
                  className="nav-pokemon-btn next-btn"
                  aria-label={`Next Pokémon: ${nextPokemon.name}`}
                >
                  #{nextPokemon.id} {nextPokemon.name} →
                </button>
              )}
            </div>
          </div>

          <PokemonDetailHero
            pokemon={pokemon}
            cardColor={cardColor}
            pokemonForms={pokemonForms}
            currentFormIndex={currentFormIndex}
            onFormChange={handleFormChange}
            pokemonDescription={pokemonDescription}
            formatHeight={formatHeight}
            formatWeight={formatWeight}
            isInTeam={isInTeam}
            canAddToTeam={canAddToTeam}
            comparisonPokemon={comparisonPokemon}
            onAddToTeam={handleAddToTeam}
            onCompare={handleCompare}
            onShare={handleShare}
            onApplyMetaSet={handleApplyMetaSet}
          />

          <div className="pokemon-detail-sections">
            <PokemonStatsSection
              pokemon={pokemon}
              cardColor={cardColor}
              formatStatName={formatStatName}
            />
            <PokemonMovesSection
              pokemon={pokemon}
              abilities={pokemon.abilities}
              abilityDescriptions={abilityDescriptions}
              allMoves={allMoves}
              moves={moves}
              moveDetails={moveDetails}
              showAllMoves={showAllMoves}
              onToggleShowAllMoves={() => setShowAllMoves((open) => !open)}
              isOnTeam={isInTeam(pokemon.name)}
              getMoveset={getMoveset}
              setMoveset={setMoveset}
              showToast={showToast}
            />
            <PokemonEvolutionSection
              pokemon={pokemon}
              evolutionChain={evolutionChain}
            />
          </div>
        </div>

        {showComparison && comparisonPokemon.length === 2 && (
          <PokemonComparison
            pokemon1Name={comparisonPokemon[0]}
            pokemon2Name={comparisonPokemon[1]}
            onClose={() => {
              setShowComparison(false);
              clearComparison();
            }}
          />
        )}
      </div>
    </>
  );
};

export default PokemonDetail;
