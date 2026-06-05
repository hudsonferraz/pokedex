import React, { useEffect, useState } from "react";
import { fetchPokemonMeta } from "../services/metaDataService";
import { pikalyticsDisplayNameToApiId } from "../utils/pikalyticsNames";
import { formatSpeciesLabel } from "../utils/regulation";
import "./TeammateSuggestions.css";

const TeammateSuggestions = ({
  selectedPokemon,
  regulationId,
  regulationLabel,
  teamNames,
  canAddToTeam,
  onAddTeammate,
}) => {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedPokemon?.name) {
      setMeta(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    fetchPokemonMeta(regulationId, selectedPokemon.name).then((result) => {
      if (!cancelled) {
        setMeta(result.error ? null : result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [regulationId, selectedPokemon?.name]);

  if (!selectedPokemon) {
    return null;
  }

  const teammates = meta?.teammates || [];
  const displayName = formatSpeciesLabel(selectedPokemon.name);

  return (
    <section className="teammate-suggestions card-surface" aria-label="Teammate suggestions">
      <header className="teammate-suggestions-header">
        <h3 className="teammate-suggestions-title">
          Partners for {displayName}
        </h3>
        <span className="teammate-suggestions-format">{regulationLabel}</span>
      </header>

      {loading && (
        <p className="teammate-suggestions-status">Loading Pikalytics partners…</p>
      )}

      {!loading && teammates.length === 0 && (
        <p className="teammate-suggestions-status">
          No teammate data for this Pokémon in the current format.
        </p>
      )}

      {!loading && teammates.length > 0 && (
        <ul className="teammate-suggestions-list">
          {teammates.slice(0, 6).map((entry) => {
            const apiId = pikalyticsDisplayNameToApiId(entry.name);
            const onTeam = teamNames.has(apiId);
            const disabled = onTeam || !canAddToTeam;

            return (
              <li key={entry.name} className="teammate-suggestions-item">
                <div className="teammate-suggestions-info">
                  <span className="teammate-suggestions-name">{entry.name}</span>
                  <span className="teammate-suggestions-percent">
                    {entry.percent.toFixed(1)}% paired
                  </span>
                </div>
                {onTeam ? (
                  <span className="teammate-suggestions-on-team">On team</span>
                ) : (
                  <button
                    type="button"
                    className="teammate-suggestions-add"
                    disabled={disabled}
                    onClick={() => onAddTeammate(apiId)}
                    title={
                      canAddToTeam
                        ? `Add ${entry.name} to your team`
                        : "Team is full (6/6)"
                    }
                  >
                    Add
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {meta?.sourceUrl && (
        <a
          className="teammate-suggestions-link"
          href={meta.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Full stats on Pikalytics
        </a>
      )}
    </section>
  );
};

export default TeammateSuggestions;
