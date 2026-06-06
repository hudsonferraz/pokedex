import React, { useState } from "react";
import { getTypeColor } from "../constants/typeColors";
import CollapsibleSection from "./CollapsibleSection";
import MovePickerModal from "./MovePickerModal";

const PokemonMovesSection = ({
  pokemon,
  abilities,
  abilityDescriptions,
  allMoves,
  moves,
  moveDetails,
  showAllMoves,
  onToggleShowAllMoves,
  isOnTeam,
  getMoveset,
  setMoveset,
  showToast,
}) => {
  const [hoveredAbility, setHoveredAbility] = useState(null);
  const [hoveredMove, setHoveredMove] = useState(null);
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

  const displayedMoves = showAllMoves ? allMoves : moves;

  return (
    <div className="pokemon-moves-sections">
      {abilities?.length > 0 && (
        <CollapsibleSection
          title="Abilities"
          summary={`${abilities.length} total`}
          defaultOpen
          className="pokemon-detail-collapsible card-surface"
        >
          <div className="pokemon-detail-abilities">
            <div className="abilities-list">
              {abilities.map((ability) => {
                const abilityName = ability.ability.name;
                const description = abilityDescriptions[abilityName];
                return (
                  <div
                    key={abilityName}
                    className="ability-badge-container"
                    onMouseEnter={() => setHoveredAbility(abilityName)}
                    onMouseLeave={() => setHoveredAbility(null)}
                    onFocus={() => setHoveredAbility(abilityName)}
                    onBlur={() => setHoveredAbility(null)}
                    tabIndex={0}
                  >
                    <span className="ability-badge">
                      {abilityName.replace(/-/g, " ")}
                      {ability.is_hidden && (
                        <span className="hidden-indicator"> (Hidden)</span>
                      )}
                    </span>
                    {hoveredAbility === abilityName && description && (
                      <div className="ability-tooltip">
                        <h4 className="ability-tooltip-title">
                          {abilityName.replace(/-/g, " ")}
                        </h4>
                        <p className="ability-tooltip-description">{description}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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
          summary={showAllMoves ? "Full learnset" : "Top 20 shown"}
          defaultOpen={false}
          className="pokemon-detail-collapsible card-surface"
        >
          <div className="pokemon-detail-moves">
            {allMoves.length > 20 && (
              <div className="moves-header">
                <button
                  type="button"
                  onClick={onToggleShowAllMoves}
                  className="show-all-moves-btn"
                >
                  {showAllMoves ? "Show less" : `Show all (${allMoves.length})`}
                </button>
              </div>
            )}
            <div className="moves-list">
              {displayedMoves.map((move) => {
                const details = moveDetails[move.name] || move;
                return (
                  <div
                    key={move.name}
                    className="move-badge-container"
                    onMouseEnter={() => setHoveredMove(move.name)}
                    onMouseLeave={() => setHoveredMove(null)}
                    onFocus={() => setHoveredMove(move.name)}
                    onBlur={() => setHoveredMove(null)}
                    tabIndex={0}
                  >
                    <span
                      className="move-badge"
                      style={{ backgroundColor: getTypeColor(move.type) }}
                    >
                      {move.name.replace(/-/g, " ")}
                      {move.level > 0 && (
                        <span className="move-level"> (Lv. {move.level})</span>
                      )}
                    </span>
                    {hoveredMove === move.name && details && (
                      <div className="move-tooltip">
                        <h4 className="move-tooltip-title">
                          {details.name?.replace(/-/g, " ") || move.name}
                        </h4>
                        <div className="move-tooltip-details">
                          <span
                            className="move-tooltip-type"
                            style={{ backgroundColor: getTypeColor(details.type) }}
                          >
                            {details.type}
                          </span>
                          {details.power !== null && (
                            <span className="move-tooltip-stat">
                              Power: {details.power}
                            </span>
                          )}
                          {details.accuracy !== null && (
                            <span className="move-tooltip-stat">
                              Accuracy: {details.accuracy}%
                            </span>
                          )}
                          {details.pp !== null && (
                            <span className="move-tooltip-stat">PP: {details.pp}</span>
                          )}
                          {details.damageClass && (
                            <span className="move-tooltip-stat">
                              Class: {details.damageClass}
                            </span>
                          )}
                        </div>
                        {details.effect && (
                          <p className="move-tooltip-effect">{details.effect}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
};

export default PokemonMovesSection;
