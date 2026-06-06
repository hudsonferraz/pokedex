import React, { useState, useEffect, useRef, useCallback } from "react";
import { searchPokemonInline } from "../hooks/useBrowseGrid";
import { formatSpeciesLabel } from "../utils/regulation";
import "./Searchbar.css";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 320;

const Searchbar = ({ onSearch, speciesIndex = [] }) => {
  const [search, setSearch] = useState("");
  const [showClear, setShowClear] = useState(false);
  const [inlineResults, setInlineResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    setShowClear(search.length > 0);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setInlineResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const runInlineSearch = useCallback(
    async (searchTerm) => {
      const normalized = searchTerm.trim();
      if (normalized.length < MIN_QUERY_LENGTH || !speciesIndex.length) {
        setInlineResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchPokemonInline(normalized, speciesIndex);
        setInlineResults(results);
      } catch {
        setInlineResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [speciesIndex],
  );

  useEffect(() => {
    if (search.trim().length < MIN_QUERY_LENGTH) {
      setInlineResults([]);
      setIsSearching(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      runInlineSearch(search);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [search, runInlineSearch]);

  const onChangeHandler = (event) => {
    const value = event.target.value;
    setSearch(value);
    if (value.length === 0) {
      setInlineResults([]);
      onSearch(undefined);
    }
  };

  const submitSearch = (searchTerm = null) => {
    const term = (searchTerm || search).trim();
    if (term.length === 0) {
      return;
    }
    onSearch(term);
    setInlineResults([]);
  };

  const handleInlineSelect = (pokemon) => {
    setSearch(pokemon.name);
    onSearch(pokemon.name);
    setInlineResults([]);
  };

  const handleClear = () => {
    setSearch("");
    setInlineResults([]);
    onSearch(undefined);
    searchInputRef.current?.focus();
  };

  const onKeyPressHandler = (event) => {
    if (event.key === "Enter") {
      submitSearch();
    }
  };

  const showInlinePanel = search.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div className="searchbar-container">
      <div className="searchbar" ref={searchContainerRef}>
        <input
          ref={searchInputRef}
          placeholder="Search for a pokemon..."
          onChange={onChangeHandler}
          onKeyPress={onKeyPressHandler}
          onFocus={() => {
            if (search.trim().length >= MIN_QUERY_LENGTH) {
              runInlineSearch(search);
            }
          }}
          value={search}
          className="search-input"
          autoComplete="off"
          spellCheck={false}
          aria-controls="browse-search-results"
        />
        {showClear && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={handleClear}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
        {showInlinePanel && (
          <div
            id="browse-search-results"
            className="search-inline-results"
            aria-label="Search results"
          >
            {isSearching && (
              <p className="search-inline-status" aria-live="polite">
                Searching…
              </p>
            )}
            {!isSearching &&
              inlineResults.map((pokemon) => (
                <button
                  key={pokemon.id}
                  type="button"
                  className="search-inline-result"
                  onClick={() => handleInlineSelect(pokemon)}
                >
                  <img
                    src={
                      pokemon.sprites?.other?.["official-artwork"]?.front_default ||
                      pokemon.sprites?.front_default
                    }
                    alt=""
                    className="search-inline-sprite"
                  />
                  <span className="search-inline-name">
                    {formatSpeciesLabel(pokemon.name)}
                  </span>
                  <span className="search-inline-id">#{pokemon.id}</span>
                </button>
              ))}
            {!isSearching && inlineResults.length === 0 && (
              <p className="search-inline-status">No matches</p>
            )}
          </div>
        )}
      </div>
      <div className="searchbar-btn">
        <button type="button" onClick={() => submitSearch()}>
          Search
        </button>
      </div>
    </div>
  );
};

export default Searchbar;
