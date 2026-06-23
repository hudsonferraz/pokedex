import React from "react";
import { useRegulation } from "../contexts/RegulationContext";
import {
  getRegulationLegalityTransparency,
  OFFICIAL_VGC_HANDBOOK_URL,
} from "../utils/regulation";
import "./RegulationLegalityNotice.css";

const RegulationLegalityNotice = ({ compact = false }) => {
  const { regulation } = useRegulation();
  const transparency = getRegulationLegalityTransparency(regulation);

  if (!transparency) {
    return null;
  }

  return (
    <div
      className={`regulation-legality-notice${compact ? " regulation-legality-notice-compact" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="regulation-legality-notice-icon" aria-hidden>
        !
      </div>
      <div className="regulation-legality-notice-content">
        <p className="regulation-legality-notice-title">{transparency.title}</p>
        <p className="regulation-legality-notice-message">{transparency.message}</p>
        {!compact && transparency.detail && (
          <p className="regulation-legality-notice-detail">{transparency.detail}</p>
        )}
        <a
          className="regulation-legality-notice-link"
          href={OFFICIAL_VGC_HANDBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Official VGC handbook
        </a>
      </div>
    </div>
  );
};

export default RegulationLegalityNotice;
