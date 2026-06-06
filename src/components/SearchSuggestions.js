import React, { useState, useEffect, useMemo } from "react";
import { filterSpeciesByName } from "../utils/pokemonSpeciesIndex";
import "./SearchSuggestions.css";

const SearchSuggestions = ({ searchTerm, onSelect, onClose, speciesIndex = [] }) => {
  const [loading, setLoading] = useState(false);

  const suggestions = useMemo(() => {
    if (searchTerm.length < 2) {
      return [];
    }

    if (speciesIndex.length > 0) {
      return filterSpeciesByName(speciesIndex, searchTerm, 8).map(
        (entry) => entry.name,
      );
    }

    return [];
  }, [searchTerm, speciesIndex]);

  useEffect(() => {
    if (speciesIndex.length > 0 || searchTerm.length < 2) {
      setLoading(false);
    }
  }, [searchTerm, speciesIndex.length]);

  if (suggestions.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="search-suggestions">
      {loading ? (
        <div className="suggestion-item">Loading...</div>
      ) : (
        suggestions.map((suggestion) => (
          <div
            key={suggestion}
            className="suggestion-item"
            onClick={() => {
              onSelect(suggestion);
              onClose();
            }}
          >
            {suggestion}
          </div>
        ))
      )}
    </div>
  );
};

export default SearchSuggestions;
