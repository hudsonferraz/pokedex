import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegulation } from "../contexts/RegulationContext";
import { useMetaData } from "../contexts/MetaDataContext";
import { fetchPokemonMeta } from "../services/metaDataService";
import { getSpeciesMetaStats } from "../utils/usageStats";
import { pikalyticsDisplayNameToApiId } from "../utils/pikalyticsNames";
import {
  getDamageCalcLinkLabel,
  openDamageCalcWithPokemon,
} from "../utils/damageCalcLink";
import { formatSpeciesLabel } from "../utils/regulation";
import "./VgcMetaStats.css";

const formatLabel = (name) =>
  (name || "").replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const VgcMetaStats = ({
  speciesName,
  pokemon,
  currentSet,
  isInTeam,
  onApplySpread,
  onDamageCalcCopied,
}) => {
  const navigate = useNavigate();
  const { regulation } = useRegulation();
  const { meta, speciesMeta } = useMetaData();
  const [detailMeta, setDetailMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openingCalc, setOpeningCalc] = useState(false);

  useEffect(() => {
    if (!speciesName) {
      return undefined;
    }

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
  const suggested = detailMeta?.suggestedSet;

  const topMoveLabels =
    detailMeta?.moves?.slice(0, 4).map((entry) => entry.name) ||
    suggested?.moveLabels?.slice(0, 4) ||
    suggested?.moves?.slice(0, 4).map((move) => formatLabel(move)) ||
    [];

  const handleTeammateClick = (displayName) => {
    const apiId = pikalyticsDisplayNameToApiId(displayName);
    if (apiId) {
      navigate(`/pokemon/${apiId}`);
    }
  };

  const handleOpenDamageCalc = async () => {
    if (!pokemon) {
      return;
    }

    setOpeningCalc(true);
    try {
      const result = await openDamageCalcWithPokemon(
        pokemon,
        currentSet,
        regulation.id,
      );
      onDamageCalcCopied?.(result.copied);
    } catch {
      onDamageCalcCopied?.(false, true);
    } finally {
      setOpeningCalc(false);
    }
  };

  if (loading && usage == null && winRate == null && !detailMeta) {
    return (
      <div className="vgc-meta-stats card-surface" aria-busy="true">
        <p className="vgc-meta-stats-loading">Loading VGC meta…</p>
      </div>
    );
  }

  if (usage == null && winRate == null && !detailMeta && !suggested) {
    return null;
  }

  return (
    <div className="vgc-meta-panel card-surface">
      <div className="vgc-meta-stats-header">
        <h3 className="vgc-meta-stats-title">{regulation.label} meta</h3>
        <span className={`vgc-meta-stats-live ${live ? "live" : "offline"}`}>
          {live ? "Live" : "Offline"}
        </span>
      </div>

      {(usage != null || winRate != null) && (
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
      )}

      {suggested && (suggested.ability || suggested.item) && (
        <div className="vgc-meta-set-hints">
          {suggested.ability && (
            <p className="vgc-meta-hint-line">
              <strong>Ability:</strong> {suggested.ability}
            </p>
          )}
          {suggested.item && (
            <p className="vgc-meta-hint-line">
              <strong>Item:</strong> {suggested.item}
            </p>
          )}
        </div>
      )}

      {topMoveLabels.length > 0 && (
        <p className="vgc-meta-stats-moves">
          <strong>Top moves:</strong> {topMoveLabels.join(", ")}
        </p>
      )}

      {detailMeta?.evSpreads?.length > 0 && (
        <div className="vgc-meta-spreads">
          <h4 className="vgc-meta-spreads-title">Spread comparison</h4>
          <ul className="vgc-meta-spread-list">
            {detailMeta.evSpreads.slice(0, 4).map((spread, index) => (
              <li key={`${spread.label}-${index}`} className="vgc-meta-spread-item">
                <div className="vgc-meta-spread-info">
                  <span className="vgc-meta-spread-label">{spread.label}</span>
                  {spread.nature && spread.evs && (
                    <span className="vgc-meta-spread-detail">
                      {spread.nature} · {spread.evs}
                      {spread.percent != null ? ` (${spread.percent}%)` : ""}
                    </span>
                  )}
                  {spread.item && (
                    <span className="vgc-meta-spread-detail">
                      {spread.ability ? `${spread.ability} · ` : ""}
                      {spread.item}
                    </span>
                  )}
                </div>
                {onApplySpread && (
                  <button
                    type="button"
                    className="vgc-meta-spread-use"
                    onClick={() => onApplySpread(spread)}
                    disabled={!isInTeam}
                    title={
                      isInTeam
                        ? "Apply this spread to your team set"
                        : "Add to team first to apply spreads"
                    }
                  >
                    Use
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {detailMeta?.teammates?.length > 0 && (
        <div className="vgc-meta-teammates">
          <span className="vgc-meta-teammates-label">Common partners</span>
          <div className="vgc-meta-teammate-chips">
            {detailMeta.teammates.slice(0, 6).map((entry) => (
              <button
                key={entry.name}
                type="button"
                className="vgc-meta-teammate-chip"
                onClick={() => handleTeammateClick(entry.name)}
                title={`View ${entry.name}${entry.percent != null ? ` (${entry.percent.toFixed(1)}% paired)` : ""}`}
              >
                {entry.name}
                {entry.percent != null && (
                  <span className="vgc-meta-teammate-percent">
                    {entry.percent.toFixed(0)}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="vgc-meta-panel-actions">
        {pokemon && (
          <button
            type="button"
            className="vgc-meta-calc-btn"
            onClick={handleOpenDamageCalc}
            disabled={openingCalc}
          >
            {openingCalc
              ? "Opening…"
              : getDamageCalcLinkLabel(regulation.id).replace(" →", "")}
          </button>
        )}
        {sourceUrl && (
          <a
            className="vgc-meta-stats-link"
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View {formatSpeciesLabel(speciesName)} on Pikalytics
          </a>
        )}
      </div>
    </div>
  );
};

export default VgcMetaStats;
