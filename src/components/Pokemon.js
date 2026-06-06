import React from "react";
import { useNavigate } from "react-router-dom";
import { getTypeColor } from "../constants/typeColors";
import { formatSpeciesLabel } from "../utils/regulation";
import "./Pokemon.css";

const Pokemon = ({ pokemon, usagePercent, winRate, usageLabel }) => {
  const navigate = useNavigate();
  const primaryType = pokemon.types[0]?.type.name || "normal";
  const accentColor = getTypeColor(primaryType);

  const onCardClick = () => {
    navigate(`/pokemon/${pokemon.name}`);
  };

  const artwork =
    pokemon.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon.sprites?.front_default;

  return (
    <article
      className="pokemon-card-v2 card-surface"
      style={{ "--pokemon-accent": accentColor }}
      onClick={onCardClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onCardClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View ${formatSpeciesLabel(pokemon.name)}, #${pokemon.id}`}
    >
      {usagePercent != null && (
        <div className="pokemon-card-v2-meta">
          <span className="pokemon-card-v2-usage" title={usageLabel || "VGC usage"}>
            {usagePercent.toFixed(1)}%
          </span>
          {winRate != null && (
            <span className="pokemon-card-v2-wr" title="VGC win rate">
              {winRate.toFixed(1)}% WR
            </span>
          )}
        </div>
      )}

      <div className="pokemon-card-v2-art">
        <img
          src={artwork}
          alt=""
          className="pokemon-card-v2-image"
          loading="lazy"
        />
      </div>

      <div className="pokemon-card-v2-body">
        <div className="pokemon-card-v2-header">
          <h3 className="pokemon-card-v2-name">{formatSpeciesLabel(pokemon.name)}</h3>
          <span className="pokemon-card-v2-id">#{pokemon.id}</span>
        </div>
        <div className="pokemon-card-v2-types">
          {pokemon.types.map((typeEntry) => (
            <span
              key={typeEntry.type.name}
              className="pokemon-card-v2-type"
              style={{ backgroundColor: getTypeColor(typeEntry.type.name) }}
            >
              {typeEntry.type.name}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
};

export default Pokemon;
