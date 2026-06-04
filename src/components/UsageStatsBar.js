import React from "react";
import { useMetaData } from "../contexts/MetaDataContext";
import { getTopUsageFromMeta, getUsageMetaFromLive } from "../utils/usageStats";
import "./UsageStatsBar.css";

const UsageStatsBar = ({ regulationLabel }) => {
  const { meta, loading, error, refreshMeta } = useMetaData();
  const usageMeta = getUsageMetaFromLive(meta);
  const topEntries = meta ? getTopUsageFromMeta(meta, 8) : [];

  if (loading && !meta) {
    return (
      <div className="usage-stats-bar card-surface usage-stats-loading" aria-busy="true">
        <p>Loading live VGC usage…</p>
      </div>
    );
  }

  if (error && !meta) {
    return (
      <div className="usage-stats-bar card-surface usage-stats-error">
        <p>{error}</p>
        <button type="button" className="usage-stats-refresh" onClick={refreshMeta}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="usage-stats-bar card-surface">
      <div className="usage-stats-bar-text">
        <strong>VGC usage</strong>
        {meta?.live && <span className="usage-stats-live">Live</span>}
        {!meta?.live && <span className="usage-stats-offline">Offline fallback</span>}
        <span className="usage-stats-reg">{regulationLabel}</span>
        {usageMeta?.updated && (
          <span className="usage-stats-updated">Data {usageMeta.updated}</span>
        )}
        <button type="button" className="usage-stats-refresh" onClick={refreshMeta} title="Refresh">
          ↻
        </button>
      </div>
      <p className="usage-stats-source">
        {usageMeta?.source}
        {usageMeta?.sourceUrl && (
          <>
            {" "}
            <a href={usageMeta.sourceUrl} target="_blank" rel="noopener noreferrer">
              View on Pikalytics
            </a>
          </>
        )}
      </p>
      <div className="usage-stats-chips">
        {topEntries.map(({ speciesId, percent }) => (
          <span key={speciesId} className="usage-stats-chip">
            {speciesId.replace(/-/g, " ")} {percent.toFixed(1)}%
          </span>
        ))}
      </div>
    </div>
  );
};

export default UsageStatsBar;
