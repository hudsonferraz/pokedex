import React from "react";
import {
  DEFAULT_REGULATION_ID,
  getRegulationById,
  getStoredRegulationId,
  setStoredRegulationId,
  REGULATIONS,
  validateTeamForRegulation,
} from "../utils/regulation";

const RegulationContext = React.createContext({
  regulationId: DEFAULT_REGULATION_ID,
  regulation: getRegulationById(DEFAULT_REGULATION_ID),
  setRegulationId: () => null,
  validateTeam: () => ({ issues: [], warnings: [] }),
});

export function RegulationProvider({ children }) {
  const [regulationId, setRegulationIdState] = React.useState(getStoredRegulationId);

  const setRegulationId = React.useCallback((id) => {
    setRegulationIdState(id);
    setStoredRegulationId(id);
  }, []);

  const regulation = getRegulationById(regulationId);

  const validateTeam = React.useCallback(
    (team) => validateTeamForRegulation(team, regulationId),
    [regulationId],
  );

  const value = {
    regulationId,
    regulation,
    regulations: REGULATIONS,
    setRegulationId,
    validateTeam,
  };

  return (
    <RegulationContext.Provider value={value}>{children}</RegulationContext.Provider>
  );
}

export function useRegulation() {
  return React.useContext(RegulationContext);
}

export default RegulationContext;
