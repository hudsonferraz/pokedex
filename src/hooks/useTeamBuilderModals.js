import { useCallback, useEffect, useRef, useState } from "react";
import { ensurePokemonHasLearnset } from "../utils/teamPokemonModel";
import { useModalAccessibility } from "./useModalAccessibility";

export function useTeamBuilderModals() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [movePickerPokemon, setMovePickerPokemon] = useState(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [showShowdownImport, setShowShowdownImport] = useState(false);
  const [setEditorPokemon, setSetEditorPokemon] = useState(null);
  const shareLinkTimerRef = useRef(null);
  const exportMenuRef = useRef(null);

  const closeAddModal = useCallback(() => setShowAddModal(false), []);
  const closeRenameModal = useCallback(() => setShowRenameModal(false), []);
  const closeDeleteModal = useCallback(() => setTeamToDelete(null), []);
  const closeShowdownImport = useCallback(() => setShowShowdownImport(false), []);

  const renameModalRef = useModalAccessibility(showRenameModal, closeRenameModal);
  const deleteModalRef = useModalAccessibility(Boolean(teamToDelete), closeDeleteModal);

  const openRenameModal = useCallback((teamName) => {
    setRenameValue(teamName || "");
    setShowRenameModal(true);
  }, []);

  const openMovePicker = useCallback(async (pokemon) => {
    const hydratedPokemon = await ensurePokemonHasLearnset(pokemon);
    setMovePickerPokemon(hydratedPokemon);
  }, []);

  const openSetEditor = useCallback(async (pokemon) => {
    const hydratedPokemon = await ensurePokemonHasLearnset(pokemon);
    setSetEditorPokemon(hydratedPokemon);
  }, []);

  const markShareLinkCopied = useCallback(() => {
    setShareLinkCopied(true);
    window.clearTimeout(shareLinkTimerRef.current);
    shareLinkTimerRef.current = window.setTimeout(() => {
      setShareLinkCopied(false);
    }, 2000);
  }, []);

  useEffect(() => {
    if (!showExportMenu) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportMenu]);

  useEffect(
    () => () => {
      window.clearTimeout(shareLinkTimerRef.current);
    },
    [],
  );

  return {
    showAddModal,
    openAddModal: () => setShowAddModal(true),
    closeAddModal,
    showExportMenu,
    toggleExportMenu: () => setShowExportMenu((visible) => !visible),
    closeExportMenu: () => setShowExportMenu(false),
    exportMenuRef,
    showRenameModal,
    openRenameModal,
    closeRenameModal,
    renameValue,
    setRenameValue,
    renameModalRef,
    teamToDelete,
    openDeleteModal: setTeamToDelete,
    closeDeleteModal,
    deleteModalRef,
    movePickerPokemon,
    openMovePicker,
    closeMovePicker: () => setMovePickerPokemon(null),
    setEditorPokemon,
    openSetEditor,
    closeSetEditor: () => setSetEditorPokemon(null),
    shareLinkCopied,
    markShareLinkCopied,
    showShowdownImport,
    openShowdownImport: () => setShowShowdownImport(true),
    closeShowdownImport,
  };
}
