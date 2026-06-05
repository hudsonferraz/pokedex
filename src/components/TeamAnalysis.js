import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ToastProvider";
import {
  openDamageCalcWithTeam,
  getDamageCalcUrl,
  getDamageCalcLinkLabel,
} from "../utils/damageCalcLink";
import { enrichSetsWithMoveTypes } from "../utils/resolveMoveTypes";
import {
  getTeamWeaknesses,
  getTeamTypeCoverage,
  getTeamMoveCoverage,
  getMoveCoverageGaps,
  getTeamStats,
  getUniqueTypes,
} from "../utils/teamAnalysis";
import { getTypeColor, ALL_POKEMON_TYPES } from "../constants/typeColors";
import CollapsibleSection from "./CollapsibleSection";
import TeamAverageRadar from "./TeamAverageRadar";
import TypeCoverageBars from "./TypeCoverageBars";
import "./TeamAnalysis.css";

const TeamAnalysis = ({
  team,
  sets,
  teamName = "Team",
  regulationId = "champions-reg-ma",
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [enrichedSets, setEnrichedSets] = useState(sets || {});
  const [resolvingMoves, setResolvingMoves] = useState(false);

  useEffect(() => {
    if (!team?.length) {
      setEnrichedSets(sets || {});
      return undefined;
    }

    let cancelled = false;
    setResolvingMoves(true);

    enrichSetsWithMoveTypes(team, sets).then((next) => {
      if (!cancelled) {
        setEnrichedSets(next);
        setResolvingMoves(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [team, sets]);

  const handleOpenDamageCalc = async () => {
    try {
      const result = await openDamageCalcWithTeam(
        team,
        sets,
        teamName,
        regulationId,
      );
      if (result.copied) {
        showToast("Showdown paste copied — paste into the damage calc", "success");
      } else {
        showToast("Opened damage calc — export your team paste from Export menu", "info");
      }
    } catch {
      showToast("Could not open damage calc", "error");
    }
  };

  const calcUrl = getDamageCalcUrl(regulationId);
  const calcLinkLabel = getDamageCalcLinkLabel(regulationId);

  const hasSelectedMoves = team?.some(
    (pokemon) => enrichedSets?.[pokemon?.name]?.moves?.length > 0,
  );

  const moveCoverage = useMemo(
    () => getTeamMoveCoverage(team || [], enrichedSets),
    [team, enrichedSets],
  );
  const typeCoverage = useMemo(
    () => getTeamTypeCoverage(team || []),
    [team],
  );

  if (!team || team.length === 0) {
    return (
      <div className="team-analysis-empty card-surface">
        <h2 className="team-analysis-empty-title">Team analysis</h2>
        <p>Add Pokémon to your team to see coverage, weaknesses, and average stats.</p>
        <button
          type="button"
          className="team-analysis-empty-cta"
          onClick={() => navigate("/browse")}
        >
          Browse Pokédex
        </button>
      </div>
    );
  }

  const weaknesses = getTeamWeaknesses(team);
  const stats = getTeamStats(team);
  const uniqueTypes = getUniqueTypes(team);

  const coverage = hasSelectedMoves ? moveCoverage : typeCoverage;
  const coverageSource = hasSelectedMoves ? "selected moves" : "Pokémon types";

  const superEffectiveWeaknesses = Object.entries(weaknesses)
    .filter(([, value]) => value === "super-effective")
    .map(([type]) => type);

  const resistantTypes = Object.entries(weaknesses)
    .filter(([, value]) => value === "resistant" || value === "immune")
    .map(([type]) => type);

  const superEffectiveCoverage = Object.entries(coverage)
    .filter(([, value]) => value === "super-effective")
    .map(([type]) => type);

  const noCoverageTypes = Object.entries(coverage)
    .filter(([, value]) => value === "no-effect" || value === "not-very-effective")
    .map(([type]) => type);

  const threatGaps = getMoveCoverageGaps(coverage);

  return (
    <div className="team-analysis card-surface">
      <header className="team-analysis-header">
        <h2 className="team-analysis-title">Team analysis</h2>
        <p className="team-analysis-subtitle">
          {team.length}/6 · {superEffectiveCoverage.length}/18 at 2× ({coverageSource})
          {uniqueTypes.length > 0 && ` · ${uniqueTypes.length} types`}
        </p>
      </header>

      <div className="team-analysis-dashboard team-analysis-compact">
        <CollapsibleSection
          title="Overview"
          summary={`Avg BST radar · ${uniqueTypes.length} types`}
          defaultOpen={false}
        >
          <div className="analysis-overview-grid analysis-overview-compact">
            <div className="analysis-overview-types">
              <p className="analysis-label">Types represented</p>
              <div className="team-types-display">
                {uniqueTypes.map((type) => (
                  <span
                    key={type}
                    className="type-badge"
                    style={{ backgroundColor: getTypeColor(type) }}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
            <div className="analysis-overview-radar">
              <TeamAverageRadar averages={stats} color="#6890F0" compact />
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Defensive matchups"
          summary={
            superEffectiveWeaknesses.length > 0
              ? `Weak to ${superEffectiveWeaknesses.slice(0, 3).join(", ")}`
              : "No critical weaknesses"
          }
          defaultOpen={false}
        >
          <h4 className="analysis-subheading">Critical weaknesses (2×)</h4>
          {superEffectiveWeaknesses.length > 0 ? (
            <div className="weakness-list">
              {superEffectiveWeaknesses.map((type) => (
                <span
                  key={type}
                  className="weakness-badge critical"
                  style={{ backgroundColor: getTypeColor(type) }}
                >
                  {type}
                </span>
              ))}
            </div>
          ) : (
            <p className="analysis-note positive">No critical weaknesses.</p>
          )}
          <h4 className="analysis-subheading">Resistances &amp; immunities</h4>
          {resistantTypes.length > 0 ? (
            <div className="weakness-list">
              {resistantTypes.map((type) => (
                <span
                  key={type}
                  className="weakness-badge positive"
                  style={{ backgroundColor: getTypeColor(type) }}
                >
                  {type}
                </span>
              ))}
            </div>
          ) : (
            <p className="analysis-note">No notable resistances.</p>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title={hasSelectedMoves ? "Move-based coverage" : "Offensive coverage (types)"}
          summary={`${superEffectiveCoverage.length} types at 2×`}
          defaultOpen
        >
          {!hasSelectedMoves && (
            <p className="analysis-note">
              Select moves on each Pokémon to analyze coverage from your movesets, not just typings.
            </p>
          )}
          {hasSelectedMoves && resolvingMoves && (
            <p className="analysis-note">Resolving move types from Pokédex…</p>
          )}
          <p className="analysis-note analysis-note-inline">
            Super-effective against {superEffectiveCoverage.length} of{" "}
            {ALL_POKEMON_TYPES.length} types ({coverageSource}).
            {threatGaps.length > 0 && (
              <span className="coverage-gap-hint coverage-gap-threat">
                {" "}
                VGC threat gaps (no SE): {threatGaps.join(", ")}
              </span>
            )}
            {noCoverageTypes.length > 0 && (
              <span className="coverage-gap-hint">
                {" "}
                Weak coverage: {noCoverageTypes.slice(0, 5).join(", ")}
                {noCoverageTypes.length > 5 ? "…" : ""}
              </span>
            )}
          </p>
          <TypeCoverageBars coverage={coverage} compact />
        </CollapsibleSection>

        <CollapsibleSection title="Tools" defaultOpen={false}>
          <p className="analysis-note">
            Weak to:{" "}
            {superEffectiveWeaknesses.length > 0
              ? superEffectiveWeaknesses.join(", ")
              : "none"}
            . Resist/immune:{" "}
            {resistantTypes.length > 0 ? resistantTypes.join(", ") : "none"}.
          </p>
          <div className="analysis-tools-actions">
            <button type="button" className="damage-calc-btn" onClick={handleOpenDamageCalc}>
              Open calc + copy team paste
            </button>
            <a
              href={calcUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="damage-calc-link"
            >
              {calcLinkLabel}
            </a>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default TeamAnalysis;
