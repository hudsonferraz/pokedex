import React from "react";
import "./TeamHealthSummary.css";

const STATUS_CLASS = {
  ok: "team-health-metric-ok",
  complete: "team-health-metric-ok",
  warn: "team-health-metric-warn",
  attention: "team-health-metric-warn",
  error: "team-health-metric-error",
  unknown: "team-health-metric-neutral",
  upcoming: "team-health-metric-neutral",
};

function HealthMetric({ label, value, status, onClick }) {
  const className = `team-health-metric ${STATUS_CLASS[status] || STATUS_CLASS.unknown}`;

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        <span className="team-health-metric-label">{label}</span>
        <span className="team-health-metric-value">{value}</span>
      </button>
    );
  }

  return (
    <div className={className}>
      <span className="team-health-metric-label">{label}</span>
      <span className="team-health-metric-value">{value}</span>
    </div>
  );
}

const TeamHealthSummary = ({ health, onNavigateStep }) => {
  if (!health) return null;

  const { legality, completedSets, speedControl, damageBalance, weaknesses } = health;

  return (
    <aside className="team-health-summary card-surface" aria-label="Team health summary">
      <p className="team-health-summary-title">Team health</p>
      <div className="team-health-metrics">
        <HealthMetric
          label="Legality"
          value={legality.label}
          status={legality.status}
          onClick={() => onNavigateStep?.("legality")}
        />
        <HealthMetric
          label="Sets"
          value={completedSets.label}
          status={
            completedSets.rosterCount === 0
              ? "unknown"
              : completedSets.count === completedSets.rosterCount &&
                  completedSets.rosterCount === 6
                ? "ok"
                : "attention"
          }
          onClick={() => onNavigateStep?.("sets")}
        />
        <HealthMetric
          label="Speed"
          value={speedControl.label}
          status={speedControl.status}
          onClick={() => onNavigateStep?.("matchups")}
        />
        <HealthMetric
          label="Damage"
          value={damageBalance.label}
          status={damageBalance.status}
          onClick={() => onNavigateStep?.("matchups")}
        />
        <HealthMetric
          label="Weak to"
          value={weaknesses.label}
          status={weaknesses.status}
          onClick={() => onNavigateStep?.("matchups")}
        />
      </div>
    </aside>
  );
};

export default TeamHealthSummary;
