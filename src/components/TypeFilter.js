import React, { useState } from "react";
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
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="type-filter-container">
      <div className="type-filter-header">
        <div className="type-filter-title-section">
          <h3 className="type-filter-title">Filter by Type</h3>
          {selectedTypes.length > 0 && (
            <span className="filter-count-badge" aria-label={`${selectedTypes.length} filter${selectedTypes.length !== 1 ? 's' : ''} active`}>
              {selectedTypes.length}
            </span>
          )}
        </div>
        <div className="type-filter-actions">
          {selectedTypes.length > 0 && (
            <button 
              onClick={onClearAll} 
              className="clear-filters-btn"
              aria-label="Clear all filters"
            >
              Clear All
            </button>
          )}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="toggle-filter-btn"
            aria-label={isExpanded ? "Collapse filters" : "Expand filters"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? "−" : "+"}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="type-filter-grid" role="group" aria-label="Pokemon type filters">
          {allTypes.map((type) => (
            <button
              key={type}
              onClick={() => onTypeToggle(type)}
              className={`type-filter-button ${selectedTypes.includes(type) ? "active" : ""}`}
              style={{
                backgroundColor: selectedTypes.includes(type) ? typeColors[type] : "#f0f0f0",
                color: selectedTypes.includes(type) ? "white" : "#333",
              }}
              aria-pressed={selectedTypes.includes(type)}
              aria-label={`Filter by ${type} type`}
            >
              {type}
            </button>
          ))}
        </div>
      )}
      {selectedTypes.length > 0 && (
        <div className="active-filters-chips">
          <span className="active-filters-label">Active:</span>
          {selectedTypes.map((type) => (
            <span
              key={type}
              className="active-filter-chip"
              style={{ backgroundColor: typeColors[type] }}
            >
              {type}
              <button
                onClick={() => onTypeToggle(type)}
                className="remove-filter-btn"
                aria-label={`Remove ${type} filter`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TypeFilter;

