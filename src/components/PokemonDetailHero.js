import React from "react";
import { useRegulation } from "../contexts/RegulationContext";
import { getTypeColor } from "../constants/typeColors";
import { formatSpeciesLabel } from "../utils/regulation";
import VgcMetaStats from "./VgcMetaStats";
import PokemonRegulationChip from "./PokemonRegulationChip";
import "./PokemonDetailHero.css";

const PokemonDetailHero = ({
  pokemon,
  cardColor,
  pokemonForms,
  currentFormIndex,
  onFormChange,
  pokemonDescription,
  formatHeight,
  formatWeight,
  isInTeam,
  canAddToTeam,
  comparisonPokemon,
  currentSet,
  applyingMeta,
  onAddToTeam,
  onEditSet,
  onCompare,
  onShare,
  onApplyMetaSet,
  onApplySpread,
  onDamageCalcCopied,
}) => {
  const { regulation } = useRegulation();
  const artwork =
    pokemon.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon.sprites?.front_default;

  const inComparison = comparisonPokemon.includes(pokemon.name);
  const onTeam = isInTeam(pokemon.name);
  const teamFull = !canAddToTeam() && !onTeam;

  return (
    <section
      className="pokemon-detail-hero card-surface"
      style={{ "--pokemon-accent": cardColor }}
      aria-label={`${formatSpeciesLabel(pokemon.name)} overview`}
    >
      <div className="pokemon-detail-hero-grid">
        <div className="pokemon-detail-hero-visual">
          <img
            src={artwork}
            alt={formatSpeciesLabel(pokemon.name)}
            className="pokemon-detail-hero-art"
            loading="eager"
          />
          <div className="pokemon-detail-hero-types">
            {pokemon.types.map((typeEntry) => (
              <span
                key={typeEntry.type.name}
                className="pokemon-detail-type-badge"
                style={{ backgroundColor: getTypeColor(typeEntry.type.name) }}
              >
                {typeEntry.type.name}
              </span>
            ))}
          </div>
        </div>

        <div className="pokemon-detail-hero-content">
          <div className="pokemon-detail-hero-heading">
            <div className="pokemon-detail-name-container">
              {pokemonForms.length > 1 && (
                <button
                  type="button"
                  className="form-nav-btn form-nav-prev"
                  onClick={() => onFormChange("prev")}
                  aria-label="Previous form"
                >
                  ‹
                </button>
              )}
              <div className="pokemon-name-wrapper">
                <h1 className="pokemon-detail-name">
                  {formatSpeciesLabel(pokemon.name)}
                </h1>
                {pokemonForms.length > 1 && (
                  <span className="form-indicator">
                    Form {currentFormIndex + 1}/{pokemonForms.length}
                  </span>
                )}
              </div>
              {pokemonForms.length > 1 && (
                <button
                  type="button"
                  className="form-nav-btn form-nav-next"
                  onClick={() => onFormChange("next")}
                  aria-label="Next form"
                >
                  ›
                </button>
              )}
            </div>
            <span className="pokemon-detail-id">#{pokemon.id}</span>
            <PokemonRegulationChip
              speciesName={pokemon.name}
              regulationId={regulation.id}
            />
          </div>

          <VgcMetaStats
            speciesName={pokemon.name}
            pokemon={pokemon}
            currentSet={currentSet}
            isInTeam={onTeam}
            onApplySpread={onApplySpread}
            onDamageCalcCopied={onDamageCalcCopied}
          />

          <div className="pokemon-detail-sticky-actions" role="toolbar" aria-label="Pokémon actions">
            {onTeam ? (
              <button
                type="button"
                className="pokemon-detail-action-btn team-action-btn active"
                onClick={onEditSet}
              >
                Edit set
              </button>
            ) : (
              <button
                type="button"
                className="pokemon-detail-action-btn team-action-btn"
                onClick={onAddToTeam}
                disabled={teamFull}
              >
                Add to team
              </button>
            )}
            <button
              type="button"
              className="pokemon-detail-action-btn meta-action-btn"
              onClick={onApplyMetaSet}
              disabled={applyingMeta}
            >
              {applyingMeta ? "Applying…" : "Apply meta set"}
            </button>
            <button
              type="button"
              className={`pokemon-detail-action-btn compare-action-btn${inComparison ? " active" : ""}`}
              onClick={onCompare}
            >
              Compare
            </button>
            <button
              type="button"
              className="pokemon-detail-action-btn share-action-btn"
              onClick={onShare}
            >
              Share
            </button>
          </div>

          <div className="pokemon-detail-stats-grid">
            <div className="pokemon-detail-stat">
              <span className="stat-label">Height</span>
              <span className="stat-value">{formatHeight(pokemon.height)}</span>
            </div>
            <div className="pokemon-detail-stat">
              <span className="stat-label">Weight</span>
              <span className="stat-value">{formatWeight(pokemon.weight)}</span>
            </div>
            <div className="pokemon-detail-stat">
              <span className="stat-label">Base EXP</span>
              <span className="stat-value">{pokemon.base_experience}</span>
            </div>
          </div>

          {pokemonDescription && (
            <div
              className="pokemon-description-box"
              style={{ borderLeftColor: cardColor }}
            >
              <h2 className="description-title">Description</h2>
              <p className="description-text">{pokemonDescription}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PokemonDetailHero;
