import React from "react";
import "./SortOptions.css";

const SortOptions = ({ sortBy, onSortChange }) => {
  return (
    <div className="sort-options-container">
      <label className="sort-label">Sort by:</label>
      <select 
        value={sortBy} 
        onChange={(e) => onSortChange(e.target.value)}
        className="sort-select"
      >
        <option value="number">Number</option>
        <option value="name">Name (A-Z)</option>
        <option value="name-desc">Name (Z-A)</option>
        <option value="type">Type</option>
      </select>
    </div>
  );
};

export default SortOptions;

