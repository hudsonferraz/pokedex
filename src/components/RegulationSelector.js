import React from "react";
import { useRegulation } from "../contexts/RegulationContext";
import "./RegulationSelector.css";

const RegulationSelector = () => {
  const { regulationId, regulations, setRegulationId, regulation } = useRegulation();

  return (
    <div className="regulation-selector card-surface">
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
            {entry.series ? ` (${entry.series})` : ""}
          </option>
        ))}
      </select>
      <p className="regulation-selector-hint">
        {regulation.notes} · Max {regulation.maxRestricted ?? 2} Restricted.
        Ban/restricted lists are bundled — verify against the{" "}
        <a
          href="https://play.pokemon.com/en-us/resources/rules/?category=vgc"
          target="_blank"
          rel="noopener noreferrer"
        >
          official VGC handbook
        </a>
        . Usage % is loaded live from Pikalytics.
      </p>
    </div>
  );
};

export default RegulationSelector;
