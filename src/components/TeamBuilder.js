import React, { useState, useContext, useRef, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import TeamContext from "../contexts/TeamContext";
import { useRegulation } from "../contexts/RegulationContext";
import { useToast } from "./ToastProvider";
import { searchPokemon } from "../api";
import { buildMoveTypesMap, learnsetMapFromPokemon } from "../utils/resolveMoveTypes";
import TeamSlot from "./TeamSlot";
import TeamAnalysis from "./TeamAnalysis";
import TeamAITips from "./TeamAITips";
import SpeedTierTable from "./SpeedTierTable";
import MetaThreatHints from "./MetaThreatHints";
import TeamEmptyState from "./TeamEmptyState";
import TeamBuildGuide from "./TeamBuildGuide";
import TeamHealthSummary from "./TeamHealthSummary";
import BuildStepSection from "./BuildStepSection";
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
import { ensurePokemonHasLearnset } from "../utils/teamPokemonModel";
import { computeTeamBuildHealth, BUILD_STEPS } from "../utils/teamBuildHealth";
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
    storageError,
    clearStorageError,
    undoLastChange,
  } = useContext(TeamContext);
  const { showToast, showUndoToast } = useToast();
  const { regulation, regulationId, validateTeam } = useRegulation();
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
  const [activeBuildStepId, setActiveBuildStepId] = useState("roster");
  const suggestedStepRef = useRef("roster");

  const workflow = useMemo(
    () =>
      computeTeamBuildHealth({
        team,
        sets: activeTeam?.sets,
        validateTeam,
      }),
    [team, activeTeam?.sets, validateTeam],
  );

  useEffect(() => {
    const { suggestedStepId } = workflow;
    const stepOrder = BUILD_STEPS.map((step) => step.id);
    const previousSuggested = suggestedStepRef.current;
    const previousIndex = stepOrder.indexOf(previousSuggested);
    const nextIndex = stepOrder.indexOf(suggestedStepId);

    if (team.length === 0) {
      setActiveBuildStepId("roster");
    } else if (nextIndex > previousIndex && activeBuildStepId === previousSuggested) {
      setActiveBuildStepId(suggestedStepId);
    }

    suggestedStepRef.current = suggestedStepId;
  }, [workflow, team.length, activeBuildStepId]);

  const handleBuildStepChange = useCallback((stepId) => {
    setActiveBuildStepId(stepId);
  }, []);

  const getStepMeta = useCallback(
    (stepId) => workflow.steps.find((step) => step.id === stepId) || { status: "upcoming" },
    [workflow.steps],
  );

  const handleUndo = useCallback(() => {
    if (undoLastChange()) {
      showToast("Restored", "success");
    }
  }, [undoLastChange, showToast]);

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

  useEffect(() => {
    if (!storageError) {
      return;
    }
    showToast(storageError, "error");
    clearStorageError();
  }, [storageError, clearStorageError, showToast]);

  const openMovePicker = async (pokemon) => {
    const hydratedPokemon = await ensurePokemonHasLearnset(pokemon);
    setMovePickerPokemon(hydratedPokemon);
  };

  const openSetEditor = async (pokemon) => {
    const hydratedPokemon = await ensurePokemonHasLearnset(pokemon);
    setSetEditorPokemon(hydratedPokemon);
  };

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
          addTeamWithRoster(
            decoded.name,
            fullTeam,
            decoded.sets || null,
            decoded.roles || null,
            decoded.bringList || null,
            decoded.regulationId || null,
          );
          showUndoToast(`Imported "${decoded.name}"`, handleUndo, "success");
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
    showUndoToast(`${pokemonName} removed from team`, handleUndo, "info");
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
      showUndoToast("Team cleared", handleUndo, "info");
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
      const deletedName =
        teams.find((entry) => entry.id === teamToDelete)?.name || "Team";
      removeTeam(teamToDelete);
      showUndoToast(`Deleted "${deletedName}"`, handleUndo, "info");
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
        if (!pokemon && entry.speciesLine) {
          pokemon = await searchPokemon(
            entry.speciesLine.toLowerCase().replace(/\s+/g, "-"),
          );
        }
        if (!pokemon) continue;

        const moveTypes = await buildMoveTypesMap(entry.moves, learnsetMapFromPokemon(pokemon));

        fullTeam.push(pokemon);
        sets[pokemon.name] = {
          moves: entry.moves,
          moveTypes,
          ability: entry.ability,
          item: entry.item,
          nature: entry.nature,
          teraType: entry.teraType,
          evs: entry.evs,
          ivs: entry.ivs,
          level: entry.level,
          gender: entry.gender,
          shiny: entry.shiny,
          happiness: entry.happiness,
          nickname: entry.nickname,
        };
      }

      if (fullTeam.length === 0) {
        showToast("Could not resolve species from paste", "error");
        return;
      }

      setCurrentTeamPokemon(fullTeam, sets);
      setBringList([]);
      showUndoToast(`Imported ${fullTeam.length} Pokémon from Showdown`, handleUndo, "success");
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
      activeTeam?.regulationId || regulationId,
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
              Follow the six-step workflow below — roster, sets, legality, matchups, coach, then
              export. Your team health stays pinned as you build.
            </p>
          </div>
          <ul className="team-builder-hero-features" aria-label="Workflow">
            <li>Six-slot roster with meta partners</li>
            <li>Legality &amp; matchup review</li>
            <li>Focused AI coach questions</li>
          </ul>
        </section>

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

        <div className="team-builder-workflow-sticky">
          <RegulationSelector compact />
          <TeamBuildGuide
            steps={workflow.steps}
            activeStepId={activeBuildStepId}
            onStepChange={handleBuildStepChange}
          />
          <TeamHealthSummary
            health={workflow.health}
            onNavigateStep={handleBuildStepChange}
          />
        </div>

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
                onEditSet={openSetEditor}
                onEditMoves={openMovePicker}
              />
            ))}
          </div>
        </div>

        <BuildStepSection
          stepId="roster"
          stepNumber={1}
          title="Build six Pokémon"
          description="Fill every slot. Use partner suggestions and the sixth-slot recommender when you are one short."
          status={getStepMeta("roster").status}
          isActive={activeBuildStepId === "roster"}
          onActivate={() => handleBuildStepChange("roster")}
        >
          {team.length === 0 && (
            <TeamEmptyState
              onAddFirst={() => handleSlotClick(0)}
              regulationLabel={regulation.label}
            />
          )}
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
        </BuildStepSection>

        <BuildStepSection
          stepId="sets"
          stepNumber={2}
          title="Complete sets"
          description="Each Pokémon needs four moves plus ability, item, and nature. Use Edit set on a slot or import a Showdown paste."
          status={getStepMeta("sets").status}
          isActive={activeBuildStepId === "sets"}
          onActivate={() => handleBuildStepChange("sets")}
        >
          <div className="build-step-inline-actions">
            <button
              type="button"
              className="action-btn"
              onClick={() => setShowShowdownImport(true)}
            >
              Import Showdown paste
            </button>
          </div>
          {workflow.health.completedSets.incompleteNames.length > 0 ? (
            <div className="build-step-hint" role="status">
              <strong>Incomplete:</strong>{" "}
              {workflow.health.completedSets.incompleteNames.join(", ")} — open{" "}
              <em>Edit set</em> or <em>Moves</em> on their slot above.
            </div>
          ) : team.length > 0 ? (
            <div className="build-step-hint" role="status">
              All rostered Pokémon have full sets. Review legality next.
            </div>
          ) : (
            <div className="build-step-hint">Add Pokémon to the roster first.</div>
          )}
        </BuildStepSection>

        <BuildStepSection
          stepId="legality"
          stepNumber={3}
          title="Review legality"
          description={`Confirm your squad meets ${regulation.label} rules — species clause, restricteds, items, and learnsets.`}
          status={getStepMeta("legality").status}
          isActive={activeBuildStepId === "legality"}
          onActivate={() => handleBuildStepChange("legality")}
        >
          <RegulationSelector />
          <RegulationWarnings team={team} sets={activeTeam?.sets} />
        </BuildStepSection>

        <BuildStepSection
          stepId="matchups"
          stepNumber={4}
          title="Inspect matchup gaps"
          description="Check meta staples, shared weaknesses, speed tiers, and offensive coverage before you finalize bring-4."
          status={getStepMeta("matchups").status}
          isActive={activeBuildStepId === "matchups"}
          onActivate={() => handleBuildStepChange("matchups")}
        >
          <MetaGapPanel team={team} />
          <MetaThreatHints team={team} regulationId={regulationId} />
          <TeamAnalysis
            team={team}
            sets={activeTeam?.sets}
            teamName={activeTeam?.name || "Team"}
            regulationId={regulationId}
          />
          <SpeedTierTable team={team} sets={activeTeam?.sets} />
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
        </BuildStepSection>

        <BuildStepSection
          stepId="coach"
          stepNumber={5}
          title="Ask the coach a focused question"
          description="Get rule-based tips first, then ask one specific question about speed, typings, or meta — not a generic team review."
          status={getStepMeta("coach").status}
          isActive={activeBuildStepId === "coach"}
          onActivate={() => handleBuildStepChange("coach")}
        >
          <TeamAITips
            team={team}
            sets={activeTeam?.sets}
            roles={activeTeam?.roles}
            bringList={bringList}
            regulationId={regulationId}
            regulationLabel={regulation.label}
          />
        </BuildStepSection>

        <BuildStepSection
          stepId="export"
          stepNumber={6}
          title="Export or share"
          description="Copy a Showdown paste, plain-text summary, or share link with regulation and roles baked in."
          status={getStepMeta("export").status}
          isActive={activeBuildStepId === "export"}
          onActivate={() => handleBuildStepChange("export")}
        >
          <div className="build-step-export-actions">
            <button
              type="button"
              className="build-step-export-card"
              onClick={handleCopyShowdown}
              disabled={team.length === 0}
            >
              <span className="build-step-export-card-title">Showdown paste</span>
              <span className="build-step-export-card-copy">
                Full sets for Pokémon Showdown teambuilder or damage calc.
              </span>
            </button>
            <button
              type="button"
              className="build-step-export-card"
              onClick={handleCopyAsText}
              disabled={team.length === 0}
            >
              <span className="build-step-export-card-title">Plain text</span>
              <span className="build-step-export-card-copy">
                Readable roster summary for notes or Discord.
              </span>
            </button>
            <button
              type="button"
              className={`build-step-export-card ${shareLinkCopied ? "copied-flash" : ""}`}
              onClick={handleCopyShareLink}
              disabled={team.length === 0}
            >
              <span className="build-step-export-card-title">
                {shareLinkCopied ? "Link copied ✓" : "Share link"}
              </span>
              <span className="build-step-export-card-copy">
                URL with team, sets, bring-4, and regulation for collaborators.
              </span>
            </button>
          </div>
        </BuildStepSection>

        {movePickerPokemon && (
          <MovePickerModal
            pokemon={movePickerPokemon}
            currentMoves={getMoveset(movePickerPokemon.name)}
            regulationId={regulationId}
            onSave={async (moves) => {
              const moveTypes = await buildMoveTypesMap(
                moves,
                learnsetMapFromPokemon(movePickerPokemon),
              );
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

