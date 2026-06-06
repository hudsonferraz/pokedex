import React from "react";
import "./PokemonDetailSkeleton.css";

const PokemonDetailSkeleton = () => (
  <div className="pokemon-detail-skeleton" aria-busy="true" aria-label="Loading Pokémon details">
    <div className="pokemon-detail-skeleton-nav skeleton-shimmer" />
    <div className="pokemon-detail-skeleton-hero">
      <div className="pokemon-detail-skeleton-art skeleton-shimmer" />
      <div className="pokemon-detail-skeleton-info">
        <div className="pokemon-detail-skeleton-line title skeleton-shimmer" />
        <div className="pokemon-detail-skeleton-line skeleton-shimmer" />
        <div className="pokemon-detail-skeleton-actions skeleton-shimmer" />
        <div className="pokemon-detail-skeleton-line wide skeleton-shimmer" />
        <div className="pokemon-detail-skeleton-line skeleton-shimmer" />
      </div>
    </div>
    <div className="pokemon-detail-skeleton-section skeleton-shimmer" />
    <div className="pokemon-detail-skeleton-section short skeleton-shimmer" />
  </div>
);

export default PokemonDetailSkeleton;
