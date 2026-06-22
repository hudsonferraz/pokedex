import React, { useState, useContext, useRef, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import TeamContext from "../contexts/TeamContext";
import { useRegulation } from "../contexts/RegulationContext";
import { useToast } from "./ToastProvider";
import { searchPokemon } from "../api";
import { getCachedMoveInfo } from "../utils/moveDetailsCache";
import TeamSlot from "./TeamSlot";
import TeamAnalysis from "./TeamAnalysis";
import TeamAITips from "./TeamAITips";
import SpeedTierTable from "./SpeedTierTable";
import MetaThreatHints from "./MetaThreatHints";
import TeamEmptyState from "./TeamEmptyState";
import MovePickerModal from "./MovePickerModal";
import RegulationSelector from "./RegulationSelector";
import RegulationWarnings from "./RegulationWarnings";
import BringFourPreview from "./BringFourPreview";
import TeamPreviewSimulator from "./TeamPreviewSimulator";
import PokemonSetModal from "./PokemonSetModal";
import ShowdownImportModal from "./ShowdownImportModal";
import MetaGapPanel from "./MetaGapPanel";
import SuggestSixthPanel from "./SuggestSixthPanel";
import TeammateSuggestions from "./TeammateSuggestions";
import Navbar from "./Navbar";
import ApiStatusChip from "./ApiStatusChip";
import AddPokemonModal from "./AddPokemonModal";
import { normalizeSpeciesId, formatSpeciesLabel } from "../utils/regulation";
import { useModalAccessibility } from "../hooks/useModalAccessibility";
import {
  getTeamExportText,
  getTeamShowdownExport,
  decodeTeamFromShare,
  buildTeamShareUrl,
} from "../utils/teamExport";
import { parseShowdownPaste } from "../utils/showdownTeam";
import "./TeamBuilder.css";

const TeamBuilder = () => {
  const {
    teams,
    activeTeamId,
    activeTeam,
    team,
    setActiveTeam,
    addTeam,
    addTeamWithRoster,
    removeTeam,
    renameTeam,
    setCurrentTeamPokemon,
    getMoveset,
    setMoveset,
    getPokemonSet,
    updatePokemonSet,
    getRole,
    setRole,
    getBringList,
    toggleBringPokemon,
    setBringList,
    addToTeam,
    removeFromTeam,
    clearTeam,
    canAddToTeam,
  } = useContext(TeamContext);
  const { showToast } = useToast();
  const { regulation, regulationId, setRegulationId } = useRegulation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [movePickerPokemon, setMovePickerPokemon] = useState(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [showShowdownImport, setShowShowdownImport] = useState(false);
  const [showdownImporting, setShowdownImporting] = useState(false);
  const [setEditorPokemon, setSetEditorPokemon] = useState(null);
  const [metaFocusIndex, setMetaFocusIndex] = useState(0);

  const filledSlotIndices = useMemo(
    () => team.map((entry, index) => (entry ? index : -1)).filter((index) => index >= 0),
    [team],
  );

  const teamNames = useMemo(
    () => new Set(team.filter(Boolean).map((entry) => normalizeSpeciesId(entry.name))),
    [team],
  );

  const focusedPokemon = team[metaFocusIndex] || null;

  useEffect(() => {
    if (filledSlotIndices.length === 0) return;
    if (!team[metaFocusIndex]) {
      setMetaFocusIndex(filledSlotIndices[0]);
    }
  }, [team, metaFocusIndex, filledSlotIndices]);
  const bringList = getBringList();
  const exportMenuRef = useRef(null);

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    setSelectedSlot(null);
  }, []);

  const closeRenameModal = useCallback(() => setShowRenameModal(false), []);
  const closeDeleteModal = useCallback(() => setTeamToDelete(null), []);

  const renameModalRef = useModalAccessibility(showRenameModal, closeRenameModal);
  const deleteModalRef = useModalAccessibility(!!teamToDelete, closeDeleteModal);

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
          if (decoded.regulationId) {
            setRegulationId(decoded.regulationId);
          }
          addTeamWithRoster(
            decoded.name,
            fullTeam,
            decoded.sets || null,
            decoded.roles || null,
            decoded.bringList || null,
          );
          showToast(`Imported "${decoded.name}"`, "success");
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

  const handleAddPokemon = useCallback((pokemon) => {
    if (!canAddToTeam()) {
      showToast("Team is full! Remove a Pokemon first.", "error");
      return;
    }

    const isAlreadyInTeam = team.some((entry) => entry && entry.name === pokemon.name);
    if (isAlreadyInTeam) {
      showToast(`${pokemon.name} is already in your team!`, "info");
      return;
    }

    addToTeam(pokemon);
    showToast(`${pokemon.name} added to team!`, "success");
    closeAddModal();
  }, [addToTeam, canAddToTeam, closeAddModal, showToast, team]);

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

  const handleAddTeammate = async (speciesApiId) => {
    if (!canAddToTeam()) {
      showToast("Team is full (6/6)", "info");
      return;
    }
    if (teamNames.has(speciesApiId)) {
      showToast("Already on your team", "info");
      return;
    }
    try {
      const pokemon = await searchPokemon(speciesApiId);
      const added = addToTeam(pokemon);
      if (added) {
        showToast(`${formatSpeciesLabel(speciesApiId)} added from meta partners`, "success");
      } else {
        showToast("Could not add Pokémon", "info");
      }
    } catch {
      showToast("Could not load Pokémon — try Browse", "error");
    }
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

  const handleShowdownImport = async (pasteText) => {
    setShowdownImporting(true);
    const parsed = parseShowdownPaste(pasteText);
    if (parsed.length === 0) {
      showToast("No Pokémon found in paste", "error");
      setShowdownImporting(false);
      return;
    }

    try {
      const fullTeam = [];
      const sets = {};

      for (const entry of parsed) {
        let pokemon = await searchPokemon(entry.apiId);
        if (!pokemon) {
          pokemon = await searchPokemon(entry.speciesLine.toLowerCase().replace(/\s+/g, "-"));
        }
        if (!pokemon) continue;

        fullTeam.push(pokemon);
        sets[pokemon.name] = {
          moves: entry.moves,
          moveTypes: {},
          ability: entry.ability,
          item: entry.item,
          nature: entry.nature,
          teraType: entry.teraType,
          evs: entry.evs,
        };
      }

      if (fullTeam.length === 0) {
        showToast("Could not resolve species from paste", "error");
        return;
      }

      setCurrentTeamPokemon(fullTeam, sets);
      setBringList([]);
      showToast(`Imported ${fullTeam.length} Pokémon from Showdown`, "success");
      setShowShowdownImport(false);
    } catch {
      showToast("Showdown import failed", "error");
    } finally {
      setShowdownImporting(false);
    }
  };

  const handleCopyAsText = () => {
    const text = getTeamExportText(team, activeTeam?.name || "Team", activeTeam?.sets);
    navigator.clipboard.writeText(text).then(() => {
      showToast("Copied to clipboard", "success");
      setShowExportMenu(false);
    });
  };

  const handleCopyShowdown = () => {
    const text = getTeamShowdownExport(team, activeTeam?.name || "Team", activeTeam?.sets);
    navigator.clipboard.writeText(text).then(() => {
      showToast("Showdown paste copied", "success");
      setShowExportMenu(false);
    });
  };

  const handleCopyShareLink = () => {
    const { url, tooLong, length } = buildTeamShareUrl(
      window.location.origin,
      window.location.pathname,
      team,
      activeTeam?.name || "Team",
      activeTeam?.sets,
      bringList,
      regulationId,
      activeTeam?.roles,
    );

    if (tooLong) {
      showToast(
        `Share link too long (${length} chars). Trim sets or use Showdown paste export.`,
        "error",
      );
      return;
    }

    navigator.clipboard.writeText(url).then(() => {
      showToast("Share link copied (includes regulation & roles)", "success");
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 2000);
    });
  };

  return (
    <div className="team-builder-container">
      <Navbar />
      <div className="team-builder-content">
        <section className="team-builder-hero card-surface">
          <ApiStatusChip />
          <div className="team-builder-hero-text">
            <p className="team-builder-hero-eyebrow">VGC team lab</p>
            <h1>Build your {regulation.label} squad</h1>
            <p className="team-builder-hero-copy">
              Six slots, typed roles, Pikalytics meta sets, and live analysis — tuned for{" "}
              {regulation.series || "VGC"} doubles prep.
            </p>
          </div>
          <ul className="team-builder-hero-features" aria-label="Features">
            <li>Type coverage &amp; weaknesses</li>
            <li>4-move sets per Pokémon</li>
            <li>AI tips via Hugging Face</li>
          </ul>
        </section>

        <RegulationSelector />
        <RegulationWarnings team={team} />
        <MetaGapPanel team={team} />

        <div className="team-builder-header">
          <div className="team-builder-title-block">
            <h2 className="team-builder-section-title">Your teams</h2>
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
              <button
                type="button"
                className="action-btn"
                onClick={() => setShowShowdownImport(true)}
                title="Import Showdown paste"
              >
                Import paste
              </button>
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
                    <button type="button" onClick={handleCopyShowdown}>Copy Showdown paste</button>
                    <button
                      type="button"
                      className={shareLinkCopied ? "copied-flash" : ""}
                      onClick={handleCopyShareLink}
                    >
                      {shareLinkCopied ? "Link copied ✓" : "Copy share link"}
                    </button>
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

        {team.length === 0 && (
          <TeamEmptyState
            onAddFirst={() => handleSlotClick(0)}
            regulationLabel={regulation.label}
          />
        )}

        {teamToDelete && (
          <div className="modal-overlay" onClick={() => setTeamToDelete(null)} role="presentation">
            <div
              className="confirm-modal"
              ref={deleteModalRef}
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <p>Delete this team? This cannot be undone.</p>
              <div className="confirm-modal-actions">
                <button type="button" className="action-btn" onClick={() => setTeamToDelete(null)}>Cancel</button>
                <button type="button" className="action-btn clear-btn" onClick={confirmDeleteTeam}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {showRenameModal && (
          <div className="modal-overlay" onClick={() => setShowRenameModal(false)} role="presentation">
            <div
              className="rename-modal"
              ref={renameModalRef}
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
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

        <div className="team-slots-wrapper" role="region" aria-label="Team slots">
          <div className="team-slots-grid">
            {[0, 1, 2, 3, 4, 5].map((slotIndex) => (
              <TeamSlot
                key={slotIndex}
                slotNumber={slotIndex + 1}
                pokemon={team[slotIndex] || null}
                selectedMoves={team[slotIndex] ? getMoveset(team[slotIndex].name) : []}
                pokemonSet={team[slotIndex] ? getPokemonSet(team[slotIndex].name) : null}
                role={team[slotIndex] ? getRole(team[slotIndex].name) : ""}
                onRoleChange={(name, value) => setRole(name, value)}
                onRemove={handleRemovePokemon}
                onAdd={() => handleSlotClick(slotIndex)}
                onEditSet={(pokemon) => setSetEditorPokemon(pokemon)}
                onEditMoves={(pokemon) => setMovePickerPokemon(pokemon)}
              />
            ))}
          </div>
        </div>

        {filledSlotIndices.length > 0 && (
          <>
            <div className="teammate-slot-chips" role="tablist" aria-label="Select Pokémon for partner suggestions">
              {filledSlotIndices.map((slotIndex) => {
                const member = team[slotIndex];
                return (
                  <button
                    key={member.name}
                    type="button"
                    role="tab"
                    aria-selected={metaFocusIndex === slotIndex}
                    className={`teammate-slot-chip ${metaFocusIndex === slotIndex ? "active" : ""}`}
                    onClick={() => setMetaFocusIndex(slotIndex)}
                  >
                    {member.name}
                  </button>
                );
              })}
            </div>
            <TeammateSuggestions
              selectedPokemon={focusedPokemon}
              regulationId={regulationId}
              regulationLabel={regulation.label}
              teamNames={teamNames}
              canAddToTeam={canAddToTeam()}
              onAddTeammate={handleAddTeammate}
            />
          </>
        )}

        <SuggestSixthPanel
          team={team}
          regulationId={regulationId}
          teamNames={teamNames}
          canAddToTeam={canAddToTeam()}
          onAddSuggestion={handleAddTeammate}
        />

        <BringFourPreview
          team={team}
          bringList={bringList}
          onToggle={toggleBringPokemon}
        />

        <TeamPreviewSimulator
          team={team}
          sets={activeTeam?.sets}
          bringList={bringList}
          setBringList={setBringList}
          regulationId={regulationId}
        />

        {movePickerPokemon && (
          <MovePickerModal
            pokemon={movePickerPokemon}
            currentMoves={getMoveset(movePickerPokemon.name)}
            regulationId={regulationId}
            onSave={(moves) => {
              const moveTypes = {};
              moves.forEach((moveName) => {
                const details = getCachedMoveInfo(moveName);
                if (details?.type) {
                  moveTypes[moveName] = details.type;
                }
              });
              setMoveset(movePickerPokemon.name, moves, moveTypes);
              showToast("Moves saved");
            }}
            onClose={() => setMovePickerPokemon(null)}
          />
        )}

        {setEditorPokemon && (
          <PokemonSetModal
            pokemon={setEditorPokemon}
            currentSet={getPokemonSet(setEditorPokemon.name)}
            onSave={(patch) => {
              updatePokemonSet(setEditorPokemon.name, patch);
              showToast(
                patch.moves?.length ? "Meta set applied (moves + EVs)" : "Set saved",
              );
              setSetEditorPokemon(null);
            }}
            onClose={() => setSetEditorPokemon(null)}
          />
        )}

        {showShowdownImport && (
          <ShowdownImportModal
            onImport={handleShowdownImport}
            onClose={() => setShowShowdownImport(false)}
            isLoading={showdownImporting}
          />
        )}

        <SpeedTierTable team={team} sets={activeTeam?.sets} />
        <MetaThreatHints team={team} regulationId={regulationId} />
        <TeamAnalysis
          team={team}
          sets={activeTeam?.sets}
          teamName={activeTeam?.name || "Team"}
          regulationId={regulationId}
        />
        <TeamAITips
          team={team}
          sets={activeTeam?.sets}
          roles={activeTeam?.roles}
          bringList={bringList}
          regulationId={regulationId}
          regulationLabel={regulation.label}
        />

        <AddPokemonModal
          isOpen={showAddModal}
          onClose={closeAddModal}
          onAdd={handleAddPokemon}
          canAdd={canAddToTeam()}
          teamNames={teamNames}
        />
      </div>
    </div>
  );
};

export default TeamBuilder;

