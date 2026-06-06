import React from "react";
import "./BrowseEmptyState.css";

const BrowseEmptyState = ({ title, message, onPrimaryAction, primaryLabel = "Clear search" }) => (
  <div className="browse-empty-state card-surface">
    <div className="browse-empty-state-icon" aria-hidden="true">
      ?
    </div>
    <h2 className="browse-empty-state-title">{title}</h2>
    <p className="browse-empty-state-copy">{message}</p>
    {onPrimaryAction && (
      <button type="button" className="browse-empty-state-primary" onClick={onPrimaryAction}>
        {primaryLabel}
      </button>
    )}
  </div>
);

export default BrowseEmptyState;
