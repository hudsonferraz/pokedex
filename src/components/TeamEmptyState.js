import React from "react";
import { useNavigate } from "react-router-dom";
import "./TeamEmptyState.css";

const TeamEmptyState = ({ onAddFirst }) => {
  const navigate = useNavigate();

  return (
    <div className="team-empty-state card-surface">
      <div className="team-empty-state-icon" aria-hidden>
        6
      </div>
      <h2 className="team-empty-state-title">Build your Regulation I squad</h2>
      <p className="team-empty-state-copy">
        Add six Pokémon to unlock type coverage, weakness analysis, and AI team tips.
        Pick roles and movesets like a VGC team lab.
      </p>
      <div className="team-empty-state-actions">
        <button type="button" className="team-empty-state-primary" onClick={onAddFirst}>
          Add first Pokémon
        </button>
        <button
          type="button"
          className="team-empty-state-secondary"
          onClick={() => navigate("/browse")}
        >
          Browse Pokédex
        </button>
      </div>
    </div>
  );
};

export default TeamEmptyState;
