import React from "react";
import { useNavigate } from "react-router-dom";
import "./TeamEmptyState.css";

const TeamEmptyState = ({
  onAddFirst,
  onImport,
  regulationLabel = "Champions Reg M-C",
}) => {
  const navigate = useNavigate();

  return (
    <div className="team-empty-state card-surface">
      <div className="team-empty-state-icon" aria-hidden>
        6
      </div>
      <h2 className="team-empty-state-title">Build your {regulationLabel} squad</h2>
      <p className="team-empty-state-copy">
        Import a Showdown paste to jump straight into legality and matchup checks, or add Pokémon
        one slot at a time.
      </p>
      <div className="team-empty-state-actions">
        <button type="button" className="team-empty-state-primary" onClick={onImport}>
          Import Showdown paste
        </button>
        <button type="button" className="team-empty-state-secondary" onClick={onAddFirst}>
          Add Pokémon
        </button>
        <button
          type="button"
          className="team-empty-state-tertiary"
          onClick={() => navigate("/browse")}
        >
          Browse Pokédex
        </button>
      </div>
    </div>
  );
};

export default TeamEmptyState;
