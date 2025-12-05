import React, { useState, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TeamContext from "../contexts/TeamContext";
import { useToast } from "./ToastProvider";
import { searchPokemon } from "../api";
import SearchSuggestions from "./SearchSuggestions";
import TeamSlot from "./TeamSlot";
import TeamAnalysis from "./TeamAnalysis";
import Navbar from "./Navbar";
import "./TeamBuilder.css";

const TEAM_STORAGE_KEY = "pokemon-team";

const TeamBuilder = () => {
  const { team, addToTeam, removeFromTeam, clearTeam, canAddToTeam } = useContext(TeamContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    if (showAddModal) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAddModal]);

  useEffect(() => {
    setShowSuggestions(searchQuery.length > 0);
  }, [searchQuery]);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(false);
    try {
      const pokemon = await searchPokemon(query.toLowerCase());
      if (pokemon) {
        setSearchResults([pokemon]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleAddPokemon = (pokemon) => {
    if (!canAddToTeam()) {
      showToast("Team is full! Remove a Pokemon first.", "error");
      return;
    }

    const isAlreadyInTeam = team.some(p => p && p.name === pokemon.name);
    if (isAlreadyInTeam) {
      showToast(`${pokemon.name} is already in your team!`, "info");
      return;
    }

    addToTeam(pokemon);
    showToast(`${pokemon.name} added to team!`, "success");
    setShowAddModal(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedSlot(null);
  };

  const handleSlotClick = (slotIndex) => {
    if (team[slotIndex]) {
      return;
    }
    setSelectedSlot(slotIndex);
    setShowAddModal(true);
  };

  const handleRemovePokemon = (pokemonName) => {
    removeFromTeam(pokemonName);
    showToast(`${pokemonName} removed from team`, "info");
  };

  const handleClearTeam = () => {
    if (window.confirm("Are you sure you want to clear your entire team?")) {
      clearTeam();
      showToast("Team cleared", "info");
    }
  };

  const handleSaveTeam = () => {
    if (team.length === 0) {
      showToast("Your team is empty!", "error");
      return;
    }
    showToast("Team saved automatically!", "success");
  };

  return (
    <div className="team-builder-container">
      <Navbar />
      <div className="team-builder-content">
        <div className="team-builder-header">
          <h1>Team Builder</h1>
          <div className="team-builder-actions">
            <button 
              className="action-btn save-btn"
              onClick={handleSaveTeam}
              disabled={team.length === 0}
            >
              Save Team
            </button>
            <button 
              className="action-btn clear-btn"
              onClick={handleClearTeam}
              disabled={team.length === 0}
            >
              Clear Team
            </button>
          </div>
        </div>

        <div className="team-slots-grid">
          {[0, 1, 2, 3, 4, 5].map((slotIndex) => (
            <TeamSlot
              key={slotIndex}
              slotNumber={slotIndex + 1}
              pokemon={team[slotIndex] || null}
              onRemove={handleRemovePokemon}
              onAdd={() => handleSlotClick(slotIndex)}
            />
          ))}
        </div>

        <TeamAnalysis team={team} />

        {showAddModal && (
          <div className="add-pokemon-modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="add-pokemon-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add Pokemon to Team</h2>
                <button 
                  className="modal-close-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-content">
                <div className="search-input-container" ref={searchContainerRef}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search Pokemon by name or ID..."
                    value={searchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      if (value.length === 0) {
                        setSearchResults([]);
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && searchQuery.trim()) {
                        handleSearch(searchQuery);
                      }
                    }}
                    onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                    className="search-input"
                    autoFocus
                  />
                  {showSuggestions && (
                    <SearchSuggestions
                      searchTerm={searchQuery}
                      onSelect={handleSuggestionSelect}
                      onClose={() => setShowSuggestions(false)}
                    />
                  )}
                </div>
                {isSearching && <div className="search-loading">Searching...</div>}
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((pokemon) => (
                      <div
                        key={pokemon.id}
                        className="search-result-item"
                        onClick={() => handleAddPokemon(pokemon)}
                      >
                        <img
                          src={pokemon.sprites?.front_default}
                          alt={pokemon.name}
                          className="result-sprite"
                        />
                        <div className="result-info">
                          <span className="result-name">{pokemon.name}</span>
                          <span className="result-id">#{pokemon.id}</span>
                        </div>
                        <button className="add-btn">+</button>
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery && !isSearching && searchResults.length === 0 && !showSuggestions && (
                  <div className="no-results">No Pokemon found</div>
                )}
                <div className="modal-footer">
                  <button
                    className="browse-btn"
                    onClick={() => {
                      setShowAddModal(false);
                      navigate("/");
                    }}
                  >
                    Browse All Pokemon
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamBuilder;

