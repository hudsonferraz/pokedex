import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./components/Home";
import PokemonDetail from "./components/PokemonDetail";
import Favorites from "./components/Favorites";
import TeamBuilder from "./components/TeamBuilder";
import ScrollToTop from "./components/ScrollToTop";
import { FavoriteProvider } from "./contexts/favoritesContext";
import { TeamProvider } from "./contexts/TeamContext";
import { ToastProvider } from "./components/ToastProvider";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ComparisonProvider } from "./contexts/ComparisonContext";

const favoritesKey = "f";
const teamKey = "pokemon-team";

function App() {
  const [favorites, setFavorites] = useState([]);
  const [team, setTeam] = useState([]);

  const loadFavoritePokemons = () => {
    const pokemons =
      JSON.parse(window.localStorage.getItem(favoritesKey)) || [];
    setFavorites(pokemons);
  };

  const loadTeam = () => {
    try {
      const savedTeam = JSON.parse(window.localStorage.getItem(teamKey)) || [];
      setTeam(savedTeam);
    } catch (error) {
      console.debug("Error loading team:", error);
      setTeam([]);
    }
  };

  useEffect(() => {
    loadFavoritePokemons();
    loadTeam();
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

  const addToTeam = (pokemon) => {
    if (team.length >= 6) {
      return false;
    }
    const isAlreadyInTeam = team.some(p => p && p.name === pokemon.name);
    if (isAlreadyInTeam) {
      return false;
    }
    const updatedTeam = [...team, pokemon];
    setTeam(updatedTeam);
    window.localStorage.setItem(teamKey, JSON.stringify(updatedTeam));
    return true;
  };

  const removeFromTeam = (pokemonName) => {
    const updatedTeam = team.filter(p => p && p.name !== pokemonName);
    setTeam(updatedTeam);
    if (updatedTeam.length > 0) {
      window.localStorage.setItem(teamKey, JSON.stringify(updatedTeam));
    } else {
      window.localStorage.removeItem(teamKey);
    }
  };

  const clearTeam = () => {
    setTeam([]);
    window.localStorage.removeItem(teamKey);
  };

  const isInTeam = (pokemonName) => {
    return team.some(p => p && p.name === pokemonName);
  };

  const canAddToTeam = () => {
    return team.length < 6;
  };

  return (
    <ThemeProvider>
      <ComparisonProvider>
        <ToastProvider>
          <TeamProvider
            value={{
              team: team,
              addToTeam: addToTeam,
              removeFromTeam: removeFromTeam,
              clearTeam: clearTeam,
              isInTeam: isInTeam,
              canAddToTeam: canAddToTeam,
            }}
          >
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
                <Route path="/team-builder" element={<TeamBuilder />} />
              </Routes>
            </FavoriteProvider>
          </TeamProvider>
        </ToastProvider>
      </ComparisonProvider>
    </ThemeProvider>
  );
}

export default App;
