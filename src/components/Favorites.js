import React, { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { searchPokemon } from "../api";
import FavoriteContext from "../contexts/favoritesContext";
import Navbar from "./Navbar";
import Pokemon from "./Pokemon";
import PokemonCardSkeleton from "./PokemonCardSkeleton";
import TypeFilter from "./TypeFilter";
import "./Favorites.css";

const Favorites = () => {
  const navigate = useNavigate();
  const { favoritePokemons, updateFavoritePokemons } = useContext(FavoriteContext);
  const [favoritePokemonData, setFavoritePokemonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedGeneration, setSelectedGeneration] = useState(null);

  useEffect(() => {
    const fetchFavoritePokemons = async () => {
      if (favoritePokemons.length === 0) {
        setFavoritePokemonData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const promises = favoritePokemons.map(async (pokemonName) => {
          try {
            return await searchPokemon(pokemonName);
          } catch (error) {
            console.log(`Error fetching ${pokemonName}:`, error);
            return null;
          }
        });

        const results = await Promise.all(promises);
        const validResults = results.filter((pokemon) => pokemon !== null);
        setFavoritePokemonData(validResults);
        setLoading(false);
      } catch (error) {
        console.log("Error fetching favorite pokemons:", error);
        setLoading(false);
      }
    };

    fetchFavoritePokemons();
  }, [favoritePokemons]);

  const filteredPokemons = useMemo(() => {
    let pokemons = favoritePokemonData;

    if (selectedTypes.length > 0 || selectedGeneration) {
      pokemons = pokemons.filter((pokemon) => {
        // Type filter
        if (selectedTypes.length > 0) {
          const pokemonTypes = pokemon.types.map((type) => type.type.name);
          const matchesType = selectedTypes.some((selectedType) => pokemonTypes.includes(selectedType));
          if (!matchesType) return false;
        }
        
        // Generation filter
        if (selectedGeneration) {
          const genRanges = {
            1: { min: 1, max: 151 },
            2: { min: 152, max: 251 },
            3: { min: 252, max: 386 },
            4: { min: 387, max: 493 },
            5: { min: 494, max: 649 },
            6: { min: 650, max: 721 },
            7: { min: 722, max: 809 },
            8: { min: 810, max: 905 },
            9: { min: 906, max: 1025 }
          };
          const range = genRanges[selectedGeneration];
          if (range && (pokemon.id < range.min || pokemon.id > range.max)) {
            return false;
          }
        }
        
        return true;
      });
    }

    // Always sort by number
    return [...pokemons].sort((a, b) => a.id - b.id);
  }, [favoritePokemonData, selectedTypes, selectedGeneration]);

  const handleTypeToggle = (type) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSelectedGeneration(null);
  };

  return (
    <div>
      <Navbar />
      <div className="favorites-container">
        <div className="favorites-header">
          <h1 className="favorites-title">My Favorite Pokemon</h1>
          {favoritePokemons.length === 0 ? (
            <p className="favorites-empty-message">
              You haven't favorited any Pokemon yet. Start exploring and click the ❤️ to add favorites!
            </p>
          ) : (
            <p className="favorites-count">
              You have {favoritePokemons.length} favorite{favoritePokemons.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {favoritePokemons.length > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "0 20px", marginBottom: "10px" }}>
              {filteredPokemons.length > 0 && (
                <div className="results-count">
                  Showing {filteredPokemons.length} of {favoritePokemons.length} favorites
                </div>
              )}
            </div>
            <TypeFilter
              selectedTypes={selectedTypes}
              onTypeToggle={handleTypeToggle}
              onClearAll={handleClearFilters}
              selectedGeneration={selectedGeneration}
              onGenerationChange={setSelectedGeneration}
            />
          </>
        )}
        {loading ? (
          <div className="favorites-grid">
            {Array.from({ length: favoritePokemons.length || 6 }).map((_, index) => (
              <PokemonCardSkeleton key={index} />
            ))}
          </div>
        ) : favoritePokemons.length > 0 ? (
          filteredPokemons.length > 0 ? (
            <div className="favorites-grid">
              {filteredPokemons.map((pokemon, index) => (
                <Pokemon key={pokemon.id || index} pokemon={pokemon} />
              ))}
            </div>
          ) : (
            <div className="favorites-empty-action">
              <p className="favorites-empty-message">
                No favorites match the selected filters.
              </p>
              <button onClick={handleClearFilters} className="explore-button">
                Clear Filters
              </button>
            </div>
          )
        ) : (
          <div className="favorites-empty-action">
            <button onClick={() => navigate("/")} className="explore-button">
              Explore Pokemon
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;

