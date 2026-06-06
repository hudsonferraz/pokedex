import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMetaData } from "../contexts/MetaDataContext";
import { getUsagePercentFromMeta } from "../utils/usageStats";
import { formatSpeciesLabel } from "../utils/regulation";
import {
  getRecentlyViewed,
  clearRecentlyViewed,
  removeFromRecentlyViewed,
} from "../utils/recentlyViewed";
import "./RecentlyViewed.css";

const RecentlyViewed = () => {
  const navigate = useNavigate();
  const { meta } = useMetaData();
  const [recentPokemon, setRecentPokemon] = useState([]);

  useEffect(() => {
    setRecentPokemon(getRecentlyViewed());
  }, []);

  if (recentPokemon.length === 0) {
    return null;
  }

  return (
    <section className="recently-viewed card-surface" aria-labelledby="recently-viewed-title">
      <div className="recently-viewed-header">
        <h2 id="recently-viewed-title" className="recently-viewed-title">
          Recently viewed
        </h2>
        <button
          type="button"
          onClick={() => {
            clearRecentlyViewed();
            setRecentPokemon([]);
          }}
          className="clear-recent-btn"
          aria-label="Clear recently viewed"
        >
          Clear
        </button>
      </div>
      <div className="recently-viewed-list">
        {recentPokemon.map((pokemon) => {
          const usagePercent = meta ? getUsagePercentFromMeta(meta, pokemon.name) : null;
          const hasMetaUsage = usagePercent != null;

          return (
            <div
              key={pokemon.id}
              className="recently-viewed-item"
              onClick={() => navigate(`/pokemon/${pokemon.name}`)}
              role="button"
              tabIndex={0}
              aria-label={`View ${pokemon.name}`}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate(`/pokemon/${pokemon.name}`);
                }
              }}
            >
              {hasMetaUsage && (
                <span
                  className="recently-viewed-meta-dot"
                  title={`${usagePercent.toFixed(1)}% meta usage`}
                  aria-label={`${usagePercent.toFixed(1)}% meta usage`}
                />
              )}
              <img
                src={pokemon.sprite}
                alt=""
                className="recently-viewed-sprite"
                loading="lazy"
              />
              <span className="recently-viewed-name">{formatSpeciesLabel(pokemon.name)}</span>
              <button
                type="button"
                className="remove-recent-item-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  removeFromRecentlyViewed(pokemon.id);
                  setRecentPokemon(getRecentlyViewed());
                }}
                aria-label={`Remove ${pokemon.name} from recently viewed`}
                title="Remove from recently viewed"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default RecentlyViewed;
