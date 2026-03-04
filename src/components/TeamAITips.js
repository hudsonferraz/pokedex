import React, { useState } from "react";
import { getRuleBasedTips, getTeamSummaryForAI } from "../utils/teamTips";
import { askAIForTeamTips } from "../services/aiTeamHelper";
import { FORMAT_OPTIONS, getStoredFormat, setStoredFormat } from "../utils/formatOptions";
import "./TeamAITips.css";

const TeamAITips = ({ team }) => {
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [format, setFormat] = useState(getStoredFormat);

  const ruleBasedTips = getRuleBasedTips(team);

  const handleAskAI = async () => {
    const question = (aiQuestion || "Give me tips for forming a good team.").trim();
    setAiError("");
    setAiResponse("");
    setAiLoading(true);

    try {
      const teamSummary = getTeamSummaryForAI(team);
      const text = await askAIForTeamTips(teamSummary, question, format);
      setAiResponse(text);
    } catch (err) {
      setAiError(err.message || "Something went wrong. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="team-ai-tips">
      <h2 className="team-ai-tips-title">Team tips</h2>

      <div className="tips-section">
        <h3>Quick tips (no API)</h3>
        <ul className="tips-list">
          {ruleBasedTips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      </div>

      <div className="tips-section ai-section">
        <h3>Ask for more tips</h3>
        <>
          <p className="ai-hint">Ask the AI for advice on your team (e.g. balance, coverage, roles). Runs on our server—no key in your browser.</p>
          <div className="ai-format-row">
            <label htmlFor="ai-format" className="ai-format-label">Format:</label>
            <select
              id="ai-format"
              className="ai-format-select"
              value={format}
              onChange={(e) => { const v = e.target.value; setFormat(v); setStoredFormat(v); }}
              disabled={aiLoading}
            >
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value || "any"} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="ai-input-row">
            <input
              type="text"
              className="ai-input"
              placeholder="e.g. How can I improve my team? Tips for a good balance?"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
              disabled={aiLoading}
            />
            <button
              type="button"
              className="ai-submit-btn"
              onClick={handleAskAI}
              disabled={aiLoading}
            >
              {aiLoading ? "..." : "Get tips"}
            </button>
          </div>
          {aiError && <p className="ai-error">{aiError}</p>}
          {aiResponse && <div className="ai-response">{aiResponse}</div>}
        </>
      </div>
    </div>
  );
};

export default TeamAITips;
