import React, { useState, useEffect, useMemo, useCallback } from "react";
import { searchPokemon } from "../api";
import { useMetaData } from "../contexts/MetaDataContext";
import { getMetaForRegulation } from "../utils/vgcMeta";
import {
  getPreviewMatchup,
  fillBattleBox,
  battleBoxToNames,
} from "../utils/previewMatchup";
import TypeMatchupPanel from "./TypeMatchupPanel";
import "./TeamPreviewSimulator.css";

const DRAG_MIME = "application/x-pokedex-preview-mon";
const OPPONENT_STORAGE_KEY = "vgc-preview-opponent-names";

const emptyBox = () => [null, null, null, null];

const BattleSlot = ({ pokemon, slotIndex, side, onDrop, onClear, label }) => {
  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const name = event.dataTransfer.getData(DRAG_MIME);
    if (name) onDrop(side, slotIndex, name);
  };

  return (
    <div
      className={`preview-battle-slot ${pokemon ? "filled" : "empty"}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <span className="preview-slot-label">{label}</span>
      {pokemon ? (
        <>
          <img
            src={
              pokemon.sprites?.other?.["official-artwork"]?.front_default ||
              pokemon.sprites?.front_default
            }
            alt=""
            className="preview-slot-sprite"
          />
          <span className="preview-slot-name">{pokemon.name}</span>
          <button
            type="button"
            className="preview-slot-clear"
            onClick={() => onClear(side, slotIndex)}
            aria-label={`Remove ${pokemon.name}`}
          >
            ×
          </button>
        </>
      ) : (
        <span className="preview-slot-placeholder">Drop here</span>
      )}
    </div>
  );
};

const RosterCard = ({ pokemon, draggable, onDragStart }) => (
  <div
    className={`preview-roster-card ${draggable ? "draggable" : ""}`}
    draggable={draggable}
    onDragStart={(event) => draggable && onDragStart(event, pokemon)}
  >
    <img
      src={pokemon.sprites?.front_default}
      alt=""
      className="preview-roster-sprite"
    />
    <span className="preview-roster-name">{pokemon.name}</span>
  </div>
);

const TeamPreviewSimulator = ({
  team,
  sets,
  bringList,
  setBringList,
  regulationId,
}) => {
  const [yourBox, setYourBox] = useState(emptyBox);
  const [opponentRoster, setOpponentRoster] = useState([]);
  const [opponentBox, setOpponentBox] = useState(emptyBox);
  const [opponentQuery, setOpponentQuery] = useState("");
  const [opponentLoading, setOpponentLoading] = useState(false);

  useEffect(() => {
    if (!team?.length) return;
    setYourBox(fillBattleBox(team, bringList));
  }, [team, bringList]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = sessionStorage.getItem(OPPONENT_STORAGE_KEY);
        if (!raw) return;
        const names = JSON.parse(raw);
        if (!Array.isArray(names) || names.length === 0) return;
        const loaded = [];
        for (const name of names.slice(0, 6)) {
          if (cancelled) return;
          const pokemon = await searchPokemon(name);
          if (pokemon) loaded.push(pokemon);
        }
        if (!cancelled) setOpponentRoster(loaded);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const names = opponentRoster.map((pokemon) => pokemon.name);
    sessionStorage.setItem(OPPONENT_STORAGE_KEY, JSON.stringify(names));
  }, [opponentRoster]);

  const syncYourBringList = useCallback(
    (box) => {
      if (setBringList) setBringList(battleBoxToNames(box));
    },
    [setBringList],
  );

  const handleDragStart = (event, pokemon) => {
    event.dataTransfer.setData(DRAG_MIME, pokemon.name);
    event.dataTransfer.effectAllowed = "move";
  };

  const placeInBox = (side, slotIndex, pokemonName, roster) => {
    const pokemon = roster.find((entry) => entry.name === pokemonName);
    if (!pokemon) return;

    const setter = side === "your" ? setYourBox : setOpponentBox;
    const current = side === "your" ? yourBox : opponentBox;

    const alreadyIndex = current.findIndex(
      (entry) => entry && entry.name === pokemonName,
    );
    const next = [...current];
    if (alreadyIndex >= 0) next[alreadyIndex] = null;
    next[slotIndex] = pokemon;
    setter(next);
    if (side === "your") syncYourBringList(next);
  };

  const handleDrop = (side, slotIndex, name) => {
    const roster = side === "your" ? team : opponentRoster;
    placeInBox(side, slotIndex, name, roster);
  };

  const handleClear = (side, slotIndex) => {
    const setter = side === "your" ? setYourBox : setOpponentBox;
    const current = side === "your" ? yourBox : opponentBox;
    const next = [...current];
    next[slotIndex] = null;
    setter(next);
    if (side === "your") syncYourBringList(next);
  };

  const addOpponentPokemon = async (nameOrQuery) => {
    const query = (nameOrQuery || opponentQuery).trim().toLowerCase();
    if (!query || opponentRoster.length >= 6) return;

    setOpponentLoading(true);
    try {
      const pokemon = await searchPokemon(query.replace(/\s+/g, "-"));
      if (!pokemon) return;
      if (opponentRoster.some((entry) => entry.name === pokemon.name)) return;
      setOpponentRoster((prev) => [...prev, pokemon].slice(0, 6));
      setOpponentQuery("");
    } finally {
      setOpponentLoading(false);
    }
  };

  const removeOpponent = (name) => {
    setOpponentRoster((prev) => prev.filter((entry) => entry.name !== name));
    setOpponentBox((prev) =>
      prev.map((entry) => (entry?.name === name ? null : entry)),
    );
  };

  const yourActive = yourBox.filter(Boolean);
  const opponentActive = opponentBox.filter(Boolean);

  const matchup = useMemo(
    () => getPreviewMatchup(yourActive, opponentActive, sets),
    [yourActive, opponentActive, sets],
  );

  const { meta: liveMeta } = useMetaData();
  const meta = getMetaForRegulation(regulationId, liveMeta);

  if (!team?.length) return null;

  return (
    <section className="team-preview-simulator card-surface" aria-labelledby="preview-sim-title">
      <header className="preview-sim-header">
        <h2 id="preview-sim-title">Team preview simulator</h2>
        <p className="preview-sim-copy">
          Drag four Pokémon into each battle box — type matchup only (no damage calc). Mirrors
          team preview before you commit your bring-4.
        </p>
      </header>

      <div className="preview-sim-columns">
        <div className="preview-sim-side">
          <h3>Your team</h3>
          <div className="preview-roster-row">
            {team.map((pokemon) => (
              <RosterCard
                key={pokemon.name}
                pokemon={pokemon}
                draggable
                onDragStart={handleDragStart}
              />
            ))}
          </div>
          <p className="preview-box-label">Your battle box (4)</p>
          <div className="preview-battle-box">
            {yourBox.map((pokemon, index) => (
              <BattleSlot
                key={`your-${index}`}
                pokemon={pokemon}
                slotIndex={index}
                side="your"
                label={`You ${index + 1}`}
                onDrop={handleDrop}
                onClear={handleClear}
              />
            ))}
          </div>
        </div>

        <div className="preview-sim-vs" aria-hidden>
          VS
        </div>

        <div className="preview-sim-side">
          <h3>Opponent</h3>
          <div className="preview-opponent-add">
            <input
              type="text"
              className="preview-opponent-input"
              placeholder="Add species, e.g. incineroar"
              value={opponentQuery}
              onChange={(event) => setOpponentQuery(event.target.value)}
              onKeyDown={(event) =>
                event.key === "Enter" && !opponentLoading && addOpponentPokemon()
              }
              disabled={opponentLoading || opponentRoster.length >= 6}
            />
            <button
              type="button"
              className="preview-opponent-btn"
              onClick={() => addOpponentPokemon()}
              disabled={opponentLoading || opponentRoster.length >= 6}
            >
              Add
            </button>
          </div>
          <div className="preview-meta-quick">
            {(meta.topPokemon || []).slice(0, 6).map((speciesId) => (
              <button
                key={speciesId}
                type="button"
                className="preview-meta-chip"
                onClick={() => addOpponentPokemon(speciesId)}
                disabled={opponentRoster.length >= 6}
              >
                + {speciesId.replace(/-/g, " ")}
              </button>
            ))}
          </div>
          <div className="preview-roster-row">
            {opponentRoster.map((pokemon) => (
              <div key={pokemon.name} className="preview-roster-card-wrap">
                <RosterCard
                  pokemon={pokemon}
                  draggable
                  onDragStart={handleDragStart}
                />
                <button
                  type="button"
                  className="preview-roster-remove"
                  onClick={() => removeOpponent(pokemon.name)}
                  aria-label={`Remove ${pokemon.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="preview-box-label">Opponent preview (4)</p>
          <div className="preview-battle-box">
            {opponentBox.map((pokemon, index) => (
              <BattleSlot
                key={`opp-${index}`}
                pokemon={pokemon}
                slotIndex={index}
                side="opponent"
                label={`Them ${index + 1}`}
                onDrop={handleDrop}
                onClear={handleClear}
              />
            ))}
          </div>
        </div>
      </div>

      {matchup.ready && (
        <div className="preview-matchup-results">
          <h3>Type matchup matrix</h3>
          <div className="preview-matchup-grid">
            <TypeMatchupPanel
              title="Your pressure into them"
              subtitle={`Based on your ${matchup.yourCoverageSource}`}
              offenseCoverage={matchup.yourPressure}
              superEffectiveTypes={matchup.yourSuperEffective}
              defensiveWeaknesses={matchup.yourDefensiveWeaknesses}
            />
            <TypeMatchupPanel
              title="Their pressure into you"
              subtitle="Based on opponent typings"
              offenseCoverage={matchup.opponentPressure}
              superEffectiveTypes={matchup.opponentSuperEffective}
              defensiveWeaknesses={matchup.opponentDefensiveWeaknesses}
            />
          </div>
          <p className="preview-matchup-summary">
            {matchup.opponentSuperEffective.length > 0
              ? `Watch ${matchup.opponentSuperEffective.slice(0, 5).join(", ")} — opponent can hit those types at 2× into your box. `
              : "Your preview box has no shared 2× type weaknesses from their typings. "}
            {matchup.yourSuperEffective.length > 0
              ? `You threaten ${matchup.yourSuperEffective.slice(0, 5).join(", ")} at 2×.`
              : "Add stronger offensive typings or moves into their squad."}
          </p>
        </div>
      )}

      {(yourActive.length < 4 || opponentActive.length < 4) && (
        <p className="preview-sim-hint">
          Fill both battle boxes with 4 Pokémon each to see the full type matrix.
        </p>
      )}
    </section>
  );
};

export default TeamPreviewSimulator;
