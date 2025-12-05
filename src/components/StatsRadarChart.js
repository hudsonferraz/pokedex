import React from "react";
import "./StatsRadarChart.css";

const StatsRadarChart = ({ stats, color }) => {
  const statNames = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
  const maxStat = 255;
  const centerX = 175;
  const centerY = 175;
  const radius = 120;

  const getStatValue = (statName) => {
    const statMap = {
      "HP": stats.find(s => s.stat.name === "hp")?.base_stat || 0,
      "Attack": stats.find(s => s.stat.name === "attack")?.base_stat || 0,
      "Defense": stats.find(s => s.stat.name === "defense")?.base_stat || 0,
      "Sp. Atk": stats.find(s => s.stat.name === "special-attack")?.base_stat || 0,
      "Sp. Def": stats.find(s => s.stat.name === "special-defense")?.base_stat || 0,
      "Speed": stats.find(s => s.stat.name === "speed")?.base_stat || 0,
    };
    return statMap[statName] || 0;
  };

  const getPoint = (index, value) => {
    const angle = (index * 2 * Math.PI) / statNames.length - Math.PI / 2;
    const normalizedValue = value / maxStat;
    const x = centerX + radius * normalizedValue * Math.cos(angle);
    const y = centerY + radius * normalizedValue * Math.sin(angle);
    return { x, y };
  };

  const getLabelPoint = (index) => {
    const angle = (index * 2 * Math.PI) / statNames.length - Math.PI / 2;
    const labelRadius = radius + 25;
    const x = centerX + labelRadius * Math.cos(angle);
    const y = centerY + labelRadius * Math.sin(angle);
    return { x, y };
  };

  const points = statNames.map((statName, index) => {
    const value = getStatValue(statName);
    return getPoint(index, value);
  });

  const pathData = points.map((point, index) => {
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }).join(' ') + ' Z';

  return (
    <svg width="300" height="300" viewBox="0 0 350 350" className="radar-chart-svg">
        {/* Grid circles */}
        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <circle
            key={i}
            cx={centerX}
            cy={centerY}
            r={radius * scale}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="1"
          />
        ))}
        
        {/* Grid lines */}
        {statNames.map((_, index) => {
          const angle = (index * 2 * Math.PI) / statNames.length - Math.PI / 2;
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

        {/* Stats polygon */}
        <path
          d={pathData}
          fill={color}
          fillOpacity="0.3"
          stroke={color}
          strokeWidth="2"
        />

        {/* Stat points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={color}
            stroke="white"
            strokeWidth="2"
          />
        ))}

        {/* Stat labels */}
        {statNames.map((statName, index) => {
          const labelPoint = getLabelPoint(index);
          const value = getStatValue(statName);
          return (
            <g key={index}>
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="radar-label"
              >
                {statName}
              </text>
              <text
                x={labelPoint.x}
                y={labelPoint.y + 12}
                textAnchor="middle"
                dominantBaseline="middle"
                className="radar-value"
              >
                {value}
              </text>
            </g>
          );
        })}
      </svg>
  );
};

export default StatsRadarChart;

