import React, { useState } from "react";
import "./CollapsibleSection.css";

const CollapsibleSection = ({
  title,
  summary,
  defaultOpen = true,
  children,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sectionId = title.replace(/\s+/g, "-").toLowerCase();

  return (
    <section className={`collapsible-section ${className}`.trim()}>
      <button
        type="button"
        className="collapsible-section-trigger"
        aria-expanded={isOpen}
        aria-controls={`panel-${sectionId}`}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="collapsible-section-heading">
          <span className="collapsible-section-title">{title}</span>
          {summary && !isOpen && (
            <span className="collapsible-section-summary">{summary}</span>
          )}
        </span>
        <span className="collapsible-section-chevron" aria-hidden>
          {isOpen ? "▾" : "▸"}
        </span>
      </button>
      {isOpen && (
        <div
          id={`panel-${sectionId}`}
          className="collapsible-section-panel"
          role="region"
          aria-label={title}
        >
          {children}
        </div>
      )}
    </section>
  );
};

export default CollapsibleSection;
