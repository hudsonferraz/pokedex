import React, { useEffect, useState } from "react";
import { useRegulation } from "../contexts/RegulationContext";
import { useMetaData } from "../contexts/MetaDataContext";
import { fetchPokemonMeta } from "../services/metaDataService";
import { getSpeciesMetaStats } from "../utils/usageStats";
import "./VgcMetaStats.css";

const formatLabel = (name) =>
  (name || "").replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const VgcMetaStats = ({ speciesName }) => {
  const { regulation } = useRegulation();
  const { meta, speciesMeta } = useMetaData();
  const [detailMeta, setDetailMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!speciesName) return undefined;
    let cancelled = false;
    setLoading(true);

    fetchPokemonMeta(regulation.id, speciesName).then((result) => {
      if (!cancelled) {
        setDetailMeta(result.error ? null : result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [regulation.id, speciesName]);

  const cachedStats = getSpeciesMetaStats(speciesMeta, speciesName, meta);
  const usage = detailMeta?.usage ?? cachedStats.usage;
  const winRate = detailMeta?.winRate ?? cachedStats.winRate;
  const live = detailMeta?.live ?? cachedStats.live;
  const sourceUrl = detailMeta?.sourceUrl || meta?.sourceUrl;

  if (loading && usage == null && winRate == null) {
    return (
      <div className="vgc-meta-stats card-surface" aria-busy="true">
        <p className="vgc-meta-stats-loading">Loading VGC meta…</p>
      </div>
    );
  }

  if (usage == null && winRate == null) {
    return null;
  }

  return (
    <div className="vgc-meta-stats card-surface">
      <div className="vgc-meta-stats-header">
        <h3 className="vgc-meta-stats-title">{regulation.label} meta</h3>
        <span className={`vgc-meta-stats-live ${live ? "live" : "offline"}`}>
          {live ? "Live" : "Offline"}
        </span>
      </div>
      <div className="vgc-meta-stats-grid">
        {usage != null && (
          <div className="vgc-meta-stat">
            <span className="vgc-meta-stat-value">{usage.toFixed(1)}%</span>
            <span className="vgc-meta-stat-label">Usage</span>
          </div>
        )}
        {winRate != null && (
          <div className="vgc-meta-stat">
            <span className="vgc-meta-stat-value">{winRate.toFixed(1)}%</span>
            <span className="vgc-meta-stat-label">Win rate</span>
          </div>
        )}
      </div>
      {detailMeta?.teammates?.length > 0 && (
        <p className="vgc-meta-stats-partners">
          Common partners:{" "}
          {detailMeta.teammates
            .slice(0, 4)
            .map((entry) => entry.name)
            .join(", ")}
        </p>
      )}
      {sourceUrl && (
        <a
          className="vgc-meta-stats-link"
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          View {formatLabel(speciesName)} on Pikalytics
        </a>
      )}
    </div>
  );
};

export default VgcMetaStats;
