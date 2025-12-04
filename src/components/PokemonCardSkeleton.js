import React from "react";
import "./PokemonCardSkeleton.css";

const PokemonCardSkeleton = () => {
  return (
    <div className="pokemon-card-skeleton">
      <div className="skeleton-image-container">
        <div className="skeleton-image"></div>
      </div>
      <div className="skeleton-body">
        <div className="skeleton-header">
          <div className="skeleton-text skeleton-title"></div>
          <div className="skeleton-text skeleton-id"></div>
        </div>
        <div className="skeleton-footer">
          <div className="skeleton-badge"></div>
          <div className="skeleton-badge"></div>
          <div className="skeleton-heart"></div>
        </div>
      </div>
    </div>
  );
};

export default PokemonCardSkeleton;

