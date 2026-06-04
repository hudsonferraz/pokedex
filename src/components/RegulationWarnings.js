import React, { useMemo } from "react";
import { useRegulation } from "../contexts/RegulationContext";
import "./RegulationWarnings.css";

const RegulationWarnings = ({ team }) => {
  const { validateTeam, regulation } = useRegulation();
  const { issues, warnings } = useMemo(() => validateTeam(team), [team, validateTeam]);

  if (!team?.length) return null;
  if (issues.length === 0 && warnings.length === 0) {
    return (
      <div className="regulation-status regulation-status-ok card-surface" role="status">
        <span className="regulation-status-icon" aria-hidden>
          ✓
        </span>
        <span>
          No {regulation.label} ban or Restricted limit issues detected.
        </span>
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
