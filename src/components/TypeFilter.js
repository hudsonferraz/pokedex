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

const TypeFilter = ({ selectedTypes, onTypeToggle, onClearAll, selectedGeneration, onGenerationChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const generations = [
    { num: 1, name: "Gen 1", range: "1-151" },
    { num: 2, name: "Gen 2", range: "152-251" },
    { num: 3, name: "Gen 3", range: "252-386" },
    { num: 4, name: "Gen 4", range: "387-493" },
    { num: 5, name: "Gen 5", range: "494-649" },
    { num: 6, name: "Gen 6", range: "650-721" },
    { num: 7, name: "Gen 7", range: "722-809" },
    { num: 8, name: "Gen 8", range: "810-905" },
    { num: 9, name: "Gen 9", range: "906-1025" },
  ];

  return (
    <div className="type-filter-container">
      <div className="type-filter-header">
        <div className="type-filter-title-section">
          <h3 className="type-filter-title">Filter by Type</h3>
          {(selectedTypes.length > 0 || selectedGeneration) && (
            <span className="filter-count-badge" aria-label={`${selectedTypes.length + (selectedGeneration ? 1 : 0)} filter${selectedTypes.length + (selectedGeneration ? 1 : 0) !== 1 ? 's' : ''} active`}>
              {selectedTypes.length + (selectedGeneration ? 1 : 0)}
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
        <>
          {onGenerationChange && (
            <div className="generation-filter-section">
              <h4 className="generation-filter-title">Generation</h4>
              <div className="generation-filter-buttons">
                <button
                  onClick={() => onGenerationChange(null)}
                  className={`generation-filter-button ${!selectedGeneration ? "active" : ""}`}
                >
                  All
                </button>
                {generations.map((gen) => (
                  <button
                    key={gen.num}
                    onClick={() => onGenerationChange(gen.num)}
                    className={`generation-filter-button ${selectedGeneration === gen.num ? "active" : ""}`}
                    title={gen.range}
                  >
                    {gen.name}
                  </button>
                ))}
              </div>
            </div>
          )}
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
        </>
      )}
      {(selectedTypes.length > 0 || selectedGeneration) && (
        <div className="active-filters-chips">
          <span className="active-filters-label">Active:</span>
          {selectedGeneration && (
            <span className="active-filter-chip" style={{ backgroundColor: "#0e6f9f" }}>
              Gen {selectedGeneration}
              <button
                onClick={() => onGenerationChange && onGenerationChange(null)}
                className="remove-filter-btn"
                aria-label="Remove generation filter"
              >
                ×
              </button>
            </span>
          )}
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

