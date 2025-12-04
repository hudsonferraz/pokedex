import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./components/Home";
import PokemonDetail from "./components/PokemonDetail";
import Favorites from "./components/Favorites";
import ScrollToTop from "./components/ScrollToTop";
import { FavoriteProvider } from "./contexts/favoritesContext";
import { ToastProvider } from "./components/ToastProvider";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ComparisonProvider } from "./contexts/ComparisonContext";

const favoritesKey = "f";

function App() {
  const [favorites, setFavorites] = useState([]);

  const loadFavoritePokemons = () => {
    const pokemons =
      JSON.parse(window.localStorage.getItem(favoritesKey)) || [];
    setFavorites(pokemons);
  };

  useEffect(() => {
    loadFavoritePokemons();
  }, []);

  const updateFavoritePokemons = (name) => {
    const updatedFavorites = [...favorites];
    const favoriteIndex = favorites.indexOf(name);
    if (favoriteIndex >= 0) {
      updatedFavorites.splice(favoriteIndex, 1);
    } else {
      updatedFavorites.push(name);
    }
    window.localStorage.setItem(favoritesKey, JSON.stringify(updatedFavorites));
    setFavorites(updatedFavorites);
  };

  return (
    <ThemeProvider>
      <ComparisonProvider>
        <ToastProvider>
          <FavoriteProvider
            value={{
              favoritePokemons: favorites,
              updateFavoritePokemons: updateFavoritePokemons,
            }}
          >
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/pokemon/:name" element={<PokemonDetail />} />
              <Route path="/favorites" element={<Favorites />} />
            </Routes>
          </FavoriteProvider>
        </ToastProvider>
      </ComparisonProvider>
    </ThemeProvider>
  );
}

export default App;
