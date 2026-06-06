import React from "react";
import StatsRadarChart from "./StatsRadarChart";
import PokemonTypeProfile from "./PokemonTypeProfile";
import CollapsibleSection from "./CollapsibleSection";

const PokemonStatsSection = ({ pokemon, cardColor, formatStatName }) => {
  const totalStats = pokemon.stats.reduce(
    (sum, statEntry) => sum + statEntry.base_stat,
    0,
  );

  return (
    <CollapsibleSection
      title="Base stats & typing"
      summary={`BST ${totalStats}`}
      defaultOpen
      className="pokemon-detail-collapsible card-surface"
    >
      <div className="pokemon-detail-stats-section">
        <div className="stats-content">
          <div className="stats-radar-chart-container">
            <StatsRadarChart stats={pokemon.stats} color={cardColor} />
          </div>
          <div className="pokemon-stats-list">
            {pokemon.stats.map((statEntry) => (
              <div key={statEntry.stat.name} className="pokemon-stat-row">
                <span className="stat-name">
                  {formatStatName(statEntry.stat.name)}
                </span>
                <div className="stat-bar-container">
                  <div
                    className="stat-bar"
                    style={{
                      width: `${(statEntry.base_stat / 255) * 100}%`,
                      backgroundColor: cardColor,
                    }}
                  >
                    <span className="stat-value-number">{statEntry.base_stat}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pokemon-detail-type-profile-wrap">
          <h3 className="pokemon-detail-subheading">Defensive typing</h3>
          <PokemonTypeProfile pokemon={pokemon} />
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default PokemonStatsSection;
