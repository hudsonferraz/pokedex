import React, { useMemo, useState } from "react";
import { ALL_POKEMON_TYPES, getTypeColor } from "../constants/typeColors";
import "./PokemonMovesBrowser.css";

const MOVES_PER_PAGE = 24;

const CATEGORY_OPTIONS = [
  { id: "all", label: "All categories" },
  { id: "physical", label: "Physical" },
  { id: "special", label: "Special" },
  { id: "status", label: "Status" },
];

function formatMoveLabel(name) {
  return (name || "").replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCategory(damageClass) {
  if (!damageClass) {
    return "—";
  }
  return damageClass.replace(/-/g, " ");
}

const PokemonMovesBrowser = ({ allMoves, moveDetails }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(0);

  const filteredMoves = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return allMoves.filter((move) => {
      const details = moveDetails[move.name] || move;
      const moveType = (details.type || move.type || "normal").toLowerCase();
      const category = (details.damageClass || move.damageClass || "").toLowerCase();
      const moveLabel = move.name.replace(/-/g, " ");

      if (normalizedQuery && !moveLabel.includes(normalizedQuery)) {
        return false;
      }

      if (typeFilter !== "all" && moveType !== typeFilter) {
        return false;
      }

      if (categoryFilter !== "all" && category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [allMoves, moveDetails, searchQuery, typeFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMoves.length / MOVES_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageMoves = filteredMoves.slice(
    safePage * MOVES_PER_PAGE,
    safePage * MOVES_PER_PAGE + MOVES_PER_PAGE,
  );

  const resetPage = () => setPage(0);

  return (
    <div className="pokemon-moves-browser">
      <div className="pokemon-moves-browser-controls">
        <label className="pokemon-moves-browser-search">
          <span className="sr-only">Search moves</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              resetPage();
            }}
            placeholder="Search moves…"
            className="pokemon-moves-browser-input"
          />
        </label>

        <select
          className="pokemon-moves-browser-select"
          value={typeFilter}
          onChange={(event) => {
            setTypeFilter(event.target.value);
            resetPage();
          }}
          aria-label="Filter by move type"
        >
          <option value="all">All types</option>
          {ALL_POKEMON_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          className="pokemon-moves-browser-select"
          value={categoryFilter}
          onChange={(event) => {
            setCategoryFilter(event.target.value);
            resetPage();
          }}
          aria-label="Filter by move category"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <p className="pokemon-moves-browser-summary">
        Showing {pageMoves.length} of {filteredMoves.length} moves
        {filteredMoves.length !== allMoves.length
          ? ` (filtered from ${allMoves.length})`
          : ""}
      </p>

      {pageMoves.length === 0 ? (
        <p className="pokemon-moves-browser-empty">No moves match these filters.</p>
      ) : (
        <div className="pokemon-moves-browser-grid">
          {pageMoves.map((move) => {
            const details = moveDetails[move.name] || move;
            const moveType = details.type || move.type || "normal";

            return (
              <article
                key={move.name}
                className="pokemon-move-card card-surface"
                style={{ "--move-accent": getTypeColor(moveType) }}
              >
                <div className="pokemon-move-card-header">
                  <h4 className="pokemon-move-card-name">
                    {formatMoveLabel(move.name)}
                  </h4>
                  <span
                    className="pokemon-move-card-type"
                    style={{ backgroundColor: getTypeColor(moveType) }}
                  >
                    {moveType}
                  </span>
                </div>

                <dl className="pokemon-move-card-stats">
                  <div>
                    <dt>Category</dt>
                    <dd>{formatCategory(details.damageClass)}</dd>
                  </div>
                  <div>
                    <dt>Power</dt>
                    <dd>{details.power ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Accuracy</dt>
                    <dd>{details.accuracy != null ? `${details.accuracy}%` : "—"}</dd>
                  </div>
                  <div>
                    <dt>PP</dt>
                    <dd>{details.pp ?? "—"}</dd>
                  </div>
                  {move.level > 0 && (
                    <div>
                      <dt>Learned</dt>
                      <dd>Lv. {move.level}</dd>
                    </div>
                  )}
                </dl>

                {details.effect && (
                  <p className="pokemon-move-card-effect">{details.effect}</p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pokemon-moves-browser-pagination">
          <button
            type="button"
            className="pokemon-moves-browser-page-btn"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={safePage === 0}
          >
            Previous
          </button>
          <span className="pokemon-moves-browser-page-label">
            Page {safePage + 1} of {totalPages}
          </span>
          <button
            type="button"
            className="pokemon-moves-browser-page-btn"
            onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
            disabled={safePage >= totalPages - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PokemonMovesBrowser;
