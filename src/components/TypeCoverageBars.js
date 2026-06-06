import React from "react";
import {
  ALL_POKEMON_TYPES,
  getTypeColor,
  getCoverageAccessibilityLabel,
} from "../constants/typeColors";
import "./TypeCoverageBars.css";

const coverageLevel = (value) => {
  if (value === "super-effective") return 2;
  if (value === "effective") return 1;
  if (value === "no-effect") return 0;
  return 0.5;
};

const TypeCoverageBars = ({ coverage, compact = false }) => (
  <div
    className={`type-coverage-bars ${compact ? "compact" : ""}`}
    role="img"
    aria-label="Team offensive type coverage by defending type"
  >
    {ALL_POKEMON_TYPES.map((type) => {
      const value = coverage[type] || "not-very-effective";
      const level = coverageLevel(value);
      const widthPercent = level === 2 ? 100 : level === 1 ? 66 : level === 0.5 ? 33 : 8;
      const ariaLabel = getCoverageAccessibilityLabel(type, value);

      return (
        <div
          key={type}
          className="coverage-bar-row"
          title={ariaLabel}
          aria-label={ariaLabel}
        >
          <span className="coverage-bar-label">{type}</span>
          <div className="coverage-bar-track" role="presentation" aria-hidden="true">
            <div
              className={`coverage-bar-fill level-${value.replace(/-/g, "_")}`}
              style={{
                width: `${widthPercent}%`,
                backgroundColor: getTypeColor(type),
              }}
            />
          </div>
          <span className="coverage-bar-multiplier" aria-hidden="true">
            {value === "super-effective"
              ? "2×"
              : value === "effective"
                ? "1×"
                : value === "no-effect"
                  ? "0×"
                  : "0.5×"}
          </span>
        </div>
      );
    })}
  </div>
);

export default TypeCoverageBars;
