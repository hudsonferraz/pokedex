import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRecentlyViewed, clearRecentlyViewed } from "../utils/recentlyViewed";
import "./RecentlyViewed.css";

const RecentlyViewed = () => {
  const navigate = useNavigate();
  const [recentPokemon, setRecentPokemon] = useState([]);

  useEffect(() => {
    setRecentPokemon(getRecentlyViewed());
  }, []);

  if (recentPokemon.length === 0) {
    return null;
  }

  return (
    <div className="recently-viewed-container">
      <div className="recently-viewed-header">
        <h3 className="recently-viewed-title">Recently Viewed</h3>
        <button 
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
        {recentPokemon.map((pokemon) => (
          <div
            key={pokemon.id}
            className="recently-viewed-item"
            onClick={() => navigate(`/pokemon/${pokemon.name}`)}
            role="button"
            tabIndex={0}
            aria-label={`View ${pokemon.name}`}
            onKeyPress={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(`/pokemon/${pokemon.name}`);
              }
            }}
          >
            <img 
              src={pokemon.sprite} 
              alt={pokemon.name}
              className="recently-viewed-sprite"
              loading="lazy"
            />
            <span className="recently-viewed-name">{pokemon.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;

