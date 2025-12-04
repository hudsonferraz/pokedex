import React, { createContext, useContext, useState } from "react";

const ComparisonContext = createContext();

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useComparison must be used within ComparisonProvider");
  }
  return context;
};

export const ComparisonProvider = ({ children }) => {
  const [comparisonPokemon, setComparisonPokemon] = useState([]);

  const addToComparison = (pokemonName) => {
    setComparisonPokemon((prev) => {
      if (prev.includes(pokemonName)) {
        return prev.filter((name) => name !== pokemonName);
      }
      if (prev.length >= 2) {
        return [prev[1], pokemonName];
      }
      return [...prev, pokemonName];
    });
  };

  const clearComparison = () => {
    setComparisonPokemon([]);
  };

  return (
    <ComparisonContext.Provider value={{ comparisonPokemon, addToComparison, clearComparison }}>
      {children}
    </ComparisonContext.Provider>
  );
};

