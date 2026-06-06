import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPokemons, searchPokemon } from "../api";
import { useModalAccessibility } from "../hooks/useModalAccessibility";
import SearchSuggestions from "./SearchSuggestions";
import { formatSpeciesLabel } from "../utils/regulation";
import "./AddPokemonModal.css";

const MIN_QUERY_LENGTH = 2;

const AddPokemonModal = ({
  isOpen,
  onClose,
  onAdd,
  canAdd,
  teamNames,
}) => {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const modalRef = useModalAccessibility(isOpen, onClose, { initialFocusRef: searchInputRef });

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setResults([]);
    setShowSuggestions(false);
    setIsSearching(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const runSearch = useCallback(async (searchTerm) => {
    const normalized = searchTerm.trim().toLowerCase();
    if (normalized.length < MIN_QUERY_LENGTH) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(false);

    try {
      const exactMatch = await searchPokemon(normalized);
      if (exactMatch) {
        setResults([exactMatch]);
        return;
      }

      const listData = await getPokemons(1025, 0);
      const nameMatches =
        listData?.results
          ?.filter((entry) => entry.name.includes(normalized))
          .slice(0, 12) || [];

      if (nameMatches.length === 0) {
        setResults([]);
        return;
      }

      const pokemonDetails = await Promise.all(
        nameMatches.map((entry) => searchPokemon(entry.name)),
      );
      setResults(pokemonDetails.filter(Boolean));
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || query.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsSearching(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      runSearch(query);
    }, 320);

    return () => window.clearTimeout(timer);
  }, [query, isOpen, runSearch]);

  const handleQueryChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    setShowSuggestions(value.trim().length >= MIN_QUERY_LENGTH);
  };

  const handleSuggestionSelect = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    runSearch(suggestion);
  };

  const handlePickPokemon = (pokemon) => {
    if (!canAdd) return;
    if (teamNames.has(pokemon.name)) return;
    onAdd(pokemon);
  };

  if (!isOpen) return null;

  return (
    <div className="add-pokemon-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="add-pokemon-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-pokemon-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="add-pokemon-modal-header">
          <div>
            <h2 id="add-pokemon-title">Add Pokémon</h2>
            <p className="add-pokemon-modal-subtitle">
              Search by name or number — results update as you type.
            </p>
          </div>
          <button
            type="button"
            className="add-pokemon-modal-close"
            onClick={onClose}
            aria-label="Close add Pokémon dialog"
          >
            ×
          </button>
        </header>

        <div className="add-pokemon-modal-body">
          <div className="add-pokemon-search-wrap" ref={searchContainerRef}>
            <label htmlFor="add-pokemon-search" className="sr-only">
              Search Pokémon
            </label>
            <input
              id="add-pokemon-search"
              ref={searchInputRef}
              type="text"
              className="add-pokemon-search-input"
              placeholder="e.g. incineroar, gholdengo, 727…"
              value={query}
              onChange={handleQueryChange}
              onKeyDown={(event) => {
                if (event.key === "Enter" && query.trim().length >= MIN_QUERY_LENGTH) {
                  event.preventDefault();
                  runSearch(query);
                }
              }}
              onFocus={() => setShowSuggestions(query.trim().length >= MIN_QUERY_LENGTH)}
              autoComplete="off"
              spellCheck={false}
              data-modal-initial-focus
            />
            {showSuggestions && (
              <SearchSuggestions
                searchTerm={query}
                onSelect={handleSuggestionSelect}
                onClose={() => setShowSuggestions(false)}
              />
            )}
          </div>

          {query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH && (
            <p className="add-pokemon-hint">Type at least {MIN_QUERY_LENGTH} characters to search.</p>
          )}

          {isSearching && (
            <div className="add-pokemon-loading" aria-busy="true" aria-label="Searching Pokémon">
              <div className="add-pokemon-skeleton skeleton-shimmer" />
              <div className="add-pokemon-skeleton skeleton-shimmer" />
              <div className="add-pokemon-skeleton skeleton-shimmer short" />
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <ul className="add-pokemon-results" aria-label="Search results">
              {results.map((pokemon) => {
                const alreadyOnTeam = teamNames.has(pokemon.name);
                const disabled = !canAdd || alreadyOnTeam;
                return (
                  <li key={pokemon.id}>
                    <button
                      type="button"
                      className={`add-pokemon-result${disabled ? " disabled" : ""}`}
                      onClick={() => handlePickPokemon(pokemon)}
                      disabled={disabled}
                    >
                      <img
                        src={
                          pokemon.sprites?.other?.["official-artwork"]?.front_default ||
                          pokemon.sprites?.front_default
                        }
                        alt=""
                        className="add-pokemon-result-sprite"
                      />
                      <span className="add-pokemon-result-info">
                        <span className="add-pokemon-result-name">
                          {formatSpeciesLabel(pokemon.name)}
                        </span>
                        <span className="add-pokemon-result-id">#{pokemon.id}</span>
                      </span>
                      <span className="add-pokemon-result-action">
                        {alreadyOnTeam ? "On team" : canAdd ? "Add" : "Full"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!isSearching &&
            query.trim().length >= MIN_QUERY_LENGTH &&
            results.length === 0 && (
              <p className="add-pokemon-empty">No Pokémon found for &quot;{query}&quot;</p>
            )}
        </div>

        <footer className="add-pokemon-modal-footer">
          <button
            type="button"
            className="add-pokemon-browse-btn"
            onClick={() => {
              onClose();
              navigate("/browse");
            }}
          >
            Browse all Pokémon
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AddPokemonModal;
