import React, { useMemo } from "react";
import { useMetaData } from "../contexts/MetaDataContext";
import { analyzeMetaGap } from "../utils/metaGapAnalysis";
import "./MetaGapPanel.css";

const MetaGapPanel = ({ team }) => {
  const { meta, loading } = useMetaData();

  const analysis = useMemo(() => analyzeMetaGap(team, meta), [team, meta]);

  if (loading && !meta) {
    return (
      <section className="meta-gap-panel card-surface" aria-busy="true">
        <p className="meta-gap-status">Loading meta gap analysis…</p>
      </section>
    );
  }

  if (!analysis.totalStaples) {
    return null;
  }

  return (
    <section className="meta-gap-panel card-surface" aria-labelledby="meta-gap-title">
      <header className="meta-gap-header">
        <h2 id="meta-gap-title">Meta gap analysis</h2>
        <span className={`meta-gap-live ${analysis.live ? "live" : "offline"}`}>
          {analysis.live ? "Live" : "Offline"}
        </span>
      </header>
      <p className="meta-gap-summary">{analysis.message}</p>

      {analysis.onTeam.length > 0 && (
        <div className="meta-gap-block">
          <h3 className="meta-gap-label">On your team</h3>
          <ul className="meta-gap-chips">
            {analysis.onTeam.map((name) => (
              <li key={name} className="meta-gap-chip on-team">
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {team.length > 0 && analysis.missing.length > 0 && (
        <div className="meta-gap-block">
          <h3 className="meta-gap-label">Missing staples</h3>
          <ul className="meta-gap-chips">
            {analysis.missing.map((name) => (
              <li key={name} className="meta-gap-chip missing">
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default MetaGapPanel;
