import React, { useState, useEffect, useCallback } from "react";
import { VGC_ITEMS, VGC_NATURES, TERA_TYPES } from "../constants/vgcOptions";
import { useModalAccessibility } from "../hooks/useModalAccessibility";
import { useRegulation } from "../contexts/RegulationContext";
import { fetchPokemonMeta } from "../services/metaDataService";
import { buildSetPatchFromPokemonMeta } from "../utils/pikalyticsNames";
import "./PokemonSetModal.css";

const formatAbilityName = (name) =>
  (name || "").replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const PokemonSetModal = ({ pokemon, currentSet, onSave, onClose }) => {
  const modalRef = useModalAccessibility(true, onClose);
  const { regulationId } = useRegulation();
  const [ability, setAbility] = useState(currentSet.ability || "");
  const [item, setItem] = useState(currentSet.item || "");
  const [nature, setNature] = useState(currentSet.nature || "");
  const [teraType, setTeraType] = useState(currentSet.teraType || "");
  const [evs, setEvs] = useState(currentSet.evs || "");
  const [metaPreview, setMetaPreview] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState("");
  const [applyingMeta, setApplyingMeta] = useState(false);
  const [metaAppliedFlash, setMetaAppliedFlash] = useState(false);

  const speciesId = pokemon?.name || "";
  const learnsetMoveIds = (pokemon?.moves || [])
    .map((entry) => entry.move?.name)
    .filter(Boolean);

  useEffect(() => {
    setAbility(currentSet.ability || "");
    setItem(currentSet.item || "");
    setNature(currentSet.nature || "");
    setTeraType(currentSet.teraType || "");
    setEvs(currentSet.evs || "");
  }, [pokemon?.name, currentSet]);

  const loadMetaPreview = useCallback(async () => {
    if (!speciesId) return;
    setMetaLoading(true);
    setMetaError("");
    const result = await fetchPokemonMeta(regulationId, speciesId);
    setMetaLoading(false);
    if (result.error || !result.suggestedSet) {
      setMetaPreview(null);
      setMetaError(result.error || "No meta data for this Pokémon in the current format.");
      return;
    }
    setMetaPreview(result);
  }, [regulationId, speciesId]);

  useEffect(() => {
    loadMetaPreview();
  }, [loadMetaPreview]);

  const abilityOptions = (pokemon?.abilities || []).map((entry) => {
    const name = entry.ability?.name || entry.ability;
    return formatAbilityName(name);
  });

  const defaultTera =
    pokemon?.types?.[0]?.type?.name
      ? pokemon.types[0].type.name.charAt(0).toUpperCase() + pokemon.types[0].type.name.slice(1)
      : "";

  const handleSave = () => {
    onSave({
      ability,
      item,
      nature,
      teraType: teraType || defaultTera,
      evs,
    });
  };

  const handleApplySpread = (spread) => {
    if (spread.nature) setNature(spread.nature);
    if (spread.evs) setEvs(spread.evs);
    if (spread.ability) setAbility(spread.ability);
    if (spread.item) setItem(spread.item);
  };

  const handleApplyMetaSet = async () => {
    setApplyingMeta(true);
    setMetaError("");
    const result = metaPreview?.suggestedSet
      ? metaPreview
      : await fetchPokemonMeta(regulationId, speciesId);
    setApplyingMeta(false);

    if (result.error || !result.suggestedSet) {
      setMetaError(result.error || "No meta set available for this format.");
      return;
    }

    const patch = buildSetPatchFromPokemonMeta(result, learnsetMoveIds);
    if (!patch) {
      setMetaError("Could not build a set from meta data.");
      return;
    }

    setAbility(patch.ability || ability);
    setItem(patch.item || item);
    setNature(patch.nature || nature);
    setTeraType(patch.teraType || teraType || defaultTera);
    setEvs(patch.evs || evs);
    setMetaPreview(result);
    setMetaAppliedFlash(true);

    window.setTimeout(() => {
      onSave({
        ...patch,
        teraType: patch.teraType || teraType || defaultTera,
      });
    }, 450);
  };

  const suggested = metaPreview?.suggestedSet;
  const topMoveLabels =
    metaPreview?.moves?.slice(0, 4).map((entry) => entry.name) ||
    suggested?.moveLabels?.slice(0, 4) ||
    [];

  const teraTypeOptions =
    metaPreview?.teraTypes?.length > 0
      ? metaPreview.teraTypes.map((entry) => entry.name)
      : [];

  return (
    <div className="pokemon-set-overlay" onClick={onClose} role="presentation">
      <div
        className={`pokemon-set-modal${metaAppliedFlash ? " meta-applied-flash" : ""}`}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pokemon-set-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="pokemon-set-header">
          <h2 id="pokemon-set-title">
            VGC set — {pokemon?.name}
          </h2>
          <button type="button" className="pokemon-set-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="pokemon-set-body">
          {(metaLoading || metaPreview || metaError) && (
            <div className="pokemon-set-meta-strip" aria-live="polite">
              {metaLoading && <p className="pokemon-set-meta-status">Loading Pikalytics meta…</p>}
              {!metaLoading && metaPreview && (
                <>
                  <div className="pokemon-set-meta-header">
                    <span className="pokemon-set-meta-badge">Live meta</span>
                    {metaPreview.usage != null && (
                      <span className="pokemon-set-meta-stat">{metaPreview.usage}% usage</span>
                    )}
                    {metaPreview.winRate != null && (
                      <span className="pokemon-set-meta-stat">{metaPreview.winRate}% WR</span>
                    )}
                  </div>
                  {topMoveLabels.length > 0 && (
                    <p className="pokemon-set-meta-moves">
                      Top moves: {topMoveLabels.join(", ")}
                    </p>
                  )}
                  {metaPreview.teammates?.length > 0 && (
                    <p className="pokemon-set-meta-teammates">
                      Common partners:{" "}
                      {metaPreview.teammates
                        .slice(0, 3)
                        .map((entry) => entry.name)
                        .join(", ")}
                    </p>
                  )}
                  {metaPreview.sourceUrl && (
                    <a
                      className="pokemon-set-meta-link"
                      href={metaPreview.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on Pikalytics
                    </a>
                  )}
                </>
              )}
              {!metaLoading && metaError && !metaPreview && (
                <p className="pokemon-set-meta-error">{metaError}</p>
              )}
            </div>
          )}

          {metaPreview?.evSpreads?.length > 0 && (
            <div className="pokemon-set-spreads">
              <h3 className="pokemon-set-section-title">Spread comparison</h3>
              <ul className="pokemon-set-spread-list">
                {metaPreview.evSpreads.map((spread, index) => (
                  <li key={`${spread.label}-${index}`} className="pokemon-set-spread-item">
                    <div className="pokemon-set-spread-info">
                      <span className="pokemon-set-spread-label">{spread.label}</span>
                      {spread.nature && spread.evs && (
                        <span className="pokemon-set-spread-detail">
                          {spread.nature} · {spread.evs}
                          {spread.percent != null ? ` (${spread.percent}%)` : ""}
                        </span>
                      )}
                      {spread.item && (
                        <span className="pokemon-set-spread-detail">
                          {spread.ability ? `${spread.ability} · ` : ""}
                          {spread.item}
                          {spread.moves?.length ? ` · ${spread.moves.join(", ")}` : ""}
                        </span>
                      )}
                      {spread.trainer && (
                        <span className="pokemon-set-spread-trainer">
                          {spread.trainer}
                          {spread.record ? ` (${spread.record})` : ""}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="pokemon-set-spread-use"
                      onClick={() => handleApplySpread(spread)}
                    >
                      Use
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {teraTypeOptions.length > 0 && (
            <div className="pokemon-set-tera-meta">
              <span className="pokemon-set-section-title">Meta Tera types</span>
              <div className="pokemon-set-tera-chips">
                {metaPreview.teraTypes.slice(0, 5).map((entry) => (
                  <button
                    key={entry.name}
                    type="button"
                    className={`pokemon-set-tera-chip ${
                      teraType === entry.name ? "active" : ""
                    }`}
                    onClick={() => setTeraType(entry.name)}
                  >
                    {entry.name}
                    {entry.percent != null ? ` ${entry.percent}%` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {metaPreview?.featuredTeams?.length > 0 && (
            <details className="pokemon-set-featured">
              <summary>
                Featured tournament teams ({metaPreview.featuredTeams.length})
              </summary>
              <ul className="pokemon-set-featured-list">
                {metaPreview.featuredTeams.slice(0, 5).map((entry) => (
                  <li key={entry.id} className="pokemon-set-featured-item">
                    <div className="pokemon-set-featured-head">
                      <strong>{entry.trainer}</strong>
                      {entry.record && <span>{entry.record}</span>}
                    </div>
                    {entry.pokemon.length > 0 && (
                      <p className="pokemon-set-featured-roster">
                        {entry.pokemon.join(", ")}
                      </p>
                    )}
                    {entry.speciesSet && (
                      <p className="pokemon-set-featured-set">
                        {entry.speciesSet.ability && `${entry.speciesSet.ability} · `}
                        {entry.speciesSet.item}
                        {entry.speciesSet.moves?.length
                          ? ` — ${entry.speciesSet.moves.join(", ")}`
                          : ""}
                      </p>
                    )}
                    {entry.speciesSet && (
                      <button
                        type="button"
                        className="pokemon-set-featured-use"
                        onClick={() => handleApplySpread(entry.speciesSet)}
                      >
                        Use this set
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <label className="pokemon-set-field">
            <span>Ability</span>
            <select value={ability} onChange={(event) => setAbility(event.target.value)}>
              <option value="">— Select —</option>
              {abilityOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="pokemon-set-field">
            <span>Item</span>
            <select value={item} onChange={(event) => setItem(event.target.value)}>
              {VGC_ITEMS.map((entry) => (
                <option key={entry || "none"} value={entry}>
                  {entry || "— None —"}
                </option>
              ))}
            </select>
          </label>

          <label className="pokemon-set-field">
            <span>Nature</span>
            <select value={nature} onChange={(event) => setNature(event.target.value)}>
              {VGC_NATURES.map((entry) => (
                <option key={entry || "none"} value={entry}>
                  {entry || "— None —"}
                </option>
              ))}
            </select>
          </label>

          <label className="pokemon-set-field">
            <span>Tera type</span>
            <select value={teraType} onChange={(event) => setTeraType(event.target.value)}>
              {TERA_TYPES.map((entry) => (
                <option key={entry || "none"} value={entry}>
                  {entry || (defaultTera ? `Default (${defaultTera})` : "— None —")}
                </option>
              ))}
            </select>
          </label>

          <label className="pokemon-set-field">
            <span>EVs (Showdown format)</span>
            <input
              type="text"
              value={evs}
              onChange={(event) => setEvs(event.target.value)}
              placeholder="252 HP / 4 Atk / 252 Spe"
            />
          </label>
        </div>

        <footer className="pokemon-set-footer">
          <button
            type="button"
            className={`pokemon-set-btn meta${metaAppliedFlash ? " meta-applied-success" : ""}`}
            onClick={handleApplyMetaSet}
            disabled={metaLoading || applyingMeta || metaAppliedFlash}
          >
            {metaAppliedFlash ? "Applied ✓" : applyingMeta ? "Applying…" : "Apply meta set"}
          </button>
          <button type="button" className="pokemon-set-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="pokemon-set-btn save" onClick={handleSave}>
            Save set
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PokemonSetModal;
