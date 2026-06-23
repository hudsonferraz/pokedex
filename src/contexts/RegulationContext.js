import React from "react";
import TeamContext from "./TeamContext";
import {
  DEFAULT_REGULATION_ID,
  getRegulationById,
  getStoredRegulationId,
  setStoredRegulationId,
  REGULATIONS,
  validateTeamForRegulation,
  normalizeRegulationId,
} from "../utils/regulation";

const RegulationContext = React.createContext({
  regulationId: DEFAULT_REGULATION_ID,
  regulation: getRegulationById(DEFAULT_REGULATION_ID),
  setRegulationId: () => null,
  validateTeam: () => ({ issues: [], warnings: [] }),
});

export function RegulationProvider({ children }) {
  const { activeTeam, setTeamRegulationId } = React.useContext(TeamContext);
  const [browseRegulationId, setBrowseRegulationId] = React.useState(getStoredRegulationId);

  const regulationId = activeTeam?.regulationId || browseRegulationId;

  const setRegulationId = React.useCallback(
    (id) => {
      const normalizedId = normalizeRegulationId(id);
      if (activeTeam) {
        setTeamRegulationId(normalizedId);
      }
      setBrowseRegulationId(normalizedId);
      setStoredRegulationId(normalizedId);
    },
    [activeTeam, setTeamRegulationId],
  );

  const regulation = getRegulationById(regulationId);

  const validateTeam = React.useCallback(
    (team, options = {}) =>
      validateTeamForRegulation(team, regulationId, {
        sets: options.sets,
      }),
    [regulationId],
  );

  const value = {
    regulationId,
    regulation,
    regulations: REGULATIONS,
    setRegulationId,
    validateTeam,
    isTeamRegulation: Boolean(activeTeam?.regulationId),
  };

  return (
    <RegulationContext.Provider value={value}>{children}</RegulationContext.Provider>
  );
}

export function useRegulation() {
  return React.useContext(RegulationContext);
}

export default RegulationContext;
