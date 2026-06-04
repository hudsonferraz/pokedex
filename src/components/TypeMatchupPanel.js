import React from "react";
import TypeCoverageBars from "./TypeCoverageBars";
import { getTypeColor } from "../constants/typeColors";
import "./TypeMatchupPanel.css";

const TypeMatchupPanel = ({
  title,
  offenseCoverage,
  pressureCoverage,
  superEffectiveTypes,
  defensiveWeaknesses,
  subtitle,
}) => {
  if (!offenseCoverage) return null;

  return (
    <div className="type-matchup-panel">
      <h4 className="type-matchup-panel-title">{title}</h4>
      {subtitle && <p className="type-matchup-panel-subtitle">{subtitle}</p>}

      {defensiveWeaknesses?.length > 0 && (
        <p className="type-matchup-weak">
          Shared 2× weaknesses: {defensiveWeaknesses.join(", ")}
        </p>
      )}

      {superEffectiveTypes?.length > 0 && (
        <div className="type-matchup-se-tags">
          {superEffectiveTypes.slice(0, 8).map((type) => (
            <span
              key={type}
              className="type-matchup-se-tag"
              style={{ backgroundColor: getTypeColor(type) }}
            >
              {type} 2×
            </span>
          ))}
        </div>
      )}

      <TypeCoverageBars coverage={pressureCoverage || offenseCoverage} />
    </div>
  );
};

export default TypeMatchupPanel;
