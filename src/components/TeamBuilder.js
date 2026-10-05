import React, { useState, useContext, useRef, useEffect, useMemo, useCallback } from "react";
import TeamContext from "../contexts/TeamContext";
import { useRegulation } from "../contexts/RegulationContext";
import { useToast } from "./ToastProvider";
import { searchPokemon } from "../api";
import { buildMoveTypesMap, learnsetMapFromPokemon } from "../utils/resolveMoveTypes";
import TeamSlot from "./TeamSlot";
import TeamEmptyState from "./TeamEmptyState";
import TeamBuildGuide from "./TeamBuildGuide";
import TeamReport from "./TeamReport";
import BuildStepSection from "./BuildStepSection";
import MovePickerModal from "./MovePickerModal";
import RegulationSelector from "./RegulationSelector";
import RegulationWarnings from "./RegulationWarnings";
import PokemonSetModal from "./PokemonSetModal";
import ShowdownImportModal from "./ShowdownImportModal";
import SuggestSixthPanel from "./SuggestSixthPanel";
import TeammateSuggestions from "./TeammateSuggestions";
import TunePanels from "./TunePanels";
import TeamAITips from "./TeamAITips";
import Navbar from "./Navbar";
import ApiStatusChip from "./ApiStatusChip";
import AddPokemonModal from "./AddPokemonModal";
import { normalizeSpeciesId, formatSpeciesLabel } from "../utils/regulation";
import { useTeamBuilderModals } from "../hooks/useTeamBuilderModals";
import { useTeamImport } from "../hooks/useTeamImport";
import { useTeamLearnsets } from "../hooks/useTeamLearnsets";
import {
  getTeamExportText,
  getTeamShowdownExport,
  buildTeamShareUrl,
} from "../utils/teamExport";
import { copyTextToClipboard } from "../utils/clipboard";
import {
  buildTeamLibraryBackup,
  parseTeamLibraryBackup,
} from "../utils/teamStorage";
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
    removeTeam,
    renameTeam,
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
    mergeImportedTeamLibrary,
  } = useContext(TeamContext);
  const { showToast, showUndoToast } = useToast();
  const { regulation, regulationId, validateTeam } = useRegulation();
  const {
    showAddModal,
    openAddModal,
    closeAddModal,
    showExportMenu,
    toggleExportMenu,
    closeExportMenu,
    exportMenuRef,
    showRenameModal,
    openRenameModal,
    closeRenameModal,
    renameValue,
    setRenameValue,
    renameModalRef,
    teamToDelete,
    openDeleteModal,
    closeDeleteModal,
    deleteModalRef,
    movePickerPokemon,
    openMovePicker,
    closeMovePicker,
    setEditorPokemon,
    openSetEditor,
    closeSetEditor,
    shareLinkCopied,
    markShareLinkCopied,
    showShowdownImport,
    openShowdownImport,
    closeShowdownImport,
  } = useTeamBuilderModals();
  const [metaFocusIndex, setMetaFocusIndex] = useState(0);
  const [activeBuildStepId, setActiveBuildStepId] = useState("build");
  const [tuneTabId, setTuneTabId] = useState("coverage");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef(null);
  const suggestedStepRef = useRef("build");
  const { learnsetBySpecies, isLoading: isLoadingLearnsets } = useTeamLearnsets(
    team,
    activeTeam?.sets,
  );

  const validateTeamWithLearnsets = useCallback(
    (roster, options = {}) =>
      validateTeam(roster, {
        ...options,
        learnsetBySpecies,
        learnsetValidationPending: isLoadingLearnsets,
      }),
    [validateTeam, learnsetBySpecies, isLoadingLearnsets],
  );

  const workflow = useMemo(
    () =>
      computeTeamBuildHealth({
        team,
        sets: activeTeam?.sets,
        validateTeam: validateTeamWithLearnsets,
        learnsetValidationPending: isLoadingLearnsets,
      }),
    [team, activeTeam?.sets, validateTeamWithLearnsets, isLoadingLearnsets],
  );

  useEffect(() => {
    const { suggestedStepId } = workflow;
    const stepOrder = BUILD_STEPS.map((step) => step.id);
    const previousSuggested = suggestedStepRef.current;
    const previousIndex = stepOrder.indexOf(previousSuggested);
    const nextIndex = stepOrder.indexOf(suggestedStepId);

    if (team.length === 0) {
      setActiveBuildStepId("build");
    } else if (nextIndex > previousIndex && activeBuildStepId === previousSuggested) {
      setActiveBuildStepId(suggestedStepId);
    }

    suggestedStepRef.current = suggestedStepId;
  }, [workflow, team.length, activeBuildStepId]);

  useEffect(() => {
    if (!showMoreMenu) return undefined;
    const handlePointerDown = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showMoreMenu]);

  const handleBuildStepChange = useCallback((stepId) => {
    setActiveBuildStepId(stepId);
  }, []);

  const handleReportNavigate = useCallback(
    (issue) => {
      if (issue?.stepId) {
        setActiveBuildStepId(issue.stepId);
      }
      if (issue?.tuneTab) {
        setTuneTabId(issue.tuneTab);
      }
      if (issue?.speciesName) {
        const index = team.findIndex((entry) => entry?.name === issue.speciesName);
        if (index >= 0) {
          setMetaFocusIndex(index);
          const pokemon = team[index];
          if (pokemon) {
            openSetEditor(pokemon);
          }
        }
      }
    },
    [team, openSetEditor],
  );

  const getStepMeta = useCallback(
    (stepId) => workflow.steps.find((step) => step.id === stepId) || { status: "upcoming" },
    [workflow.steps],
  );

  const handleUndo = useCallback(() => {
    if (undoLastChange()) {
      showToast("Restored", "success");
    }
  }, [undoLastChange, showToast]);

  const { handleShowdownImport, showdownImporting } = useTeamImport({
    onUndo: handleUndo,
    onShowdownImportComplete: closeShowdownImport,
  });

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

  useEffect(() => {
    if (!storageError) {
      return;
    }
    showToast(storageError, "error");
    clearStorageError();
  }, [storageError, clearStorageError, showToast]);

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
    openAddModal();
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
    setShowMoreMenu(false);
    if (window.confirm("Are you sure you want to clear your entire team?")) {
      clearTeam();
      showUndoToast("Team cleared", handleUndo, "info");
    }
  };

  const handleNewTeam = () => {
    setShowMoreMenu(false);
    addTeam();
    showToast("New team created", "success");
  };

  const handleRenameOpen = () => {
    setShowMoreMenu(false);
    openRenameModal(activeTeam?.name);
  };

  const handleRenameSubmit = () => {
    const name = renameValue.trim();
    if (name && activeTeamId) {
      renameTeam(activeTeamId, name);
      showToast("Team renamed", "success");
      closeRenameModal();
    }
  };

  const handleDeleteTeam = () => {
    setShowMoreMenu(false);
    if (teams.length <= 1) {
      showToast("Keep at least one team", "info");
      return;
    }
    openDeleteModal(activeTeamId);
  };

  const confirmDeleteTeam = () => {
    if (teamToDelete) {
      const deletedName =
        teams.find((entry) => entry.id === teamToDelete)?.name || "Team";
      removeTeam(teamToDelete);
      showUndoToast(`Deleted "${deletedName}"`, handleUndo, "info");
      closeDeleteModal();
    }
  };

  const backupFileInputRef = useRef(null);

  const copyWithFeedback = useCallback(
    async (text, successMessage, { closeMenu = false, onSuccess } = {}) => {
      const result = await copyTextToClipboard(text);
      if (result.ok) {
        showToast(successMessage, "success");
        if (closeMenu) {
          closeExportMenu();
        }
        if (onSuccess) {
          onSuccess();
        }
        return;
      }

      showToast(
        "Clipboard blocked — text is selected in a temporary box so you can copy manually (Ctrl/Cmd+C).",
        "error",
      );
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.top = "20%";
        textarea.style.left = "50%";
        textarea.style.transform = "translateX(-50%)";
        textarea.style.zIndex = "10000";
        textarea.style.width = "min(90vw, 480px)";
        textarea.style.height = "160px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        window.setTimeout(() => {
          if (textarea.parentNode) {
            textarea.parentNode.removeChild(textarea);
          }
        }, 20000);
      } catch {
        // ignore DOM fallback failure
      }
      if (closeMenu) {
        closeExportMenu();
      }
    },
    [showToast, closeExportMenu],
  );

  const handleCopyAsText = () => {
    const text = getTeamExportText(team, activeTeam?.name || "Team", activeTeam?.sets);
    copyWithFeedback(text, "Copied to clipboard", { closeMenu: true });
  };

  const handleCopyShowdown = () => {
    const text = getTeamShowdownExport(team, activeTeam?.name || "Team", activeTeam?.sets);
    copyWithFeedback(text, "Showdown paste copied", { closeMenu: true });
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

    copyWithFeedback(url, "Share link copied (includes regulation & roles)", {
      onSuccess: markShareLinkCopied,
    });
  };

  const handleDownloadTeamLibraryBackup = () => {
    const backup = buildTeamLibraryBackup(teams);
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vgc-team-lab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Team library backup downloaded", "success");
    setShowMoreMenu(false);
  };

  const handleRestoreTeamLibraryBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseTeamLibraryBackup(text);
      if (!parsed.ok) {
        showToast(parsed.error, "error");
        return;
      }
      const addedCount = mergeImportedTeamLibrary(parsed.teams);
      showUndoToast(
        `Restored ${addedCount} team${addedCount === 1 ? "" : "s"} from backup`,
        handleUndo,
        "success",
      );
    } catch {
      showToast("Could not read backup file", "error");
    }
    setShowMoreMenu(false);
  };

  return (
    <div className="team-builder-container">
      <Navbar />
      <div className="team-builder-content">
        {team.length === 0 ? (
          <section className="team-builder-hero card-surface team-builder-hero-compact">
            <ApiStatusChip />
            <div className="team-builder-hero-text">
              <p className="team-builder-hero-eyebrow">VGC team lab</p>
              <h1>Build your {regulation.label} squad</h1>
              <p className="team-builder-hero-copy">
                Import a paste or fill six slots, then use the Team report to fix legality and matchup
                gaps before you export.
              </p>
            </div>
          </section>
        ) : (
          <div className="team-builder-compact-banner">
            <ApiStatusChip />
            <p className="team-builder-compact-banner-copy">
              <strong>{regulation.label}</strong> · edit sets on each slot · follow the Team report
            </p>
          </div>
        )}

        <div className="team-builder-header">
          <div className="team-builder-actions">
            <div className="team-selector-row">
              <select
                className="team-select"
                value={activeTeamId || ""}
                onChange={(e) => setActiveTeam(e.target.value)}
                aria-label="Select team"
              >
                {teams.map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.name}</option>
                ))}
              </select>
              <button
                type="button"
                className="action-btn"
                onClick={openShowdownImport}
                title="Import Showdown paste"
              >
                Import
              </button>
              <div className="export-dropdown" ref={exportMenuRef}>
                <button
                  type="button"
                  className="action-btn save-btn"
                  onClick={toggleExportMenu}
                  disabled={team.length === 0}
                  title="Export or share"
                >
                  Export ▼
                </button>
                {showExportMenu && (
                  <div className="export-menu">
                    <button type="button" onClick={handleCopyShowdown}>Copy Showdown paste</button>
                    <button type="button" onClick={handleCopyAsText}>Copy as text</button>
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
              <div className="more-dropdown" ref={moreMenuRef}>
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setShowMoreMenu((open) => !open)}
                  aria-expanded={showMoreMenu}
                  aria-haspopup="menu"
                >
                  More ▼
                </button>
                {showMoreMenu && (
                  <div className="export-menu" role="menu">
                    <button type="button" onClick={handleNewTeam}>New team</button>
                    <button type="button" onClick={handleRenameOpen}>Rename</button>
                    <button
                      type="button"
                      onClick={handleDeleteTeam}
                      disabled={teams.length <= 1}
                    >
                      Delete team
                    </button>
                    <button
                      type="button"
                      onClick={handleClearTeam}
                      disabled={team.length === 0}
                    >
                      Clear roster
                    </button>
                    <button type="button" onClick={handleDownloadTeamLibraryBackup}>
                      Download all teams backup
                    </button>
                    <button
                      type="button"
                      onClick={() => backupFileInputRef.current?.click()}
                    >
                      Restore teams backup
                    </button>
                  </div>
                )}
              </div>
              <input
                ref={backupFileInputRef}
                type="file"
                accept="application/json,.json"
                className="team-backup-file-input"
                onChange={handleRestoreTeamLibraryBackup}
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>
          </div>
        </div>

        <div className="team-builder-workflow-sticky">
          <RegulationSelector compact />
          <TeamBuildGuide
            steps={workflow.steps}
            activeStepId={activeBuildStepId}
            onStepChange={handleBuildStepChange}
          />
          <TeamReport
            health={workflow.health}
            teamLength={team.length}
            onNavigateIssue={handleReportNavigate}
          />
        </div>

        {teamToDelete && (
          <div className="modal-overlay" onClick={closeDeleteModal} role="presentation">
            <div
              className="confirm-modal"
              ref={deleteModalRef}
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <p>Delete this team? This cannot be undone.</p>
              <div className="confirm-modal-actions">
                <button type="button" className="action-btn" onClick={closeDeleteModal}>Cancel</button>
                <button type="button" className="action-btn clear-btn" onClick={confirmDeleteTeam}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {showRenameModal && (
          <div className="modal-overlay" onClick={closeRenameModal} role="presentation">
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
                <button type="button" className="action-btn" onClick={closeRenameModal}>Cancel</button>
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
          stepId="build"
          stepNumber={1}
          title="Build the roster"
          description="Fill slots from Import, Add, or meta partners. Finish moves, ability, item, and nature on each slot."
          status={getStepMeta("build").status}
          isActive={activeBuildStepId === "build"}
          onActivate={() => handleBuildStepChange("build")}
        >
          {team.length === 0 && (
            <TeamEmptyState
              onAddFirst={() => handleSlotClick(0)}
              onImport={openShowdownImport}
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
          stepId="check"
          stepNumber={2}
          title="Check legality"
          description={`Confirm your squad meets ${regulation.label} rules — species clause, restricteds, items, and move learnsets.`}
          status={getStepMeta("check").status}
          isActive={activeBuildStepId === "check"}
          onActivate={() => handleBuildStepChange("check")}
        >
          <RegulationWarnings
            team={team}
            sets={activeTeam?.sets}
            learnsetBySpecies={learnsetBySpecies}
            isLoadingLearnsets={isLoadingLearnsets}
          />
        </BuildStepSection>

        <BuildStepSection
          stepId="tune"
          stepNumber={3}
          title="Tune matchups"
          description="Coverage, meta gaps, speed tiers, and bring-4 preview — one tab at a time."
          status={getStepMeta("tune").status}
          isActive={activeBuildStepId === "tune"}
          onActivate={() => handleBuildStepChange("tune")}
        >
          <TunePanels
            team={team}
            sets={activeTeam?.sets}
            teamName={activeTeam?.name || "Team"}
            regulationId={regulationId}
            bringList={bringList}
            onToggleBring={toggleBringPokemon}
            setBringList={setBringList}
            activeTabId={tuneTabId}
            onTabChange={setTuneTabId}
          />
        </BuildStepSection>

        <TeamAITips
          team={team}
          sets={activeTeam?.sets}
          roles={activeTeam?.roles}
          bringList={bringList}
          regulationId={regulationId}
          regulationLabel={regulation.label}
        />

        <BuildStepSection
          stepId="share"
          stepNumber={4}
          title="Share or export"
          description="Copy a Showdown paste, plain-text summary, or share link with regulation and roles baked in."
          status={getStepMeta("share").status}
          isActive={activeBuildStepId === "share"}
          onActivate={() => handleBuildStepChange("share")}
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
            <button
              type="button"
              className="build-step-export-card"
              onClick={handleDownloadTeamLibraryBackup}
            >
              <span className="build-step-export-card-title">Backup all teams</span>
              <span className="build-step-export-card-copy">
                Download a JSON file of every team in this browser — restore anytime from More.
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
            onClose={closeMovePicker}
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
              closeSetEditor();
            }}
            onClose={closeSetEditor}
          />
        )}

        {showShowdownImport && (
          <ShowdownImportModal
            onImport={handleShowdownImport}
            onClose={closeShowdownImport}
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
