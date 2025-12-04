import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { searchPokemon } from "../api";
import FavoriteContext from "../contexts/favoritesContext";
import Navbar from "./Navbar";
import Pokemon from "./Pokemon";
import "./Favorites.css";

const Favorites = () => {
  const navigate = useNavigate();
  const { favoritePokemons, updateFavoritePokemons } = useContext(FavoriteContext);
  const [favoritePokemonData, setFavoritePokemonData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="favorites-loading">Loading your favorites...</div>
      </div>
    );
  }

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
          <div className="favorites-grid">
            {favoritePokemonData.map((pokemon, index) => (
              <Pokemon key={pokemon.id || index} pokemon={pokemon} />
            ))}
          </div>
        )}
        {favoritePokemons.length === 0 && (
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

