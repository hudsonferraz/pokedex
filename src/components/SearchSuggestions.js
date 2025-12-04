import React, { useState, useEffect } from "react";
import { getPokemons } from "../api";
import "./SearchSuggestions.css";

const SearchSuggestions = ({ searchTerm, onSelect, onClose }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const data = await getPokemons(1000, 0);
        if (data && data.results) {
          const filtered = data.results
            .filter((pokemon) =>
              pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .slice(0, 8)
            .map((pokemon) => pokemon.name);
          setSuggestions(filtered);
        }
      } catch (error) {
        console.log("Error fetching suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  if (suggestions.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="search-suggestions">
      {loading ? (
        <div className="suggestion-item">Loading...</div>
      ) : (
        suggestions.map((suggestion, index) => (
          <div
            key={index}
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

