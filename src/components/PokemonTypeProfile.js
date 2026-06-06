import React from "react";
import {
  getDefensiveTypeProfile,
  getDefensiveWeaknesses,
  getDefensiveResistances,
} from "../utils/teamAnalysis";
import TypeCoverageBars from "./TypeCoverageBars";
import "./PokemonTypeProfile.css";

const PokemonTypeProfile = ({ pokemon }) => {
  if (!pokemon?.types?.length) {
    return null;
  }

  const profile = getDefensiveTypeProfile(pokemon);
  const weaknesses = getDefensiveWeaknesses(pokemon);
  const resistances = getDefensiveResistances(pokemon);

  return (
    <div className="pokemon-type-profile">
      <div className="pokemon-type-profile-summary">
        {weaknesses.length > 0 && (
          <p className="pokemon-type-profile-line">
            <strong>Weak to (2×):</strong>{" "}
            <span className="pokemon-type-profile-weak">{weaknesses.join(", ")}</span>
          </p>
        )}
        {resistances.length > 0 && (
          <p className="pokemon-type-profile-line">
            <strong>Resists (0.5×):</strong>{" "}
            <span className="pokemon-type-profile-resist">{resistances.join(", ")}</span>
          </p>
        )}
      </div>
      <TypeCoverageBars
        coverage={profile}
        compact
        accessibilityLabel={`Defensive type profile for ${pokemon.name}`}
      />
    </div>
  );
};

export default PokemonTypeProfile;
