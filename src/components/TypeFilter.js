import React from "react";
import "./TypeFilter.css";

const typeColors = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

const allTypes = Object.keys(typeColors);

const TypeFilter = ({ selectedTypes, onTypeToggle, onClearAll }) => {
  return (
    <div className="type-filter-container">
      <div className="type-filter-header">
        <h3 className="type-filter-title">Filter by Type</h3>
        {selectedTypes.length > 0 && (
          <button onClick={onClearAll} className="clear-filters-btn">
            Clear All
          </button>
        )}
      </div>
      <div className="type-filter-grid">
        {allTypes.map((type) => (
          <button
            key={type}
            onClick={() => onTypeToggle(type)}
            className={`type-filter-button ${selectedTypes.includes(type) ? "active" : ""}`}
            style={{
              backgroundColor: selectedTypes.includes(type) ? typeColors[type] : "#f0f0f0",
              color: selectedTypes.includes(type) ? "white" : "#333",
            }}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TypeFilter;

