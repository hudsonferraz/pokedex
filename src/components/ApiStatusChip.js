import React from "react";
import { useApiHealth } from "../hooks/useApiHealth";
import "./ApiStatusChip.css";

function getStatusLabel(status, aiConfigured) {
  if (status === "loading") return "Checking API…";
  if (status === "local-only") return "Local dev — set REACT_APP_API_URL for live meta";
  if (status === "offline") return "Backend offline · bundled fallback";
  if (aiConfigured) return "Backend connected · AI ready";
  return "Backend connected · AI not configured";
}

function getStatusClassName(status) {
  if (status === "loading") return "api-status-chip loading";
  if (status === "connected") return "api-status-chip connected";
  if (status === "local-only") return "api-status-chip local";
  return "api-status-chip offline";
}

const ApiStatusChip = () => {
  const { status, aiConfigured, retry } = useApiHealth();
  const label = getStatusLabel(status, aiConfigured);
  const canRetry = status === "offline";

  return (
    <div className="api-status-chip-row">
      <span
        className={getStatusClassName(status)}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <span className="api-status-chip-dot" aria-hidden="true" />
        {label}
      </span>
      {canRetry && (
        <button type="button" className="api-status-retry" onClick={retry}>
          Retry
        </button>
      )}
    </div>
  );
};

export default ApiStatusChip;
