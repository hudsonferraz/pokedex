import React, { useEffect, useMemo, useRef, useState } from "react";
import { getRuleBasedTips, getTeamSummaryForAI } from "../utils/teamTips";
import { askAIForTeamTips } from "../services/aiTeamHelper";
import { buildMetaContextForAI } from "../utils/aiMetaContext";
import { parseStructuredAiTips } from "../utils/parseAiTips";
import { useMetaData } from "../contexts/MetaDataContext";
import { useApiHealth } from "../hooks/useApiHealth";
import "./TeamAITips.css";

const SUGGESTED_PROMPTS = [
  "How is my speed control?",
  "Who should I cut for a better core?",
  "How do I handle rain teams?",
  "What should I bring into a Tailwind mirror?",
];

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

function CoachMessage({ message }) {
  const parsedTips = useMemo(
    () => (message.role === "assistant" ? parseStructuredAiTips(message.content) : []),
    [message.content, message.role],
  );

  return (
    <div className={`coach-message coach-message-${message.role}`}>
      <p className="coach-message-role">
        {message.role === "user" ? "You" : "Coach"}
      </p>
      {parsedTips.length > 0 ? (
        <div className="ai-response-cards">
          {parsedTips.map((entry, index) => (
            <AiTipCard
              key={`${index}-${entry.tip.slice(0, 24)}`}
              index={index}
              tip={entry.tip}
              because={entry.because}
              meta={entry.meta}
            />
          ))}
        </div>
      ) : (
        <p className="coach-message-body">{message.content}</p>
      )}
    </div>
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
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const threadRef = useRef(null);

  const { meta: liveMeta } = useMetaData();
  const { status: apiStatus, aiConfigured, retry } = useApiHealth();

  const tipContext = {
    sets,
    roles,
    bringList,
    regulationId,
    regulationLabel,
    liveMeta,
  };

  const ruleBasedTips = getRuleBasedTips(team, tipContext);

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, aiLoading]);

  const handleAskAI = async (questionOverride) => {
    const question = (questionOverride || draft || "").trim();
    if (!question || aiLoading) return;

    setAiError("");
    setDraft("");
    const nextUserMessage = { role: "user", content: question };
    const historyForApi = messages
      .filter((entry) => entry.role === "user" || entry.role === "assistant")
      .map((entry) => ({ role: entry.role, content: entry.content }));

    setMessages((current) => [...current, nextUserMessage]);
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
      const aiFormat = regulationLabel
        ? `Pokémon Champions ${regulationLabel}`
        : "VGC doubles";
      const text = await askAIForTeamTips(
        teamSummary,
        question,
        aiFormat,
        historyForApi,
      );
      setMessages((current) => [
        ...current,
        { role: "assistant", content: text },
      ]);
    } catch (err) {
      setAiError(err.message || "Something went wrong. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const coachDisabledReason =
    apiStatus === "local-only"
      ? "Set REACT_APP_API_URL to your Render API to enable the live coach."
      : apiStatus === "offline"
        ? "API offline (Render may be waking up). Retry in a few seconds."
        : apiStatus === "connected" && !aiConfigured
          ? "GROQ_API_KEY is not set on the server yet."
          : "";

  return (
    <div className="team-ai-tips card-surface team-coach-panel" id="team-coach">
      <div className="team-coach-header">
        <div>
          <p className="team-coach-eyebrow">Product coach</p>
          <h2 className="team-ai-tips-title">VGC AI coach</h2>
        </div>
        <p className="team-coach-disclaimer">
          Advisory AI — verify legality and meta yourself. Powered by Groq when configured.
        </p>
      </div>

      <div className="tips-section">
        <h3>Quick facts (no API)</h3>
        <p className="tips-section-note">
          Always available from your roster, sets, and regulation signals.
        </p>
        <ul className="tips-list">
          {ruleBasedTips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>

      <div className="tips-section ai-section">
        <h3>Ask the coach</h3>
        <p className="ai-hint">
          Sends this team&apos;s sets, roles, bring-4, gaps, regulation, and meta stub to Groq.
          Follow-ups keep short chat history.
        </p>

        {coachDisabledReason && (
          <div className="coach-status-banner" role="status">
            <p>{coachDisabledReason}</p>
            {apiStatus === "offline" && (
              <button type="button" className="action-btn" onClick={retry}>
                Retry connection
              </button>
            )}
          </div>
        )}

        <div className="coach-prompt-chips" aria-label="Suggested questions">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="coach-prompt-chip"
              disabled={aiLoading || Boolean(coachDisabledReason)}
              onClick={() => handleAskAI(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="coach-thread" ref={threadRef} aria-live="polite">
          {messages.length === 0 && !aiLoading && (
            <p className="coach-thread-empty">
              Ask about speed control, cuts, or a specific matchup to start the chat.
            </p>
          )}
          {messages.map((message, index) => (
            <CoachMessage key={`${message.role}-${index}`} message={message} />
          ))}
          {aiLoading && (
            <div className="ai-response-skeleton" aria-busy="true" aria-label="Coach thinking">
              <div className="ai-skeleton-line skeleton-shimmer" />
              <div className="ai-skeleton-line skeleton-shimmer" />
              <div className="ai-skeleton-line skeleton-shimmer short" />
            </div>
          )}
        </div>

        <div className="ai-input-row">
          <input
            type="text"
            className="ai-input"
            placeholder="Ask anything about this team…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) =>
              event.key === "Enter" &&
              !aiLoading &&
              !coachDisabledReason &&
              handleAskAI()
            }
            disabled={aiLoading || Boolean(coachDisabledReason)}
          />
          <button
            type="button"
            className="ai-submit-btn"
            onClick={() => handleAskAI()}
            disabled={aiLoading || Boolean(coachDisabledReason) || !draft.trim()}
          >
            {aiLoading ? "Thinking…" : "Ask"}
          </button>
        </div>
        {aiError && <p className="ai-error" role="alert">{aiError}</p>}
        {messages.length > 0 && (
          <button
            type="button"
            className="coach-clear-btn"
            onClick={() => {
              setMessages([]);
              setAiError("");
            }}
            disabled={aiLoading}
          >
            Clear chat
          </button>
        )}
      </div>
    </div>
  );
};

export default TeamAITips;
