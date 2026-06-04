import React, { useMemo } from "react";
import { getMetaForRegulation, getMetaThreatTips } from "../utils/vgcMeta";
import "./MetaThreatHints.css";

const MetaThreatHints = ({ team, regulationId }) => {
  const meta = useMemo(() => getMetaForRegulation(regulationId), [regulationId]);
  const tips = useMemo(
    () => getMetaThreatTips(team, regulationId),
    [team, regulationId],
  );

  if (!team?.length) return null;

  return (
    <section className="meta-threat-hints card-surface" aria-labelledby="meta-threat-title">
      <h2 id="meta-threat-title">Meta &amp; core threats</h2>
      <p className="meta-threat-source">{meta.sourceNote}</p>

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
        <span className="meta-threat-top-label">Frequently seen in {regulationId?.replace(/-/g, " ") || "this format"}:</span>
        <div className="meta-threat-chips">
          {(meta.topPokemon || []).slice(0, 12).map((speciesId) => (
            <span key={speciesId} className="meta-threat-chip">
              {speciesId.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetaThreatHints;
