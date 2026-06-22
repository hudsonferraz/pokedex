import React from "react";
import { getSpeciesRegulationStatus, formatSpeciesLabel, isRegulationLegalityVerified } from "../utils/regulation";
import "./PokemonRegulationChip.css";

const PokemonRegulationChip = ({ speciesName, regulationId }) => {
  const { status, regulation } = getSpeciesRegulationStatus(speciesName, regulationId);

  if (status === "legal") {
    return null;
  }

  if (status === "unknown") {
    if (isRegulationLegalityVerified(regulation)) {
      return null;
    }
    return (
      <span
        className="pokemon-regulation-chip unknown"
        title={`Bundled ${regulation.label} legality lists are unverified — confirm against official rules`}
      >
        Legality unverified · {regulation.label}
      </span>
    );
  }

  const isBanned = status === "banned";

  return (
    <span
      className={`pokemon-regulation-chip${isBanned ? " banned" : " restricted"}`}
      title={
        isBanned
          ? `${formatSpeciesLabel(speciesName)} is banned in ${regulation.label}`
          : `${formatSpeciesLabel(speciesName)} is Restricted in ${regulation.label} (max ${regulation.maxRestricted ?? 2} per team)`
      }
    >
      {isBanned ? "Banned" : "Restricted"} · {regulation.label}
    </span>
  );
};

export default PokemonRegulationChip;
