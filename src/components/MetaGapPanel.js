import React, { useEffect, useMemo, useState } from "react";
import { searchPokemon } from "../api";
import { useMetaData } from "../contexts/MetaDataContext";
import { analyzeMetaGap } from "../utils/metaGapAnalysis";
import {
  buildThreatHeatmapRows,
  formatMultiplierLabel,
  getPokemonTypeNames,
} from "../utils/metaThreatHeatmap";
import { normalizeSpeciesId } from "../utils/regulation";
import "./MetaGapPanel.css";

const MetaGapPanel = ({ team }) => {
  const { meta, loading } = useMetaData();
  const [typesBySpeciesId, setTypesBySpeciesId] = useState({});
  const [typesLoading, setTypesLoading] = useState(false);

  const analysis = useMemo(() => analyzeMetaGap(team, meta), [team, meta]);

  const topThreatIds = useMemo(
    () => (meta?.topPokemon || []).slice(0, 15),
    [meta?.topPokemon],
  );

  const filledTeam = useMemo(() => (team || []).filter(Boolean), [team]);

  useEffect(() => {
    if (!topThreatIds.length) {
      setTypesBySpeciesId({});
      return undefined;
    }

    let cancelled = false;
    setTypesLoading(true);

    (async () => {
      const resolved = {};

      filledTeam.forEach((pokemon) => {
        const speciesId = normalizeSpeciesId(pokemon.name);
        const types = getPokemonTypeNames(pokemon);
        if (types.length) resolved[speciesId] = types;
      });

      const missingIds = topThreatIds.filter((speciesId) => !resolved[speciesId]);
      await Promise.all(
        missingIds.map(async (speciesId) => {
          const data = await searchPokemon(speciesId);
          if (data) {
            resolved[speciesId] = getPokemonTypeNames(data);
          }
        }),
      );

      if (!cancelled) {
        setTypesBySpeciesId(resolved);
        setTypesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [topThreatIds, filledTeam]);

  const heatmapRows = useMemo(() => {
    if (!filledTeam.length || !topThreatIds.length || !Object.keys(typesBySpeciesId).length) {
      return [];
    }
    return buildThreatHeatmapRows(filledTeam, topThreatIds, typesBySpeciesId);
  }, [filledTeam, topThreatIds, typesBySpeciesId]);

  const worstThreats = useMemo(
    () =>
      [...heatmapRows]
        .filter((row) => row.rowSeverity >= 2)
        .sort((a, b) => b.rowSeverity - a.rowSeverity)
        .slice(0, 3)
        .map((row) => row.threatLabel),
    [heatmapRows],
  );

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
        <h2 id="meta-gap-title">Meta gap &amp; threat heatmap</h2>
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

      {filledTeam.length > 0 && analysis.missing.length > 0 && (
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

      {filledTeam.length > 0 && heatmapRows.length > 0 && (
        <div className="meta-gap-block meta-threat-heatmap-block">
          <div className="meta-threat-heatmap-header">
            <h3 className="meta-gap-label">Threat heatmap</h3>
            <p className="meta-threat-heatmap-note">
              Top meta species vs your roster — cell shows worst STAB matchup (
              {formatMultiplierLabel(2)} weak → red, resist → green).
            </p>
          </div>

          {worstThreats.length > 0 && (
            <p className="meta-threat-worst">
              Highest pressure: <strong>{worstThreats.join(", ")}</strong>
            </p>
          )}

          {typesLoading && (
            <p className="meta-gap-status" aria-live="polite">
              Loading threat types…
            </p>
          )}

          <div
            className="meta-threat-heatmap-scroll"
            role="grid"
            aria-label="Meta threat heatmap"
          >
            <table className="meta-threat-heatmap">
              <thead>
                <tr>
                  <th scope="col" className="meta-threat-corner">
                    Threat
                  </th>
                  {filledTeam.map((pokemon) => (
                    <th key={pokemon.name} scope="col" className="meta-threat-col-head">
                      {pokemon.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapRows.map((row) => (
                  <tr key={row.speciesId} className={row.rowSeverity >= 2 ? "meta-threat-row-hot" : ""}>
                    <th scope="row" className="meta-threat-row-head">
                      {row.threatLabel}
                    </th>
                    {row.cells.map((cell) => (
                      <td key={`${row.speciesId}-${cell.defenderName}`}>
                        <button
                          type="button"
                          className={`meta-threat-cell ${cell.cellClass}`}
                          title={cell.tooltip}
                          aria-label={cell.tooltip}
                        >
                          {cell.label}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default MetaGapPanel;
