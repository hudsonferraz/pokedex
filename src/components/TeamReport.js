import React from "react";
import { buildTeamReport } from "../utils/teamReport";
import "./TeamReport.css";

const SEVERITY_CLASS = {
  error: "team-report-issue-error",
  warn: "team-report-issue-warn",
  info: "team-report-issue-info",
};

const TeamReport = ({ health, teamLength = 0, onNavigateIssue }) => {
  const report = buildTeamReport(health, { teamLength });

  return (
    <aside className="team-report card-surface" aria-label="Team report">
      <div className="team-report-header">
        <p className="team-report-title">Team report</p>
        {report.issues.length > 0 && (
          <span className="team-report-count">{report.issues.length}</span>
        )}
      </div>

      {report.issues.length === 0 ? (
        <p className="team-report-empty">{report.emptyLabel}</p>
      ) : (
        <ul className="team-report-list">
          {report.issues.map((issue) => (
            <li key={issue.id}>
              <button
                type="button"
                className={`team-report-issue ${SEVERITY_CLASS[issue.severity] || ""}`}
                onClick={() => onNavigateIssue?.(issue)}
              >
                <span className="team-report-issue-title">{issue.title}</span>
                {issue.detail && (
                  <span className="team-report-issue-detail">{issue.detail}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

export default TeamReport;
