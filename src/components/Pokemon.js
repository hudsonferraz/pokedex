import React from "react";
import { useNavigate } from "react-router-dom";
import { getTypeColor } from "../constants/typeColors";

const Pokemon = (props) => {
  const navigate = useNavigate();
  const { pokemon, usagePercent, usageLabel } = props;
  const onCardClick = () => {
    navigate(`/pokemon/${pokemon.name}`);
  };
  const primaryType = pokemon.types[0]?.type.name || "normal";
  const cardColor = getTypeColor(primaryType);

  return (
    <div
      className="pokemon-card"
      style={{ backgroundColor: cardColor }}
      onClick={onCardClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
      }}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${pokemon.name}, Pokemon number ${pokemon.id}`}
      onKeyPress={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCardClick();
        }
      }}
    >
      {usagePercent != null && (
        <span className="pokemon-usage-badge" title={usageLabel || "VGC usage"}>
          {usagePercent.toFixed(1)}%
        </span>
      )}
      <div className="pokemon-image-container">
        <img
          alt={pokemon.name}
          src={pokemon.sprites.front_default}
          className="pokemon-image"
          loading="lazy"
          onLoad={(e) => {
            e.target.style.opacity = "1";
          }}
          style={{ opacity: 0, transition: "opacity 0.3s ease" }}
        />
      </div>
      <div className="card-body">
        <div className="card-top">
          <h3> {pokemon.name}</h3>
          <div>#{pokemon.id}</div>
        </div>
        <div className="card-bottom">
          <div className="pokemon-type">
            {pokemon.types.map((type, index) => (
              <div key={index} className="pokemon-type-text">
                {type.type.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pokemon;
