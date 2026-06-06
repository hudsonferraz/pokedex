import React from "react";
import { getTypeColor } from "../constants/typeColors";
import { getSortLabel } from "../utils/browseFilters";
import "./BrowseResultsHeader.css";

const BrowseResultsHeader = ({
  visibleCount,
  totalCount,
  page,
  totalPages,
  sortBy,
  selectedTypes,
  selectedGeneration,
  vgcFilters,
  typesLoading,
  onRemoveType,
  onClearGeneration,
  onVgcFilterChange,
  onClearAll,
}) => {
  const hasFilters =
    selectedTypes.length > 0 ||
    selectedGeneration ||
    vgcFilters.top30Meta ||
    vgcFilters.hasUsageData ||
    vgcFilters.legalInRegulation;

  const summaryParts = [`Showing ${visibleCount} of ${totalCount}`];
  if (totalPages > 1) {
    summaryParts.push(`page ${page + 1} of ${totalPages}`);
  }
  summaryParts.push(`sorted by ${getSortLabel(sortBy).toLowerCase()}`);

  return (
    <div className="browse-results-header">
      <p className="browse-results-summary">
        {summaryParts.join(" · ")}
        {typesLoading && (
          <span className="browse-results-loading"> · loading types…</span>
        )}
      </p>

      {hasFilters && (
        <div className="browse-results-chips">
          <span className="browse-results-chips-label">Active:</span>

          {selectedGeneration && (
            <span className="browse-results-chip" style={{ backgroundColor: "#0e6f9f" }}>
              Gen {selectedGeneration}
              <button
                type="button"
                className="browse-results-chip-remove"
                onClick={onClearGeneration}
                aria-label="Remove generation filter"
              >
                ×
              </button>
            </span>
          )}

          {selectedTypes.map((type) => (
            <span
              key={type}
              className="browse-results-chip"
              style={{ backgroundColor: getTypeColor(type) }}
            >
              {type}
              <button
                type="button"
                className="browse-results-chip-remove"
                onClick={() => onRemoveType(type)}
                aria-label={`Remove ${type} filter`}
              >
                ×
              </button>
            </span>
          ))}

          {vgcFilters.top30Meta && (
            <span className="browse-results-chip browse-results-chip-neutral">
              Top 30 meta
              <button
                type="button"
                className="browse-results-chip-remove"
                onClick={() =>
                  onVgcFilterChange({ ...vgcFilters, top30Meta: false })
                }
                aria-label="Remove top 30 meta filter"
              >
                ×
              </button>
            </span>
          )}

          {vgcFilters.hasUsageData && (
            <span className="browse-results-chip browse-results-chip-neutral">
              Has usage data
              <button
                type="button"
                className="browse-results-chip-remove"
                onClick={() =>
                  onVgcFilterChange({ ...vgcFilters, hasUsageData: false })
                }
                aria-label="Remove has usage data filter"
              >
                ×
              </button>
            </span>
          )}

          {vgcFilters.legalInRegulation && (
            <span className="browse-results-chip browse-results-chip-neutral">
              Legal in regulation
              <button
                type="button"
                className="browse-results-chip-remove"
                onClick={() =>
                  onVgcFilterChange({ ...vgcFilters, legalInRegulation: false })
                }
                aria-label="Remove legal in regulation filter"
              >
                ×
              </button>
            </span>
          )}

          <button type="button" className="browse-results-clear-all" onClick={onClearAll}>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default BrowseResultsHeader;
