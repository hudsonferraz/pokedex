import React from "react";
import { useNavigate } from "react-router-dom";
import "./TeamSlot.css";

const getTypeColor = (typeName) => {
  const typeColors = {
    normal: "#A8A878", fire: "#F08030", water: "#6890F0", electric: "#F8D030", grass: "#78C850", ice: "#98D8D8",
    fighting: "#C03028", poison: "#A040A0", ground: "#E0C068", flying: "#A890F0", psychic: "#F85888", bug: "#A8B820",
    rock: "#B8A038", ghost: "#705898", dragon: "#7038F8", dark: "#705848", steel: "#B8B8D0", fairy: "#EE99AC",
  };
  return typeColors[typeName] || "#A8A878";
};

const TeamSlot = ({ pokemon, slotNumber, selectedMoves, onRemove, onAdd, onEditMoves }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (pokemon) {
      navigate(`/pokemon/${pokemon.name}`);
    }
  };

  const displayMove = (name) => (name || "").replace(/-/g, " ");

  if (pokemon) {
    const primaryType = pokemon.types[0]?.type.name || "normal";
    const cardColor = getTypeColor(primaryType);
    const movesToShow = Array.isArray(selectedMoves) && selectedMoves.length > 0
      ? selectedMoves
      : (pokemon.moves || []).slice(0, 4).map((m) => m.move.name);

    return (
      <div 
        className="team-slot filled"
        style={{ borderColor: cardColor }}
        onClick={handleCardClick}
      >
        <button 
          className="remove-pokemon-btn"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(pokemon.name);
          }}
          aria-label="Remove Pokemon"
        >
          ×
        </button>
        <img 
          src={pokemon.sprites?.other?.["official-artwork"]?.front_default || pokemon.sprites?.front_default}
          alt={pokemon.name}
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
        <div className="team-slot-moves-row">
          {pokemon.moves && pokemon.moves.length > 0 ? (
            <>
              <div className="team-slot-moves" title="Moveset">
                {movesToShow.map((name, i) => (
                  <span key={name || i} className="team-slot-move">{displayMove(name)}</span>
                ))}
              </div>
              <button
                type="button"
                className="team-slot-edit-moves"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditMoves(pokemon);
                }}
                title="Select 4 moves"
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
    <div className="team-slot empty" onClick={onAdd}>
      <div className="empty-slot-content">
        <span className="empty-slot-icon">+</span>
        <span className="empty-slot-text">Add Pokemon</span>
        <span className="empty-slot-number">Slot {slotNumber}</span>
      </div>
    </div>
  );
};

export default TeamSlot;

