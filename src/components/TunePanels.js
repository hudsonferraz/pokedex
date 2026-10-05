import React, { useState, useEffect } from "react";
import TeamAnalysis from "./TeamAnalysis";
import MetaGapPanel from "./MetaGapPanel";
import MetaThreatHints from "./MetaThreatHints";
import SpeedTierTable from "./SpeedTierTable";
import BringFourPreview from "./BringFourPreview";
import TeamPreviewSimulator from "./TeamPreviewSimulator";
import TeamAITips from "./TeamAITips";
import "./TunePanels.css";

const TABS = [
  { id: "coverage", label: "Coverage" },
  { id: "meta", label: "Meta" },
  { id: "speed", label: "Speed" },
  { id: "preview", label: "Preview" },
];

const TunePanels = ({
  team,
  sets,
  teamName,
  regulationId,
  regulationLabel,
  bringList,
  onToggleBring,
  setBringList,
  roles,
  coachReady,
  activeTabId,
  onTabChange,
}) => {
  const [showCoach, setShowCoach] = useState(false);
  const activeTab = TABS.some((tab) => tab.id === activeTabId)
    ? activeTabId
    : "coverage";

  useEffect(() => {
    if (!coachReady) {
      setShowCoach(false);
    }
  }, [coachReady]);

  return (
    <div className="tune-panels">
      <div className="tune-panels-tablist" role="tablist" aria-label="Tune analysis">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tune-panels-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange?.(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tune-panels-body" role="tabpanel">
        {activeTab === "coverage" && (
          <TeamAnalysis
            team={team}
            sets={sets}
            teamName={teamName}
            regulationId={regulationId}
          />
        )}
        {activeTab === "meta" && (
          <>
            <MetaGapPanel team={team} />
            <MetaThreatHints team={team} regulationId={regulationId} />
          </>
        )}
        {activeTab === "speed" && <SpeedTierTable team={team} sets={sets} />}
        {activeTab === "preview" && (
          <>
            <BringFourPreview
              team={team}
              bringList={bringList}
              onToggle={onToggleBring}
            />
            <TeamPreviewSimulator
              team={team}
              sets={sets}
              bringList={bringList}
              setBringList={setBringList}
              regulationId={regulationId}
            />
          </>
        )}
      </div>

      {coachReady && (
        <div className="tune-panels-coach">
          {!showCoach ? (
            <button
              type="button"
              className="tune-panels-coach-toggle"
              onClick={() => setShowCoach(true)}
            >
              Optional: ask the coach
            </button>
          ) : (
            <TeamAITips
              team={team}
              sets={sets}
              roles={roles}
              bringList={bringList}
              regulationId={regulationId}
              regulationLabel={regulationLabel}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default TunePanels;
