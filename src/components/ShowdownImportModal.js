import React, { useState } from "react";
import { useModalAccessibility } from "../hooks/useModalAccessibility";
import "./ShowdownImportModal.css";

const EXAMPLE_PASTE = `Incineroar @ Sitrus Berry
Ability: Intimidate
Level: 50
Tera Type: Dark
EVs: 252 HP / 4 Atk / 252 SpD
Impish Nature
- Fake Out
- Flare Blitz
- Knock Off
- Parting Shot`;

const ShowdownImportModal = ({ onImport, onClose, isLoading }) => {
  const [pasteText, setPasteText] = useState("");
  const modalRef = useModalAccessibility(true, onClose);

  const handleImport = () => {
    if (pasteText.trim()) {
      onImport(pasteText);
    }
  };

  return (
    <div className="showdown-import-overlay" onClick={onClose} role="presentation">
      <div
        className="showdown-import-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="showdown-import-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="showdown-import-header">
          <h2 id="showdown-import-title">Import Showdown paste</h2>
          <button type="button" className="showdown-import-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <p className="showdown-import-hint">
          Paste a team from Pokémon Showdown. We parse species, item, ability, nature, EVs, Tera type,
          and moves (up to six Pokémon).
        </p>
        <textarea
          className="showdown-import-textarea"
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          placeholder={EXAMPLE_PASTE}
          rows={14}
          disabled={isLoading}
        />
        <footer className="showdown-import-footer">
          <button type="button" className="showdown-import-btn secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            type="button"
            className="showdown-import-btn primary"
            onClick={handleImport}
            disabled={isLoading || !pasteText.trim()}
          >
            {isLoading ? "Importing…" : "Import team"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ShowdownImportModal;
