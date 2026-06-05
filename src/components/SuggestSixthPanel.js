import React, { useEffect, useState } from "react";
import { rankSixthSuggestions } from "../utils/suggestSixth";
import "./SuggestSixthPanel.css";

const SuggestSixthPanel = ({
  team,
  regulationId,
  teamNames,
  canAddToTeam,
  onAddSuggestion,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (team.length !== 5) {
      setSuggestions([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    rankSixthSuggestions(regulationId, team).then((result) => {
      if (!cancelled) {
        setSuggestions(result.suggestions || []);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [regulationId, team]);

  if (team.length !== 5) {
    return null;
  }

  return (
    <section className="suggest-sixth-panel card-surface" aria-labelledby="suggest-sixth-title">
      <header className="suggest-sixth-header">
        <h2 id="suggest-sixth-title">Suggest your 6th</h2>
        <span className="suggest-sixth-subtitle">Aggregated Pikalytics partner data</span>
      </header>

      {loading && <p className="suggest-sixth-status">Ranking candidates…</p>}

      {!loading && suggestions.length === 0 && (
        <p className="suggest-sixth-status">
          No partner data found for this core in the current format.
        </p>
      )}

      {!loading && suggestions.length > 0 && (
        <ol className="suggest-sixth-list">
          {suggestions.map((entry, index) => {
            const onTeam = teamNames.has(entry.speciesId);
            return (
              <li key={entry.speciesId} className="suggest-sixth-item">
                <div className="suggest-sixth-rank">{index + 1}</div>
                <div className="suggest-sixth-info">
                  <span className="suggest-sixth-name">{entry.label}</span>
                  <span className="suggest-sixth-score">
                    {entry.score}% combined pairing
                  </span>
                  {entry.pairedWith.length > 0 && (
                    <span className="suggest-sixth-with">
                      Pairs with {entry.pairedWith.join(", ")}
                    </span>
                  )}
                </div>
                {onTeam ? (
                  <span className="suggest-sixth-on-team">On team</span>
                ) : (
                  <button
                    type="button"
                    className="suggest-sixth-add"
                    disabled={!canAddToTeam}
                    onClick={() => onAddSuggestion(entry.speciesId)}
                  >
                    Add
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};

export default SuggestSixthPanel;
