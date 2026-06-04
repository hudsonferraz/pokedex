import React from "react";
import { useNavigate } from "react-router-dom";
import { getTypeColor, TEAM_ROLE_OPTIONS } from "../constants/typeColors";
import "./TeamSlot.css";

const displayMove = (name) => (name || "").replace(/-/g, " ");

const TeamSlot = ({
  pokemon,
  slotNumber,
  selectedMoves,
  role,
  onRoleChange,
  onRemove,
  onAdd,
  onEditMoves,
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (pokemon) {
      navigate(`/pokemon/${pokemon.name}`);
    }
  };

  if (pokemon) {
    const primaryType = pokemon.types[0]?.type.name || "normal";
    const cardColor = getTypeColor(primaryType);
    const movesToShow =
      Array.isArray(selectedMoves) && selectedMoves.length > 0
        ? selectedMoves
        : (pokemon.moves || []).slice(0, 4).map((move) => move.move.name);
    const movesLine = movesToShow.map(displayMove).join(" · ");

    return (
      <div
        className="team-slot filled team-slot-filled-animate"
        style={{ borderColor: cardColor }}
        onClick={handleCardClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleCardClick();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`${pokemon.name}, slot ${slotNumber}`}
      >
        <button
          type="button"
          className="remove-pokemon-btn"
          onClick={(event) => {
            event.stopPropagation();
            onRemove(pokemon.name);
          }}
          aria-label={`Remove ${pokemon.name}`}
        >
          ×
        </button>
        <img
          src={
            pokemon.sprites?.other?.["official-artwork"]?.front_default ||
            pokemon.sprites?.front_default
          }
          alt=""
          className="team-slot-sprite"
        />
        <h3 className="team-slot-name">{pokemon.name}</h3>
        <div className="team-slot-types">
          {pokemon.types.map((type, index) => (
            <span
              key={index}
              className="team-slot-type"
              style={{ backgroundColor: getTypeColor(type.type.name) }}
            >
              {type.type.name}
            </span>
          ))}
        </div>
        <select
          className="team-slot-role"
          value={role || ""}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            event.stopPropagation();
            onRoleChange(pokemon.name, event.target.value);
          }}
          aria-label={`Role for ${pokemon.name}`}
        >
          {TEAM_ROLE_OPTIONS.map((option) => (
            <option key={option.value || "none"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="team-slot-moves-row">
          {movesLine ? (
            <>
              <p className="team-slot-moves-line" title={movesLine}>
                {movesLine}
              </p>
              <button
                type="button"
                className="team-slot-edit-moves"
                onClick={(event) => {
                  event.stopPropagation();
                  onEditMoves(pokemon);
                }}
              >
                Edit moves
              </button>
            </>
          ) : (
            <span className="team-slot-no-moves">No move data</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="team-slot empty"
      onClick={onAdd}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onAdd();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Add Pokémon to slot ${slotNumber}`}
    >
      <div className="empty-slot-content">
        <span className="empty-slot-icon">+</span>
        <span className="empty-slot-text">Add Pokémon</span>
        <span className="empty-slot-number">Slot {slotNumber}</span>
      </div>
    </div>
  );
};

export default TeamSlot;
