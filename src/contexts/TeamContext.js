import React from "react";

const TeamContext = React.createContext({
  team: [],
  addToTeam: (pokemon) => null,
  removeFromTeam: (pokemonName) => null,
  clearTeam: () => null,
  isInTeam: (pokemonName) => false,
  canAddToTeam: () => false,
});

export const TeamProvider = TeamContext.Provider;

export default TeamContext;

