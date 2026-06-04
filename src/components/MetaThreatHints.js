import React, { useMemo } from "react";
import { useMetaData } from "../contexts/MetaDataContext";
import { getMetaForRegulation, getMetaThreatTips } from "../utils/vgcMeta";
import "./MetaThreatHints.css";

const MetaThreatHints = ({ team, regulationId }) => {
  const { meta, loading } = useMetaData();
  const bundledMeta = useMemo(
    () => getMetaForRegulation(regulationId, meta),
    [regulationId, meta],
  );
  const tips = useMemo(
    () => getMetaThreatTips(team, regulationId, meta),
    [team, regulationId, meta],
  );

  if (!team?.length) return null;

  return (
    <section className="meta-threat-hints card-surface" aria-labelledby="meta-threat-title">
      <h2 id="meta-threat-title">Meta &amp; core threats</h2>
      <p className="meta-threat-source">
        {bundledMeta.sourceNote}
        {meta?.live && " · Refreshed from Pikalytics."}
        {loading && " · Updating…"}
      </p>

      {tips.length > 0 ? (
        <ul className="meta-threat-list">
          {tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      ) : (
        <p className="meta-threat-empty">
          No major meta core warnings — keep tuning bring-4 and speed into top threats.
        </p>
      )}

      <div className="meta-threat-top">
        <span className="meta-threat-top-label">High usage in current format:</span>
        <div className="meta-threat-chips">
          {(bundledMeta.topPokemon || []).slice(0, 12).map((speciesId) => (
            <span key={speciesId} className="meta-threat-chip">
              {speciesId.replace(/-/g, " ")}
              {meta?.usage?.[speciesId] != null && (
                <span className="meta-threat-pct">
                  {" "}
                  {meta.usage[speciesId].toFixed(1)}%
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetaThreatHints;
