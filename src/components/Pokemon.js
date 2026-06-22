import React from "react";
import { useNavigate } from "react-router-dom";
import { getTypeColor } from "../constants/typeColors";
import { useRegulation } from "../contexts/RegulationContext";
import { formatSpeciesLabel, getSpeciesRegulationStatus } from "../utils/regulation";
import "./Pokemon.css";

const Pokemon = ({ pokemon, usagePercent, winRate, usageLabel }) => {
  const navigate = useNavigate();
  const { regulation } = useRegulation();
  const primaryType = pokemon.types[0]?.type.name || "normal";
  const accentColor = getTypeColor(primaryType);
  const { status, regulation: formatRegulation } = getSpeciesRegulationStatus(
    pokemon.name,
    regulation.id,
  );
  const isBanned = status === "banned";
  const isRestricted = status === "restricted";
  const isUnknown = status === "unknown";

  const onCardClick = () => {
    navigate(`/pokemon/${pokemon.name}`);
  };

  const artwork =
    pokemon.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon.sprites?.front_default;

  const regulationLabel = isBanned
    ? `Banned in ${formatRegulation.label}`
    : isRestricted
      ? `Restricted in ${formatRegulation.label}`
      : isUnknown
        ? `Legality unverified for ${formatRegulation.label}`
        : "";

  const cardClassName = [
    "pokemon-card-v2",
    "card-surface",
    isBanned ? "pokemon-card-v2--banned" : "",
    isRestricted ? "pokemon-card-v2--restricted" : "",
    isUnknown ? "pokemon-card-v2--unknown" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={cardClassName}
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
      aria-label={`View ${formatSpeciesLabel(pokemon.name)}, #${pokemon.id}${regulationLabel ? `, ${regulationLabel}` : ""}`}
      title={regulationLabel || undefined}
    >
      {(isBanned || isRestricted) && (
        <span
          className={`pokemon-card-v2-regulation-stamp${isBanned ? " banned" : " restricted"}`}
          aria-hidden="true"
        >
          {isBanned ? "Banned" : "Restricted"}
        </span>
      )}
      {isUnknown && (
        <span className="pokemon-card-v2-regulation-stamp unknown" aria-hidden="true">
          Unverified
        </span>
      )}
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
