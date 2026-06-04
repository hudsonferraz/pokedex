import React from "react";
import "./StatsRadarChart.css";

const STAT_LABELS = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
const STAT_KEYS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
const MAX_STAT = 255;

const TeamAverageRadar = ({ averages, color = "#6890F0" }) => {
  const centerX = 120;
  const centerY = 120;
  const radius = 72;

  const getValue = (index) => averages[STAT_KEYS[index]] || 0;

  const getPoint = (index, value) => {
    const angle = (index * 2 * Math.PI) / STAT_LABELS.length - Math.PI / 2;
    const normalizedValue = value / MAX_STAT;
    const x = centerX + radius * normalizedValue * Math.cos(angle);
    const y = centerY + radius * normalizedValue * Math.sin(angle);
    return { x, y };
  };

  const getLabelPoint = (index) => {
    const angle = (index * 2 * Math.PI) / STAT_LABELS.length - Math.PI / 2;
    const labelRadius = radius + 18;
    const x = centerX + labelRadius * Math.cos(angle);
    const y = centerY + labelRadius * Math.sin(angle);
    return { x, y };
  };

  const points = STAT_LABELS.map((_, index) => getPoint(index, getValue(index)));
  const pathData =
    points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ") +
    " Z";

  return (
    <svg
      width="240"
      height="240"
      viewBox="0 0 240 240"
      className="radar-chart-svg team-average-radar"
      role="img"
      aria-label="Team average base stats radar chart"
    >
      {[0.25, 0.5, 0.75, 1].map((scale, index) => (
        <circle
          key={index}
          cx={centerX}
          cy={centerY}
          r={radius * scale}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="1"
        />
      ))}
      {STAT_LABELS.map((_, index) => {
        const angle = (index * 2 * Math.PI) / STAT_LABELS.length - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return (
          <line
            key={index}
            x1={centerX}
            y1={centerY}
            x2={x}
            y2={y}
            stroke="var(--border-color)"
            strokeWidth="1"
          />
        );
      })}
      <path
        d={pathData}
        fill={color}
        fillOpacity="0.35"
        stroke={color}
        strokeWidth="2"
      />
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="3"
          fill={color}
          stroke="var(--card-bg)"
          strokeWidth="1.5"
        />
      ))}
      {STAT_LABELS.map((label, index) => {
        const labelPoint = getLabelPoint(index);
        const value = getValue(index);
        return (
          <g key={label}>
            <text
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="radar-label"
              fontSize="9"
            >
              {label}
            </text>
            <text
              x={labelPoint.x}
              y={labelPoint.y + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              className="radar-value"
              fontSize="8"
            >
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default TeamAverageRadar;
