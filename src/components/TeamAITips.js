import React, { useState } from "react";
import { getRuleBasedTips, getTeamSummaryForAI } from "../utils/teamTips";
import { askAIForTeamTips } from "../services/aiTeamHelper";
import { buildMetaContextForAI } from "../utils/aiMetaContext";
import { FORMAT_OPTIONS, getStoredFormat, setStoredFormat } from "../utils/formatOptions";
import { useMetaData } from "../contexts/MetaDataContext";
import "./TeamAITips.css";

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

  const handleAskAI = async () => {
    const question = (aiQuestion || "Give me VGC tips for this team.").trim();
    setAiError("");
    setAiResponse("");
    setAiLoading(true);

    try {
      const metaAppendix = await buildMetaContextForAI(regulationId, team, liveMeta);
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
          Sends regulation, roles, items, Tera, bring-4, moves, and live Pikalytics meta (usage, WR,
          partners, staples) to our server — tuned for doubles.
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
        {aiError && <p className="ai-error">{aiError}</p>}
        {aiLoading && (
          <div className="ai-response-skeleton" aria-busy="true" aria-label="Loading AI tips">
            <div className="ai-skeleton-line skeleton-shimmer" />
            <div className="ai-skeleton-line skeleton-shimmer" />
            <div className="ai-skeleton-line skeleton-shimmer short" />
          </div>
        )}
        {!aiLoading && aiResponse && <div className="ai-response">{aiResponse}</div>}
      </div>
    </div>
  );
};

export default TeamAITips;
