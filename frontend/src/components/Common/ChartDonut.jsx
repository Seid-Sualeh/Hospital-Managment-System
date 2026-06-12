import React from "react";

const ChartDonut = ({ segments = [], size = 160 }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let offset = 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="d-flex flex-column align-items-center">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * circumference;
          const gap = circumference - dash;
          const el = (
            <circle
              key={seg.label}
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
            />
          );
          offset += dash;
          return el;
        })}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fw-bold"
          fontSize="10"
          fill="#1e293b"
        >
          {total}
        </text>
      </svg>
      <div className="d-flex flex-wrap gap-3 justify-content-center mt-3">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="d-flex align-items-center gap-2 small"
          >
            <span className="chart-dot" style={{ background: seg.color }} />
            <span className="text-muted">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartDonut;
