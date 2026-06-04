import React from "react";
import "./BringFourPreview.css";

const BringFourPreview = ({ team, bringList, onToggle }) => {
  if (!team || team.length < 6) return null;

  const selectedCount = bringList.length;

  return (
    <section className="bring-four card-surface" aria-labelledby="bring-four-title">
      <div className="bring-four-header">
        <h2 id="bring-four-title">Bring 4 preview</h2>
        <p className="bring-four-copy">
          In VGC you register six Pokémon but only bring four to each game. Select your preview
          roster ({selectedCount}/4).
        </p>
      </div>
      <div className="bring-four-grid">
        {team.map((pokemon) => {
          if (!pokemon) return null;
          const isSelected = bringList.includes(pokemon.name);
          const isDisabled = !isSelected && selectedCount >= 4;
          return (
            <label
              key={pokemon.name}
              className={`bring-four-slot ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => onToggle(pokemon.name)}
              />
              <img
                src={
                  pokemon.sprites?.other?.["official-artwork"]?.front_default ||
                  pokemon.sprites?.front_default
                }
                alt=""
                className="bring-four-sprite"
              />
              <span className="bring-four-name">{pokemon.name}</span>
            </label>
          );
        })}
      </div>
      {selectedCount < 4 && (
        <p className="bring-four-hint">Select {4 - selectedCount} more for a full preview.</p>
      )}
    </section>
  );
};

export default BringFourPreview;
