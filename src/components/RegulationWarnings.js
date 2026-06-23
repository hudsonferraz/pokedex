import React, { useMemo } from "react";
import { useRegulation } from "../contexts/RegulationContext";
import "./RegulationWarnings.css";

const RegulationWarnings = ({ team, sets, learnsetBySpecies = {}, isLoadingLearnsets = false }) => {
  const { validateTeam, regulation } = useRegulation();
  const { issues, warnings, legalityVerified } = useMemo(
    () =>
      validateTeam(team, {
        sets,
        learnsetBySpecies,
        learnsetValidationPending: isLoadingLearnsets,
      }),
    [team, sets, validateTeam, learnsetBySpecies, isLoadingLearnsets],
  );

  if (!team?.length) return null;

  if (isLoadingLearnsets) {
    return (
      <div className="regulation-status regulation-status-pending card-surface" role="status">
        <span className="regulation-status-icon" aria-hidden>
          …
        </span>
        <span>Loading learnsets to verify move legality…</span>
      </div>
    );
  }

  if (issues.length === 0 && warnings.length === 0) {
    return (
      <div className="regulation-status regulation-status-ok card-surface" role="status">
        <span className="regulation-status-icon" aria-hidden>
          ✓
        </span>
        <span>
          No {regulation.label} team validation issues detected.
        </span>
      </div>
    );
  }

  if (issues.length === 0 && warnings.length > 0 && !legalityVerified) {
    return (
      <div className="regulation-warnings card-surface" role="status">
        <div className="regulation-warn-list">
          {warnings.map((warning, index) => (
            <p key={`warn-${index}`} className="regulation-warn-item">
              {warning.message}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="regulation-warnings card-surface" role="alert">
      {issues.length > 0 && (
        <div className="regulation-issues">
          <h3 className="regulation-warnings-title">Regulation issues</h3>
          <ul>
            {issues.map((issue, index) => (
              <li key={`issue-${index}`} className="regulation-issue-item">
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="regulation-warn-list">
          {warnings.map((warning, index) => (
            <p key={`warn-${index}`} className="regulation-warn-item">
              {warning.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegulationWarnings;
