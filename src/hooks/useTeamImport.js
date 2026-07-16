import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchPokemon } from "../api";
import TeamContext from "../contexts/TeamContext";
import { buildMoveTypesMap, learnsetMapFromPokemon } from "../utils/resolveMoveTypes";
import { decodeTeamFromShare } from "../utils/teamExport";
import { parseShowdownPaste } from "../utils/showdownTeam";
import { useToast } from "../components/ToastProvider";

export function useTeamImport({ onUndo, onShowdownImportComplete }) {
  const { addTeamWithRoster, setCurrentTeamPokemon, setBringList } =
    useContext(TeamContext);
  const { showToast, showUndoToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showdownImporting, setShowdownImporting] = useState(false);
  const importedShareTeamRef = useRef(null);
  const teamShareParam = searchParams.get("team");

  useEffect(() => {
    if (!teamShareParam || importedShareTeamRef.current === teamShareParam) {
      return undefined;
    }

    const decoded = decodeTeamFromShare(teamShareParam);
    if (!decoded || decoded.pokemon.length === 0) {
      setSearchParams({}, { replace: true });
      return undefined;
    }

    importedShareTeamRef.current = teamShareParam;
    let cancelled = false;

    Promise.all(decoded.pokemon.slice(0, 6).map((name) => searchPokemon(name)))
      .then((resolvedPokemon) => {
        if (cancelled) {
          return;
        }

        const fullTeam = resolvedPokemon.filter(Boolean);
        if (fullTeam.length > 0) {
          addTeamWithRoster(
            decoded.name,
            fullTeam,
            decoded.sets || null,
            decoded.roles || null,
            decoded.bringList || null,
            decoded.regulationId || null,
          );
          showUndoToast(`Imported "${decoded.name}"`, onUndo, "success");
        }
        setSearchParams({}, { replace: true });
      })
      .catch(() => {
        if (!cancelled) {
          importedShareTeamRef.current = null;
          showToast("Failed to import team", "error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    teamShareParam,
    addTeamWithRoster,
    showUndoToast,
    onUndo,
    showToast,
    setSearchParams,
  ]);

  const handleShowdownImport = useCallback(
    async (pasteText) => {
      setShowdownImporting(true);
      const parsedEntries = parseShowdownPaste(pasteText);
      if (parsedEntries.length === 0) {
        showToast("No Pokémon found in paste", "error");
        setShowdownImporting(false);
        return;
      }

      try {
        const resolvedEntries = await Promise.all(
          parsedEntries.map(async (entry) => {
            let pokemon = await searchPokemon(entry.apiId);
            if (!pokemon && entry.speciesLine) {
              pokemon = await searchPokemon(
                entry.speciesLine.toLowerCase().replace(/\s+/g, "-"),
              );
            }
            if (!pokemon) {
              return null;
            }

            const moveTypes = await buildMoveTypesMap(
              entry.moves,
              learnsetMapFromPokemon(pokemon),
            );
            return { pokemon, entry, moveTypes };
          }),
        );

        const fullTeam = [];
        const sets = {};
        resolvedEntries.forEach((resolved) => {
          if (!resolved) {
            return;
          }

          const { pokemon, entry, moveTypes } = resolved;
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
        });

        if (fullTeam.length === 0) {
          showToast("Could not resolve species from paste", "error");
          return;
        }

        setCurrentTeamPokemon(fullTeam, sets);
        setBringList([]);
        showUndoToast(
          `Imported ${fullTeam.length} Pokémon from Showdown`,
          onUndo,
          "success",
        );
        onShowdownImportComplete();
      } catch {
        showToast("Showdown import failed", "error");
      } finally {
        setShowdownImporting(false);
      }
    },
    [
      onShowdownImportComplete,
      onUndo,
      setBringList,
      setCurrentTeamPokemon,
      showToast,
      showUndoToast,
    ],
  );

  return {
    handleShowdownImport,
    showdownImporting,
  };
}
