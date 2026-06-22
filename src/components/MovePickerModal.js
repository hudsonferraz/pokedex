import React, { useState, useEffect, useMemo, useRef } from "react";
import { getTypeColor } from "../constants/typeColors";
import { useModalAccessibility } from "../hooks/useModalAccessibility";
import { useLazyMoveDetails } from "../hooks/useLazyMoveDetails";
import { fetchPokemonMeta } from "../services/metaDataService";
import "./MovePickerModal.css";

const MAX_MOVES = 4;

const MovePickerModal = ({
  pokemon,
  currentMoves,
  regulationId,
  onSave,
  onClose,
}) => {
  const [selected, setSelected] = useState(() =>
    currentMoves && currentMoves.length ? [...currentMoves] : [],
  );
  const [search, setSearch] = useState("");
  const [hoveredMoveName, setHoveredMoveName] = useState(null);
  const [metaMoveIds, setMetaMoveIds] = useState([]);
  const modalRef = useModalAccessibility(true, onClose);
  const listRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (!regulationId || !pokemon?.name) {
      setMetaMoveIds([]);
      return undefined;
    }

    fetchPokemonMeta(regulationId, pokemon.name).then((result) => {
      if (cancelled) return;
      const moves = result?.suggestedSet?.moves || [];
      setMetaMoveIds(moves.slice(0, 4));
    });

    return () => {
      cancelled = true;
    };
  }, [regulationId, pokemon?.name]);

  const learnset = (pokemon?.moves || [])
    .map((m) => m.move.name)
    .filter(Boolean);
  const uniqueMoves = useMemo(
    () => [...new Set(learnset)].sort((a, b) => a.localeCompare(b)),
    [learnset],
  );

  const searchFilteredNames = useMemo(() => {
    if (!search.trim()) {
      return uniqueMoves;
    }
    const query = search.toLowerCase().replace(/-/g, " ");
    return uniqueMoves.filter((name) => name.replace(/-/g, " ").includes(query));
  }, [uniqueMoves, search]);

  const { moveDetails, requestMoveDetails } = useLazyMoveDetails({
    pokemon,
    selectedMoves: selected,
    metaMoveIds,
    searchQuery: search,
    filteredMoveNames: searchFilteredNames,
  });

  const getType = (moveName) => moveDetails[moveName]?.type || null;

  const getDetails = (moveName) => moveDetails[moveName] || null;

  const formatMoveStats = (details) => {
    if (!details) return null;
    const parts = [];
    if (details.power != null) parts.push(`${details.power} Power`);
    else parts.push("— Power");
    if (details.accuracy != null) parts.push(`${details.accuracy}%`);
    else parts.push("—%");
    parts.push(`${details.pp != null ? details.pp : "—"} PP`);
    const cls = details.damageClass
      ? details.damageClass.replace(/-/g, " ")
      : "—";
    parts.push(cls.charAt(0).toUpperCase() + cls.slice(1));
    return parts.join(" · ");
  };

  const movesByType = useMemo(() => {
    const map = {};
    uniqueMoves.forEach((name) => {
      const type = moveDetails[name]?.type || "other";
      if (!map[type]) map[type] = [];
      map[type].push(name);
    });
    const order = [
      "normal",
      "fire",
      "water",
      "electric",
      "grass",
      "ice",
      "fighting",
      "poison",
      "ground",
      "flying",
      "psychic",
      "bug",
      "rock",
      "ghost",
      "dragon",
      "dark",
      "steel",
      "fairy",
      "other",
    ];
    return order
      .filter((t) => map[t] && map[t].length > 0)
      .map((type) => ({ type, moves: map[type] }));
  }, [uniqueMoves, moveDetails]);

  const filteredBySearch = useMemo(() => {
    if (!search.trim()) {
      return movesByType;
    }
    const allowedNames = new Set(searchFilteredNames);
    return movesByType
      .map(({ type, moves }) => ({
        type,
        moves: moves.filter((name) => allowedNames.has(name)),
      }))
      .filter((group) => group.moves.length > 0);
  }, [movesByType, search, searchFilteredNames]);

  useEffect(() => {
    setSelected(
      Array.isArray(currentMoves) ? currentMoves.slice(0, MAX_MOVES) : [],
    );
  }, [pokemon?.name, currentMoves]);

  useEffect(() => {
    if (search.trim()) {
      return undefined;
    }

    const listElement = listRef.current;
    if (!listElement) {
      return undefined;
    }

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          const moveName = entry.target.dataset.moveName;
          if (moveName) {
            requestMoveDetails(moveName);
          }
          observerRef.current?.unobserve(entry.target);
        });
      },
      { root: listElement, rootMargin: "120px" },
    );

    listElement
      .querySelectorAll("[data-move-name]")
      .forEach((element) => observerRef.current.observe(element));

    return () => observerRef.current?.disconnect();
  }, [filteredBySearch, search, requestMoveDetails]);

  useEffect(() => {
    if (hoveredMoveName) {
      requestMoveDetails(hoveredMoveName);
    }
  }, [hoveredMoveName, requestMoveDetails]);

  const toggle = (moveName) => {
    setSelected((prev) => {
      if (prev.includes(moveName)) return prev.filter((m) => m !== moveName);
      if (prev.length >= MAX_MOVES) return prev;
      return [...prev, moveName];
    });
  };

  const handleSave = () => {
    onSave(selected.slice(0, MAX_MOVES));
    onClose();
  };

  const displayName = (name) => (name || "").replace(/-/g, " ");

  const slotLabels = [1, 2, 3, 4].map((i) => {
    const moveName = selected[i - 1];
    return { slot: i, moveName: moveName || null };
  });

  const hoveredDetails = hoveredMoveName ? getDetails(hoveredMoveName) : null;
  const hoveredEffectLoading = Boolean(hoveredMoveName && !hoveredDetails);
  const hoveredEffect = hoveredDetails?.effect || null;

  return (
    <div className="move-picker-overlay" onClick={onClose} role="presentation">
      <div
        className="move-picker-modal"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-picker-title"
      >
        <div className="move-picker-header">
          <h2 id="move-picker-title">Choose 4 moves — {displayName(pokemon?.name)}</h2>
          <button
            type="button"
            className="move-picker-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="move-picker-slots">
          <p className="move-picker-slots-label">Your moveset</p>
          <div className="move-picker-slots-grid">
            {slotLabels.map(({ slot, moveName }) => (
              <div key={slot} className="move-picker-slot">
                <span className="move-picker-slot-num">Slot {slot}</span>
                {moveName ? (
                  <button
                    type="button"
                    className="move-picker-slot-value filled"
                    onClick={() => toggle(moveName)}
                    title="Click to remove"
                  >
                    {displayName(moveName)}
                    {getType(moveName) && (
                      <span
                        className="move-picker-slot-type"
                        style={{
                          backgroundColor: getTypeColor(getType(moveName)),
                        }}
                      >
                        {getType(moveName)}
                      </span>
                    )}
                  </button>
                ) : (
                  <span className="move-picker-slot-value empty">Empty</span>
                )}
              </div>
            ))}
          </div>
          <p className="move-picker-hint">
            Click a move below to add; click a filled slot to remove.
            {metaMoveIds.length > 0 && " Moves marked Meta are common on Pikalytics."}
          </p>
        </div>

        <div className="move-picker-search-wrap">
          <input
            id="move-picker-search"
            type="text"
            className="move-picker-search"
            placeholder="Search a move, e.g. Solar Beam, Earthquake..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search moves"
          />
        </div>

        <div className="move-picker-effect-preview" aria-live="polite">
          {hoveredEffectLoading ? (
            <span className="move-picker-effect-preview-placeholder">
              Loading move details…
            </span>
          ) : hoveredMoveName && hoveredEffect ? (
            <>
              <span className="move-picker-effect-preview-label">
                {displayName(hoveredMoveName)}:
              </span>{" "}
              <span className="move-picker-effect-preview-text">
                {hoveredEffect}
              </span>
            </>
          ) : (
            <span className="move-picker-effect-preview-placeholder">
              Hover a move to see its effect
            </span>
          )}
        </div>

        <div className="move-picker-list" ref={listRef}>
          {filteredBySearch.length === 0 ? (
            <p className="move-picker-no-results">No moves match.</p>
          ) : (
            filteredBySearch.map(({ type, moves: typeMoves }) => (
              <div key={type} className="move-picker-type-group">
                <h4
                  className="move-picker-type-heading"
                  style={{
                    borderColor: getTypeColor(type),
                  }}
                >
                  {type === "other" ? "Other" : type}
                </h4>
                <div className="move-picker-type-moves">
                  {typeMoves.map((name) => {
                    const details = getDetails(name);
                    return (
                      <span
                        key={name}
                        className="move-picker-item-wrap"
                        data-move-name={name}
                        onMouseEnter={() => setHoveredMoveName(name)}
                        onMouseLeave={() => setHoveredMoveName(null)}
                      >
                        <button
                          type="button"
                          className={`move-picker-item ${selected.includes(name) ? "selected" : ""} ${
                            metaMoveIds.includes(name) ? "meta-move" : ""
                          }`}
                          onClick={() => toggle(name)}
                          disabled={
                            !selected.includes(name) &&
                            selected.length >= MAX_MOVES
                          }
                        >
                          <div className="move-picker-item-top">
                            {getType(name) && (
                              <span
                                className="move-picker-item-type"
                                style={{
                                  backgroundColor: getTypeColor(getType(name)),
                                }}
                              >
                                {getType(name)}
                              </span>
                            )}
                            <span className="move-picker-item-name">
                              {displayName(name)}
                              {metaMoveIds.includes(name) && (
                                <span className="move-picker-meta-tag">Meta</span>
                              )}
                            </span>
                          </div>
                          {details && (
                            <span className="move-picker-item-stats">
                              {formatMoveStats(details)}
                            </span>
                          )}
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="move-picker-footer">
          <button
            type="button"
            className="move-picker-btn cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="move-picker-btn save"
            onClick={handleSave}
          >
            Save moves
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovePickerModal;
