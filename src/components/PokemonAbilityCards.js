import React, { useState } from "react";
import {
  formatAbilityLabel,
  isMetaVgcAbility,
} from "../utils/vgcAbilities";
import "./PokemonAbilityCards.css";

const PokemonAbilityCards = ({ abilities, abilityDescriptions }) => {
  const [expandedAbility, setExpandedAbility] = useState(null);

  if (!abilities?.length) {
    return null;
  }

  const toggleAbility = (abilityName) => {
    setExpandedAbility((current) => (current === abilityName ? null : abilityName));
  };

  return (
    <div className="pokemon-ability-cards">
      {abilities.map((ability) => {
        const abilityName = ability.ability.name;
        const description = abilityDescriptions[abilityName];
        const isExpanded = expandedAbility === abilityName;
        const isMeta = isMetaVgcAbility(abilityName);
        const panelId = `ability-panel-${abilityName}`;

        return (
          <div
            key={abilityName}
            className={`pokemon-ability-card${isExpanded ? " expanded" : ""}`}
          >
            <button
              type="button"
              className="pokemon-ability-card-trigger"
              aria-expanded={isExpanded}
              aria-controls={panelId}
              onClick={() => toggleAbility(abilityName)}
            >
              <span className="pokemon-ability-card-heading">
                <span className="pokemon-ability-card-name">
                  {formatAbilityLabel(abilityName)}
                </span>
                {ability.is_hidden && (
                  <span className="pokemon-ability-hidden-tag">Hidden</span>
                )}
                {isMeta && (
                  <span className="pokemon-ability-meta-tag">VGC meta</span>
                )}
              </span>
              <span className="pokemon-ability-card-chevron" aria-hidden>
                {isExpanded ? "▾" : "▸"}
              </span>
            </button>
            {isExpanded && description && (
              <div id={panelId} className="pokemon-ability-card-panel" role="region">
                <p className="pokemon-ability-card-description">{description}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PokemonAbilityCards;
