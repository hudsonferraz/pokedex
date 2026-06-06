import React from "react";
import { SORT_OPTIONS, regulationHasBanList } from "../utils/browseFilters";
import "./BrowseControls.css";

const BrowseControls = ({
  sortBy,
  onSortChange,
  vgcFilters,
  onVgcFilterChange,
  onMetaFirstView,
  regulationId,
  metaAvailable,
}) => {
  const showLegalFilter = regulationHasBanList(regulationId);

  return (
    <section className="browse-controls card-surface" aria-label="Browse sort and VGC filters">
      <div className="browse-controls-row">
        <label className="browse-sort-label" htmlFor="browse-sort">
          Sort by
        </label>
        <select
          id="browse-sort"
          className="browse-sort-select"
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value)}
        >
          {SORT_OPTIONS.map((option) => (
            <option
              key={option.id}
              value={option.id}
              disabled={
                (option.id === "usage" || option.id === "winRate") && !metaAvailable
              }
            >
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="browse-meta-first-btn"
          onClick={onMetaFirstView}
          disabled={!metaAvailable}
          title="Sort by usage and show top 30 meta picks"
        >
          Meta picks
        </button>
      </div>

      <div className="browse-vgc-filters" role="group" aria-label="VGC filters">
        <label className="browse-vgc-toggle">
          <input
            type="checkbox"
            checked={vgcFilters.top30Meta}
            onChange={(event) =>
              onVgcFilterChange({ ...vgcFilters, top30Meta: event.target.checked })
            }
            disabled={!metaAvailable}
          />
          <span>Top 30 meta</span>
        </label>

        <label className="browse-vgc-toggle">
          <input
            type="checkbox"
            checked={vgcFilters.hasUsageData}
            onChange={(event) =>
              onVgcFilterChange({ ...vgcFilters, hasUsageData: event.target.checked })
            }
            disabled={!metaAvailable}
          />
          <span>Has usage data</span>
        </label>

        {showLegalFilter && (
          <label className="browse-vgc-toggle">
            <input
              type="checkbox"
              checked={vgcFilters.legalInRegulation}
              onChange={(event) =>
                onVgcFilterChange({
                  ...vgcFilters,
                  legalInRegulation: event.target.checked,
                })
              }
            />
            <span>Legal in regulation</span>
          </label>
        )}
      </div>
    </section>
  );
};

export default BrowseControls;
