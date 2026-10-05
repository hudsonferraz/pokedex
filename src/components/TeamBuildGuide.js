import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import "./TeamBuildGuide.css";

const STEP_STATUS_ICON = {
  complete: "✓",
  attention: "!",
  upcoming: "○",
};

const WALKTHROUGH_STORAGE_KEY = "vgc-team-lab-workflow-intro-dismissed";

function readWalkthroughDismissed() {
  try {
    return window.localStorage.getItem(WALKTHROUGH_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeWalkthroughDismissed(dismissed) {
  try {
    if (dismissed) {
      window.localStorage.setItem(WALKTHROUGH_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(WALKTHROUGH_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures — intro still works for the session.
  }
}

const TeamBuildGuide = ({ steps, activeStepId, onStepChange }) => {
  const [introDismissed, setIntroDismissed] = useState(readWalkthroughDismissed);
  const [openHelpStepId, setOpenHelpStepId] = useState(null);
  const guideRef = useRef(null);
  const helpPanelId = useId();

  const dismissIntro = useCallback(() => {
    setIntroDismissed(true);
    writeWalkthroughDismissed(true);
  }, []);

  const reopenIntro = useCallback(() => {
    setIntroDismissed(false);
    writeWalkthroughDismissed(false);
    setOpenHelpStepId(null);
  }, []);

  const toggleStepHelp = useCallback((stepId, event) => {
    event.stopPropagation();
    setOpenHelpStepId((current) => (current === stepId ? null : stepId));
  }, []);

  useEffect(() => {
    if (!openHelpStepId) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (guideRef.current && !guideRef.current.contains(event.target)) {
        setOpenHelpStepId(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenHelpStepId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openHelpStepId]);

  if (!steps?.length) return null;

  const openHelpStep = steps.find((step) => step.id === openHelpStepId);

  return (
    <div className="team-build-guide-shell" ref={guideRef}>
      {!introDismissed ? (
        <aside className="team-build-walkthrough card-surface" aria-label="Workflow introduction">
          <div className="team-build-walkthrough-copy">
            <p className="team-build-walkthrough-title">How building works</p>
            <p className="team-build-walkthrough-body">
              Build the roster (sets live on each slot), Check legality, Tune matchups one tab at a
              time, then Share. Use the Team report to jump to the next fix.
            </p>
          </div>
          <button type="button" className="team-build-walkthrough-dismiss" onClick={dismissIntro}>
            Got it
          </button>
        </aside>
      ) : (
        <div className="team-build-walkthrough-reopen-row">
          <button type="button" className="team-build-walkthrough-reopen" onClick={reopenIntro}>
            How this workflow works
          </button>
        </div>
      )}

      <nav className="team-build-guide card-surface" aria-label="Team build workflow">
        <ol className="team-build-guide-steps">
          {steps.map((step, index) => {
            const isActive = step.id === activeStepId;
            const statusIcon = STEP_STATUS_ICON[step.status] || "○";
            const helpOpen = openHelpStepId === step.id;

            return (
              <li key={step.id} className="team-build-guide-step">
                <div className={`team-build-guide-step-shell ${helpOpen ? "help-open" : ""}`}>
                  <button
                    type="button"
                    className={`team-build-guide-step-btn ${isActive ? "active" : ""} status-${step.status}`}
                    aria-current={isActive ? "step" : undefined}
                    onClick={() => onStepChange(step.id)}
                  >
                    <span className="team-build-guide-step-index" aria-hidden>
                      {index + 1}
                    </span>
                    <span className="team-build-guide-step-label">{step.shortLabel}</span>
                    <span className="team-build-guide-step-status" aria-hidden>
                      {statusIcon}
                    </span>
                  </button>
                  {step.help && (
                    <button
                      type="button"
                      className={`team-build-guide-help-btn ${helpOpen ? "active" : ""}`}
                      aria-label={`About ${step.shortLabel}`}
                      aria-expanded={helpOpen}
                      aria-controls={helpOpen ? helpPanelId : undefined}
                      onClick={(event) => toggleStepHelp(step.id, event)}
                    >
                      ?
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {openHelpStep?.help && (
          <div
            id={helpPanelId}
            className="team-build-guide-help-panel"
            role="status"
          >
            <p className="team-build-guide-help-panel-title">{openHelpStep.label}</p>
            <p className="team-build-guide-help-panel-body">{openHelpStep.help}</p>
          </div>
        )}
      </nav>
    </div>
  );
};

export default TeamBuildGuide;
