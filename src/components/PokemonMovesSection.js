import React, { useState } from "react";
import CollapsibleSection from "./CollapsibleSection";
import MovePickerModal from "./MovePickerModal";
import PokemonAbilityCards from "./PokemonAbilityCards";
import PokemonMovesBrowser from "./PokemonMovesBrowser";
import "./PokemonMovesSection.css";

const PokemonMovesSection = ({
  pokemon,
  abilities,
  abilityDescriptions,
  allMoves,
  moveDetails,
  isOnTeam,
  getMoveset,
  setMoveset,
  showToast,
}) => {
  const [hoveredMovesetMove, setHoveredMovesetMove] = useState(null);
  const [showMovePicker, setShowMovePicker] = useState(false);

  const formatMoveStats = (details) => {
    if (!details) {
      return null;
    }
    const parts = [];
    parts.push(details.power != null ? `${details.power} Pwr` : "—");
    parts.push(details.accuracy != null ? `${details.accuracy}%` : "—");
    parts.push(details.pp != null ? `${details.pp} PP` : "— PP");
    const damageClass = details.damageClass
      ? details.damageClass.replace(/-/g, " ")
      : "";
    if (damageClass) {
      parts.push(damageClass.charAt(0).toUpperCase() + damageClass.slice(1));
    }
    return parts.join(" · ");
  };

  return (
    <div className="pokemon-moves-sections">
      {abilities?.length > 0 && (
        <CollapsibleSection
          title="Abilities"
          summary={`${abilities.length} total`}
          defaultOpen
          className="pokemon-detail-collapsible card-surface"
        >
          <PokemonAbilityCards
            abilities={abilities}
            abilityDescriptions={abilityDescriptions}
          />
        </CollapsibleSection>
      )}

      {isOnTeam && pokemon.moves?.length > 0 && (
        <CollapsibleSection
          title="Your moveset"
          summary="4 moves for team"
          defaultOpen
          className="pokemon-detail-collapsible card-surface"
        >
          <div className="pokemon-detail-moveset-section">
            <p className="moveset-section-desc">Choose 4 moves for this Pokémon.</p>
            <div className="moveset-slots-display">
              {(() => {
                const current = getMoveset(pokemon.name);
                const padded = [...current, ...Array(4).fill("—")].slice(0, 4);
                return padded.map((moveName, slotIndex) => {
                  const details =
                    typeof moveName === "string" && moveName !== "—"
                      ? moveDetails[moveName]
                      : null;
                  const statsLine = formatMoveStats(details);
                  const isEmpty = typeof moveName !== "string" || moveName === "—";
                  return (
                    <span
                      key={slotIndex}
                      className="moveset-slot"
                      onMouseEnter={() => !isEmpty && setHoveredMovesetMove(moveName)}
                      onMouseLeave={() => setHoveredMovesetMove(null)}
                    >
                      <span className="moveset-slot-num">{slotIndex + 1}</span>
                      <span className="moveset-slot-move">
                        {!isEmpty ? moveName.replace(/-/g, " ") : moveName}
                      </span>
                      {statsLine && (
                        <span className="moveset-slot-stats">{statsLine}</span>
                      )}
                      {hoveredMovesetMove === moveName && details?.effect && (
                        <div className="moveset-slot-tooltip">
                          <p className="moveset-slot-tooltip-effect">{details.effect}</p>
                        </div>
                      )}
                    </span>
                  );
                });
              })()}
            </div>
            <button
              type="button"
              className="moveset-edit-btn"
              onClick={() => setShowMovePicker(true)}
            >
              Edit moves
            </button>
            {showMovePicker && (
              <MovePickerModal
                pokemon={pokemon}
                currentMoves={getMoveset(pokemon.name)}
                moveDetails={moveDetails}
                onSave={(savedMoves) => {
                  setMoveset(pokemon.name, savedMoves);
                  showToast("Moves saved");
                  setShowMovePicker(false);
                }}
                onClose={() => setShowMovePicker(false)}
              />
            )}
          </div>
        </CollapsibleSection>
      )}

      {allMoves.length > 0 && (
        <CollapsibleSection
          title={`Moves (${allMoves.length})`}
          summary="Search, filter, and browse learnset"
          defaultOpen={false}
          className="pokemon-detail-collapsible card-surface"
        >
          <PokemonMovesBrowser allMoves={allMoves} moveDetails={moveDetails} />
        </CollapsibleSection>
      )}
    </div>
  );
};

export default PokemonMovesSection;
