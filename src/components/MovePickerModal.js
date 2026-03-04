import React, { useState, useEffect, useMemo } from "react";
import "./MovePickerModal.css";

const MAX_MOVES = 4;
const TYPE_COLORS = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

const MovePickerModal = ({
  pokemon,
  currentMoves,
  moveDetails = null,
  moveDetailsLoading = false,
  onSave,
  onClose,
}) => {
  const [selected, setSelected] = useState(() =>
    currentMoves && currentMoves.length ? [...currentMoves] : [],
  );
  const [search, setSearch] = useState("");
  const [hoveredMoveName, setHoveredMoveName] = useState(null);

  const learnset = (pokemon?.moves || [])
    .map((m) => m.move.name)
    .filter(Boolean);
  const uniqueMoves = useMemo(
    () => [...new Set(learnset)].sort((a, b) => a.localeCompare(b)),
    [learnset],
  );

  const getType = (moveName) => {
    if (moveDetails && moveDetails[moveName] && moveDetails[moveName].type) {
      return moveDetails[moveName].type;
    }
    return null;
  };

  const getDetails = (moveName) =>
    moveDetails && moveDetails[moveName] ? moveDetails[moveName] : null;

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
      const type = getType(name) || "other";
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
    if (!search.trim()) return movesByType;
    const q = search.toLowerCase().replace(/-/g, " ");
    return movesByType
      .map(({ type, moves }) => ({
        type,
        moves: moves.filter((name) => name.replace(/-/g, " ").includes(q)),
      }))
      .filter((g) => g.moves.length > 0);
  }, [movesByType, search]);

  useEffect(() => {
    setSelected(
      Array.isArray(currentMoves) ? currentMoves.slice(0, MAX_MOVES) : [],
    );
  }, [pokemon?.name, currentMoves]);

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

  return (
    <div className="move-picker-overlay" onClick={onClose}>
      <div className="move-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="move-picker-header">
          <h2>Choose 4 moves — {displayName(pokemon?.name)}</h2>
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
                          backgroundColor:
                            TYPE_COLORS[getType(moveName)] || "#A8A878",
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
          {moveDetailsLoading ? (
            <span className="move-picker-effect-preview-placeholder">
              Loading move details…
            </span>
          ) : hoveredMoveName && getDetails(hoveredMoveName)?.effect ? (
            <>
              <span className="move-picker-effect-preview-label">
                {displayName(hoveredMoveName)}:
              </span>{" "}
              <span className="move-picker-effect-preview-text">
                {getDetails(hoveredMoveName).effect}
              </span>
            </>
          ) : (
            <span className="move-picker-effect-preview-placeholder">
              Hover a move to see its effect
            </span>
          )}
        </div>

        <div className="move-picker-list">
          {filteredBySearch.length === 0 ? (
            <p className="move-picker-no-results">No moves match.</p>
          ) : (
            filteredBySearch.map(({ type, moves: typeMoves }) => (
              <div key={type} className="move-picker-type-group">
                <h4
                  className="move-picker-type-heading"
                  style={{
                    borderColor: TYPE_COLORS[type] || "var(--border-color)",
                  }}
                >
                  {type === "other" ? "Other" : type}
                </h4>
                <div className="move-picker-type-moves">
                  {typeMoves.map((name) => {
                    const details = getDetails(name);
                    const statsLine = formatMoveStats(details);
                    return (
                      <span
                        key={name}
                        className="move-picker-item-wrap"
                        onMouseEnter={() => setHoveredMoveName(name)}
                        onMouseLeave={() => setHoveredMoveName(null)}
                      >
                        <button
                          type="button"
                          className={`move-picker-item ${selected.includes(name) ? "selected" : ""}`}
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
                                  backgroundColor:
                                    TYPE_COLORS[getType(name)] || "#A8A878",
                                }}
                              >
                                {getType(name)}
                              </span>
                            )}
                            <span className="move-picker-item-name">
                              {displayName(name)}
                            </span>
                          </div>
                          {statsLine && (
                            <span className="move-picker-item-stats">
                              {statsLine}
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
