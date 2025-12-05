import React from "react";
import { getTeamWeaknesses, getTeamTypeCoverage, getTeamStats, getUniqueTypes } from "../utils/teamAnalysis";
import "./TeamAnalysis.css";

const getTypeColor = (typeName) => {
  const typeColors = {
    normal: "#A8A878", fire: "#F08030", water: "#6890F0", electric: "#F8D030", grass: "#78C850", ice: "#98D8D8",
    fighting: "#C03028", poison: "#A040A0", ground: "#E0C068", flying: "#A890F0", psychic: "#F85888", bug: "#A8B820",
    rock: "#B8A038", ghost: "#705898", dragon: "#7038F8", dark: "#705848", steel: "#B8B8D0", fairy: "#EE99AC",
  };
  return typeColors[typeName] || "#A8A878";
};

const TeamAnalysis = ({ team }) => {
  if (!team || team.length === 0) {
    return (
      <div className="team-analysis-empty">
        <p>Add Pokemon to your team to see analysis</p>
      </div>
    );
  }

  const weaknesses = getTeamWeaknesses(team);
  const coverage = getTeamTypeCoverage(team);
  const stats = getTeamStats(team);
  const uniqueTypes = getUniqueTypes(team);

  const superEffectiveWeaknesses = Object.entries(weaknesses)
    .filter(([_, value]) => value === "super-effective")
    .map(([type]) => type);

  const resistantTypes = Object.entries(weaknesses)
    .filter(([_, value]) => value === "resistant" || value === "immune")
    .map(([type]) => type);

  const superEffectiveCoverage = Object.entries(coverage)
    .filter(([_, value]) => value === "super-effective")
    .map(([type]) => type);

  const allTypes = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];

  return (
    <div className="team-analysis">
      <h2 className="team-analysis-title">Team Analysis</h2>
      
      <div className="analysis-section">
        <h3>Team Composition</h3>
        <div className="team-types-display">
          {uniqueTypes.map(type => (
            <span 
              key={type}
              className="type-badge"
              style={{ backgroundColor: getTypeColor(type) }}
            >
              {type}
            </span>
          ))}
        </div>
        <p className="analysis-note">{team.length}/6 Pokemon</p>
      </div>

      <div className="analysis-section">
        <h3>Average Base Stats</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">HP</span>
            <span className="stat-value">{stats.hp}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Attack</span>
            <span className="stat-value">{stats.attack}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Defense</span>
            <span className="stat-value">{stats.defense}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Sp. Atk</span>
            <span className="stat-value">{stats["special-attack"]}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Sp. Def</span>
            <span className="stat-value">{stats["special-defense"]}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Speed</span>
            <span className="stat-value">{stats.speed}</span>
          </div>
        </div>
      </div>

      <div className="analysis-section">
        <h3>Team Weaknesses</h3>
        {superEffectiveWeaknesses.length > 0 ? (
          <div className="weakness-list">
            {superEffectiveWeaknesses.map(type => (
              <span 
                key={type}
                className="weakness-badge critical"
                style={{ backgroundColor: getTypeColor(type) }}
              >
                {type} (2×)
              </span>
            ))}
          </div>
        ) : (
          <p className="analysis-note positive">No critical weaknesses!</p>
        )}
      </div>

      <div className="analysis-section">
        <h3>Type Resistances</h3>
        {resistantTypes.length > 0 ? (
          <div className="weakness-list">
            {resistantTypes.map(type => (
              <span 
                key={type}
                className="weakness-badge positive"
                style={{ backgroundColor: getTypeColor(type) }}
              >
                {type}
              </span>
            ))}
          </div>
        ) : (
          <p className="analysis-note">No notable resistances</p>
        )}
      </div>

      <div className="analysis-section">
        <h3>Type Coverage</h3>
        <p className="analysis-note">
          Super-effective against: {superEffectiveCoverage.length}/18 types
        </p>
        <div className="coverage-grid">
          {allTypes.map(type => {
            const coverageValue = coverage[type];
            const coverageClass = coverageValue === "super-effective" ? "super" :
                                 coverageValue === "effective" ? "effective" :
                                 coverageValue === "no-effect" ? "no-effect" : "not-very";
            return (
              <div 
                key={type}
                className={`coverage-item ${coverageClass}`}
                style={{ borderColor: getTypeColor(type) }}
                title={`${type}: ${coverageValue}`}
              >
                <span className="coverage-type-name">{type}</span>
                <span className="coverage-indicator">
                  {coverageValue === "super-effective" ? "2×" :
                   coverageValue === "effective" ? "1×" :
                   coverageValue === "no-effect" ? "0×" : "0.5×"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TeamAnalysis;

