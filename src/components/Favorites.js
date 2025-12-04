import React, { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { searchPokemon } from "../api";
import FavoriteContext from "../contexts/favoritesContext";
import Navbar from "./Navbar";
import Pokemon from "./Pokemon";
import PokemonCardSkeleton from "./PokemonCardSkeleton";
import SortOptions from "./SortOptions";
import TypeFilter from "./TypeFilter";
import "./Favorites.css";

const Favorites = () => {
  const navigate = useNavigate();
  const { favoritePokemons, updateFavoritePokemons } = useContext(FavoriteContext);
  const [favoritePokemonData, setFavoritePokemonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("number");
  const [selectedTypes, setSelectedTypes] = useState([]);

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

  const filteredAndSortedPokemons = useMemo(() => {
    let pokemons = favoritePokemonData;

    if (selectedTypes.length > 0) {
      pokemons = pokemons.filter((pokemon) => {
        const pokemonTypes = pokemon.types.map((type) => type.type.name);
        return selectedTypes.some((selectedType) => pokemonTypes.includes(selectedType));
      });
    }

    const sorted = [...pokemons].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "type":
          const aType = a.types[0]?.type.name || "";
          const bType = b.types[0]?.type.name || "";
          return aType.localeCompare(bType);
        case "number":
        default:
          return a.id - b.id;
      }
    });

    return sorted;
  }, [favoritePokemonData, selectedTypes, sortBy]);

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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", marginBottom: "10px" }}>
              <SortOptions sortBy={sortBy} onSortChange={setSortBy} />
              {filteredAndSortedPokemons.length > 0 && (
                <div className="results-count">
                  Showing {filteredAndSortedPokemons.length} of {favoritePokemons.length} favorites
                </div>
              )}
            </div>
            <TypeFilter
              selectedTypes={selectedTypes}
              onTypeToggle={handleTypeToggle}
              onClearAll={handleClearFilters}
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
          filteredAndSortedPokemons.length > 0 ? (
            <div className="favorites-grid">
              {filteredAndSortedPokemons.map((pokemon, index) => (
                <Pokemon key={pokemon.id || index} pokemon={pokemon} />
              ))}
            </div>
          ) : (
            <div className="favorites-empty-action">
              <p className="favorites-empty-message">
                No favorites match the selected type filter.
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

