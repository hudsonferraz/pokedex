import React from "react";
import "./BuildStepSection.css";

const BuildStepSection = ({
  stepId,
  stepNumber,
  title,
  description,
  status,
  isActive,
  onActivate,
  children,
}) => {
  const sectionRef = React.useRef(null);

  React.useEffect(() => {
    if (isActive && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isActive]);

  if (!isActive) {
    return (
      <section
        ref={sectionRef}
        id={`build-step-${stepId}`}
        className="build-step-section build-step-section-collapsed card-surface"
      >
        <button
          type="button"
          className="build-step-section-collapsed-trigger"
          onClick={onActivate}
          aria-expanded={false}
          aria-controls={`build-step-panel-${stepId}`}
        >
          <span className="build-step-section-collapsed-heading">
            <span className="build-step-section-number">{stepNumber}</span>
            <span className="build-step-section-title">{title}</span>
          </span>
          <span className={`build-step-section-badge status-${status}`}>
            {status === "complete" ? "Done" : status === "attention" ? "Needs work" : "Up next"}
          </span>
        </button>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id={`build-step-${stepId}`}
      className="build-step-section build-step-section-active card-surface"
      aria-current="step"
    >
      <header className="build-step-section-header">
        <div>
          <p className="build-step-section-eyebrow">Step {stepNumber}</p>
          <h2 className="build-step-section-title">{title}</h2>
          {description && <p className="build-step-section-description">{description}</p>}
        </div>
        <span className={`build-step-section-badge status-${status}`}>
          {status === "complete" ? "Complete" : status === "attention" ? "Needs attention" : "In progress"}
        </span>
      </header>
      <div id={`build-step-panel-${stepId}`} className="build-step-section-panel">
        {children}
      </div>
    </section>
  );
};

export default BuildStepSection;
