import React, { useState, useEffect } from "react";
import { VGC_ITEMS, VGC_NATURES, TERA_TYPES } from "../constants/vgcOptions";
import { useModalAccessibility } from "../hooks/useModalAccessibility";
import "./PokemonSetModal.css";

const formatAbilityName = (name) =>
  (name || "").replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const PokemonSetModal = ({ pokemon, currentSet, onSave, onClose }) => {
  const modalRef = useModalAccessibility(true, onClose);
  const [ability, setAbility] = useState(currentSet.ability || "");
  const [item, setItem] = useState(currentSet.item || "");
  const [nature, setNature] = useState(currentSet.nature || "");
  const [teraType, setTeraType] = useState(currentSet.teraType || "");
  const [evs, setEvs] = useState(currentSet.evs || "");

  useEffect(() => {
    setAbility(currentSet.ability || "");
    setItem(currentSet.item || "");
    setNature(currentSet.nature || "");
    setTeraType(currentSet.teraType || "");
    setEvs(currentSet.evs || "");
  }, [pokemon?.name, currentSet]);

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
    onClose();
  };

  return (
    <div className="pokemon-set-overlay" onClick={onClose} role="presentation">
      <div
        className="pokemon-set-modal"
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
