import React from "react";
import { useNavigate } from "react-router-dom";
import CollapsibleSection from "./CollapsibleSection";

const PokemonEvolutionSection = ({
  pokemon,
  evolutionChain,
}) => {
  const navigate = useNavigate();
  const hasSprites =
    pokemon.sprites?.front_default ||
    pokemon.sprites?.back_default ||
    pokemon.sprites?.front_shiny ||
    pokemon.sprites?.back_shiny;
  const hasEvolution = evolutionChain.length > 1;

  if (!hasSprites && !hasEvolution) {
    return null;
  }

  const summaryParts = [];
  if (hasEvolution) {
    summaryParts.push(`${evolutionChain.length} stages`);
  }
  if (hasSprites) {
    summaryParts.push("sprites");
  }

  return (
    <CollapsibleSection
      title="Sprites & evolution"
      summary={summaryParts.join(" · ")}
      defaultOpen={false}
      className="pokemon-detail-collapsible card-surface"
    >
      <div className="pokemon-evolution-section">
        {hasSprites && (
          <div className="pokemon-sprites-comparison">
            <div className="sprite-group">
              <h3 className="sprite-label">Original</h3>
              <div className="sprite-pair">
                {pokemon.sprites.front_default && (
                  <div className="sprite-item">
                    <img
                      src={pokemon.sprites.front_default}
                      alt="Front sprite"
                      className="pokemon-sprite"
                      loading="lazy"
                    />
                    <span className="sprite-caption">Front</span>
                  </div>
                )}
                {pokemon.sprites.back_default && (
                  <div className="sprite-item">
                    <img
                      src={pokemon.sprites.back_default}
                      alt="Back sprite"
                      className="pokemon-sprite"
                      loading="lazy"
                    />
                    <span className="sprite-caption">Back</span>
                  </div>
                )}
              </div>
            </div>
            <div className="sprite-group">
              <h3 className="sprite-label">Shiny</h3>
              <div className="sprite-pair">
                {pokemon.sprites.front_shiny && (
                  <div className="sprite-item">
                    <img
                      src={pokemon.sprites.front_shiny}
                      alt="Front shiny sprite"
                      className="pokemon-sprite"
                      loading="lazy"
                    />
                    <span className="sprite-caption">Front</span>
                  </div>
                )}
                {pokemon.sprites.back_shiny && (
                  <div className="sprite-item">
                    <img
                      src={pokemon.sprites.back_shiny}
                      alt="Back shiny sprite"
                      className="pokemon-sprite"
                      loading="lazy"
                    />
                    <span className="sprite-caption">Back</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {hasEvolution && (
          <div className="evolution-chain-group">
            <h3 className="sprite-label">Evolution chain</h3>
            <div className="evolution-chain evolution-chain-scroll">
              {evolutionChain.map((evolution, index) => (
                <React.Fragment key={evolution.id}>
                  <button
                    type="button"
                    className={`evolution-item${
                      evolution.name === pokemon.name ? " current-evolution" : ""
                    }`}
                    onClick={() => {
                      if (evolution.name !== pokemon.name) {
                        navigate(`/pokemon/${evolution.name}`);
                      }
                    }}
                    disabled={evolution.name === pokemon.name}
                    aria-current={evolution.name === pokemon.name ? "true" : undefined}
                  >
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evolution.id}.png`}
                      alt=""
                      className="evolution-sprite"
                      loading="lazy"
                    />
                    <span className="evolution-name">{evolution.name}</span>
                    {evolution.condition && index > 0 && (
                      <span className="evolution-condition">{evolution.condition}</span>
                    )}
                  </button>
                  {index < evolutionChain.length - 1 && (
                    <div className="evolution-arrow-container" aria-hidden="true">
                      <span className="evolution-arrow">→</span>
                      {evolutionChain[index + 1]?.condition && (
                        <span className="evolution-arrow-condition">
                          {evolutionChain[index + 1].condition}
                        </span>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

export default PokemonEvolutionSection;
