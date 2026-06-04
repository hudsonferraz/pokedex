import React, { useMemo } from "react";
import { buildTeamSpeedRows, getSpeedBenchmarks } from "../utils/speedTiers";
import "./SpeedTierTable.css";

const SpeedTierTable = ({ team, sets }) => {
  const rows = useMemo(() => buildTeamSpeedRows(team, sets), [team, sets]);
  const benchmarks = useMemo(() => getSpeedBenchmarks().slice(0, 6), []);

  if (!team?.length) return null;

  return (
    <section className="speed-tier-table card-surface" aria-labelledby="speed-tier-title">
      <header className="speed-tier-header">
        <h2 id="speed-tier-title">Speed tiers (level 50)</h2>
        <p className="speed-tier-copy">
          Estimated Speed from base stats, nature, and EVs in your sets. Tailwind column uses 1.5×.
        </p>
      </header>

      <div className="speed-tier-table-wrap">
        <table className="speed-tier-grid">
          <thead>
            <tr>
              <th>Pokémon</th>
              <th>Base</th>
              <th>Nature</th>
              <th>Spe EVs</th>
              <th>Speed</th>
              <th>+Tailwind</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="speed-tier-name">{row.name}</td>
                <td>{row.baseSpeed}</td>
                <td>{row.nature}</td>
                <td>{row.speedEvs || "—"}</td>
                <td className="speed-tier-speed">{row.speed}</td>
                <td className="speed-tier-tw">{row.tailwindSpeed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="speed-tier-insights">
          {rows.slice(0, 2).map((row) => (
            <p key={row.name} className="speed-tier-insight">
              <strong className="speed-tier-insight-name">{row.name}</strong>
              {row.outspeeds.length > 0
                ? ` outspeeds ${row.outspeeds.join(", ")}`
                : " — check benchmarks below"}
              {row.underspeeds.length > 0 ? `; loses to ${row.underspeeds.join(", ")}` : ""}
            </p>
          ))}
        </div>
      )}

      <div className="speed-tier-benchmarks">
        <h3>Common benchmarks</h3>
        <ul>
          {benchmarks.map((bench) => (
            <li key={bench.label}>
              <span className="benchmark-label">{bench.label}</span>
              <span className="benchmark-speed">{bench.resolvedSpeed}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default SpeedTierTable;
