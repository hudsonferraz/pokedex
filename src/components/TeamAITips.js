import React, { useMemo, useState } from "react";
import { getRuleBasedTips, getTeamSummaryForAI } from "../utils/teamTips";
import { askAIForTeamTips } from "../services/aiTeamHelper";
import { buildMetaContextForAI } from "../utils/aiMetaContext";
import { parseStructuredAiTips } from "../utils/parseAiTips";
import { FORMAT_OPTIONS, getStoredFormat, setStoredFormat } from "../utils/formatOptions";
import { useMetaData } from "../contexts/MetaDataContext";
import "./TeamAITips.css";

function AiTipCard({ tip, because, meta, index }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = Boolean(because || meta);

  return (
    <article className="ai-tip-card">
      <p className="ai-tip-card-text">
        <span className="ai-tip-card-number">{index + 1}.</span> {tip}
      </p>
      {hasDetails && (
        <>
          <button
            type="button"
            className="ai-tip-why-toggle"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
          >
            {expanded ? "Hide why" : "Why?"}
          </button>
          {expanded && (
            <div className="ai-tip-card-details">
              {because && (
                <p>
                  <strong>Because:</strong> {because}
                </p>
              )}
              {meta && (
                <p>
                  <strong>Meta:</strong> {meta}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}

const TeamAITips = ({
  team,
  sets,
  roles,
  bringList,
  regulationId,
  regulationLabel,
}) => {
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [format, setFormat] = useState(getStoredFormat);

  const { meta: liveMeta } = useMetaData();

  const tipContext = {
    sets,
    roles,
    bringList,
    regulationId,
    regulationLabel,
    liveMeta,
  };

  const ruleBasedTips = getRuleBasedTips(team, tipContext);

  const parsedAiTips = useMemo(
    () => (aiResponse ? parseStructuredAiTips(aiResponse) : []),
    [aiResponse],
  );

  const handleAskAI = async () => {
    const question = (aiQuestion || "Give me VGC tips for this team.").trim();
    setAiError("");
    setAiResponse("");
    setAiLoading(true);

    try {
      const metaAppendix = await buildMetaContextForAI(
        regulationId,
        team,
        liveMeta,
        tipContext,
      );
      const teamSummary = getTeamSummaryForAI(team, {
        ...tipContext,
        metaAppendix,
      });
      const aiFormat =
        format ||
        (regulationLabel ? `VGC ${regulationLabel}` : "VGC doubles");
      const text = await askAIForTeamTips(teamSummary, question, aiFormat);
      setAiResponse(text);
    } catch (err) {
      setAiError(err.message || "Something went wrong. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="team-ai-tips card-surface">
      <h2 className="team-ai-tips-title">Team tips</h2>

      <div className="tips-section">
        <h3>VGC quick tips (no API)</h3>
        <p className="tips-section-note">
          Uses your roles, moves, abilities, and regulation meta data.
        </p>
        <ul className="tips-list">
          {ruleBasedTips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>

      <div className="tips-section ai-section">
        <h3>Ask AI (VGC-tuned)</h3>
        <p className="ai-hint">
          Sends regulation, roles, items, Tera, bring-4, moves, team gaps, and Pikalytics meta.
          Each tip includes an expandable &quot;Why?&quot; when the model follows the structured format.
        </p>
        <div className="ai-format-row">
          <label htmlFor="ai-format" className="ai-format-label">
            Extra format hint:
          </label>
          <select
            id="ai-format"
            className="ai-format-select"
            value={format}
            onChange={(event) => {
              const value = event.target.value;
              setFormat(value);
              setStoredFormat(value);
            }}
            disabled={aiLoading}
          >
            {FORMAT_OPTIONS.map((option) => (
              <option key={option.value || "any"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="ai-input-row">
          <input
            type="text"
            className="ai-input"
            placeholder="e.g. What should I bring into rain teams? Is my Tailwind plan ok?"
            value={aiQuestion}
            onChange={(event) => setAiQuestion(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && !aiLoading && handleAskAI()}
            disabled={aiLoading}
          />
          <button
            type="button"
            className="ai-submit-btn"
            onClick={handleAskAI}
            disabled={aiLoading}
          >
            {aiLoading ? "Loading…" : "Get tips"}
          </button>
        </div>
        {aiError && <p className="ai-error" role="alert">{aiError}</p>}
        {aiLoading && (
          <div className="ai-response-skeleton" aria-busy="true" aria-label="Loading AI tips">
            <div className="ai-skeleton-line skeleton-shimmer" />
            <div className="ai-skeleton-line skeleton-shimmer" />
            <div className="ai-skeleton-line skeleton-shimmer short" />
          </div>
        )}
        {!aiLoading && parsedAiTips.length > 0 && (
          <div className="ai-response-cards">
            {parsedAiTips.map((entry, index) => (
              <AiTipCard
                key={`${index}-${entry.tip.slice(0, 24)}`}
                index={index}
                tip={entry.tip}
                because={entry.because}
                meta={entry.meta}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamAITips;
