import React from "react";
import { useRegulation } from "../contexts/RegulationContext";
import "./RegulationSelector.css";

const RegulationSelector = ({ compact = false }) => {
  const { regulationId, regulations, setRegulationId, regulation } = useRegulation();

  return (
    <div className={`regulation-selector card-surface${compact ? " regulation-selector-compact" : ""}`}>
      <label htmlFor="regulation-select" className="regulation-selector-label">
        Regulation / format
      </label>
      <select
        id="regulation-select"
        className="regulation-select"
        value={regulationId}
        onChange={(event) => setRegulationId(event.target.value)}
      >
        {regulations.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.label}
            {entry.isPlaceholder ? " (placeholder)" : ""}
            {entry.series ? ` (${entry.series})` : ""}
          </option>
        ))}
      </select>
      {!compact && (
        <p className="regulation-selector-hint">
        Saved with the active team. {regulation.notes} · Max {regulation.maxRestricted ?? 2} Restricted.
          {regulation.legalityUnverified && regulation.legalityInheritsFrom
            ? ` Legality inherits from ${regulation.legalityInheritsFrom.replace(/-/g, " ")} until official lists are bundled.`
            : ""}
          {" "}Verify against the{" "}
          <a
            href="https://play.pokemon.com/en-us/resources/rules/?category=vgc"
            target="_blank"
            rel="noopener noreferrer"
          >
            official VGC handbook
          </a>
          . Usage % is loaded live from Pikalytics.
        </p>
      )}
      {compact && (
        <p className="regulation-selector-compact-hint">
          Usage badges reflect <strong>{regulation.label}</strong> meta.
        </p>
      )}
    </div>
  );
};

export default RegulationSelector;
