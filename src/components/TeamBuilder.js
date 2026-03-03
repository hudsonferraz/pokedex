import React, { useState, useContext, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TeamContext from "../contexts/TeamContext";
import { useToast } from "./ToastProvider";
import { searchPokemon } from "../api";
import SearchSuggestions from "./SearchSuggestions";
import TeamSlot from "./TeamSlot";
import TeamAnalysis from "./TeamAnalysis";
import TeamAITips from "./TeamAITips";
import MovePickerModal from "./MovePickerModal";
import Navbar from "./Navbar";
import { getTeamExportText, encodeTeamForShare, decodeTeamFromShare } from "../utils/teamExport";
import "./TeamBuilder.css";

const TeamBuilder = () => {
  const {
    teams,
    activeTeamId,
    activeTeam,
    team,
    setActiveTeam,
    addTeam,
    removeTeam,
    renameTeam,
    setCurrentTeamPokemon,
    getMoveset,
    setMoveset,
    addToTeam,
    removeFromTeam,
    clearTeam,
    canAddToTeam,
  } = useContext(TeamContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [movePickerPokemon, setMovePickerPokemon] = useState(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const exportMenuRef = useRef(null);

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

  // Import team from share link (?team=base64)
  useEffect(() => {
    const encoded = searchParams.get("team");
    if (!encoded) return;
    const decoded = decodeTeamFromShare(encoded);
    if (!decoded || decoded.pokemon.length === 0) {
      setSearchParams({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const fullTeam = [];
        for (const name of decoded.pokemon.slice(0, 6)) {
          if (cancelled) return;
          const p = await searchPokemon(name);
          if (p) fullTeam.push(p);
        }
        if (!cancelled && fullTeam.length > 0) {
          addTeam(decoded.name);
          setTimeout(() => {
            setCurrentTeamPokemon(fullTeam, decoded.movesets || null);
            showToast(`Imported "${decoded.name}"`, "success");
          }, 0);
        }
        setSearchParams({});
      } catch (e) {
        if (!cancelled) showToast("Failed to import team", "error");
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) setShowExportMenu(false);
    };
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showExportMenu]);

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

  const handleNewTeam = () => {
    addTeam();
    showToast("New team created", "success");
  };

  const handleRenameOpen = () => {
    setRenameValue(activeTeam ? activeTeam.name : "");
    setShowRenameModal(true);
  };

  const handleRenameSubmit = () => {
    const name = renameValue.trim();
    if (name && activeTeamId) {
      renameTeam(activeTeamId, name);
      showToast("Team renamed", "success");
      setShowRenameModal(false);
    }
  };

  const handleDeleteTeam = () => {
    if (teams.length <= 1) {
      showToast("Keep at least one team", "info");
      return;
    }
    setTeamToDelete(activeTeamId);
  };

  const confirmDeleteTeam = () => {
    if (teamToDelete) {
      removeTeam(teamToDelete);
      showToast("Team deleted", "info");
      setTeamToDelete(null);
    }
  };

  const handleCopyAsText = () => {
    const text = getTeamExportText(team, activeTeam?.name || "Team", activeTeam?.movesets);
    navigator.clipboard.writeText(text).then(() => {
      showToast("Copied to clipboard", "success");
      setShowExportMenu(false);
    });
  };

  const handleCopyShareLink = () => {
    const encoded = encodeTeamForShare(team, activeTeam?.name || "Team", activeTeam?.movesets);
    const url = `${window.location.origin}${window.location.pathname}?team=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast("Share link copied", "success");
      setShowExportMenu(false);
    });
  };

  return (
    <div className="team-builder-container">
      <Navbar />
      <div className="team-builder-content">
        <div className="team-builder-header">
          <div className="team-builder-title-block">
            <h1>Team Builder</h1>
            <p className="team-builder-tagline">Build a balanced squad with type coverage, weakness analysis, and AI tips.</p>
          </div>
          <div className="team-builder-actions">
            <div className="team-selector-row">
              <select
                className="team-select"
                value={activeTeamId || ""}
                onChange={(e) => setActiveTeam(e.target.value)}
                aria-label="Select team"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button type="button" className="action-btn" onClick={handleNewTeam} title="New team">+ New</button>
              <button type="button" className="action-btn" onClick={handleRenameOpen} title="Rename team">Rename</button>
              <button
                type="button"
                className="action-btn clear-btn"
                onClick={handleDeleteTeam}
                disabled={teams.length <= 1}
                title="Delete team"
              >
                Delete
              </button>
              <div className="export-dropdown" ref={exportMenuRef}>
                <button
                  type="button"
                  className="action-btn save-btn"
                  onClick={() => setShowExportMenu((v) => !v)}
                  disabled={team.length === 0}
                  title="Export or share"
                >
                  Export ▼
                </button>
                {showExportMenu && (
                  <div className="export-menu">
                    <button type="button" onClick={handleCopyAsText}>Copy as text</button>
                    <button type="button" onClick={handleCopyShareLink}>Copy share link</button>
                  </div>
                )}
              </div>
            </div>
            <button
              className="action-btn clear-btn"
              onClick={handleClearTeam}
              disabled={team.length === 0}
              title="Clear current team"
            >
              Clear
            </button>
          </div>
        </div>

        {teamToDelete && (
          <div className="modal-overlay" onClick={() => setTeamToDelete(null)}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
              <p>Delete this team? This cannot be undone.</p>
              <div className="confirm-modal-actions">
                <button type="button" className="action-btn" onClick={() => setTeamToDelete(null)}>Cancel</button>
                <button type="button" className="action-btn clear-btn" onClick={confirmDeleteTeam}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {showRenameModal && (
          <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
            <div className="rename-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Rename team</h3>
              <input
                type="text"
                className="rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
                placeholder="Team name"
                autoFocus
              />
              <div className="rename-modal-actions">
                <button type="button" className="action-btn" onClick={() => setShowRenameModal(false)}>Cancel</button>
                <button type="button" className="action-btn save-btn" onClick={handleRenameSubmit}>Save</button>
              </div>
            </div>
          </div>
        )}

        <div className="team-slots-grid">
          {[0, 1, 2, 3, 4, 5].map((slotIndex) => (
            <TeamSlot
              key={slotIndex}
              slotNumber={slotIndex + 1}
              pokemon={team[slotIndex] || null}
              selectedMoves={team[slotIndex] ? getMoveset(team[slotIndex].name) : []}
              onRemove={handleRemovePokemon}
              onAdd={() => handleSlotClick(slotIndex)}
              onEditMoves={(p) => setMovePickerPokemon(p)}
            />
          ))}
        </div>

        {movePickerPokemon && (
          <MovePickerModal
            pokemon={movePickerPokemon}
            currentMoves={getMoveset(movePickerPokemon.name)}
            onSave={(moves) => {
              setMoveset(movePickerPokemon.name, moves);
              showToast("Moves saved");
            }}
            onClose={() => setMovePickerPokemon(null)}
          />
        )}

        <TeamAnalysis team={team} />
        <TeamAITips team={team} />

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
                      navigate("/browse");
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

