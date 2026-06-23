import React from "react";
import "./TeamBuildGuide.css";

const STEP_STATUS_ICON = {
  complete: "✓",
  attention: "!",
  upcoming: "○",
};

const TeamBuildGuide = ({ steps, activeStepId, onStepChange }) => {
  if (!steps?.length) return null;

  return (
    <nav className="team-build-guide card-surface" aria-label="Team build workflow">
      <ol className="team-build-guide-steps">
        {steps.map((step, index) => {
          const isActive = step.id === activeStepId;
          const statusIcon = STEP_STATUS_ICON[step.status] || "○";

          return (
            <li key={step.id} className="team-build-guide-step">
              <button
                type="button"
                className={`team-build-guide-step-btn ${isActive ? "active" : ""} status-${step.status}`}
                aria-current={isActive ? "step" : undefined}
                onClick={() => onStepChange(step.id)}
              >
                <span className="team-build-guide-step-index" aria-hidden>
                  {index + 1}
                </span>
                <span className="team-build-guide-step-label">{step.shortLabel}</span>
                <span className="team-build-guide-step-status" aria-hidden>
                  {statusIcon}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default TeamBuildGuide;
