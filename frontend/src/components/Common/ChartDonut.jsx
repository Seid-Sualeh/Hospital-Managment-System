import React from "react";

const ChartDonut = ({ segments = [], size = 160 }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let offset = 0;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const center = 50;

  const glowId = `donutGlow_${Math.random().toString(36).substr(2, 6)}`;

  return (
    <div className="d-flex flex-column align-items-center">
      <div style={{ position: "relative", display: "inline-block" }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          <defs>
            <filter id={glowId}>
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background ring */}
          <circle
            cx={center} cy={center} r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth="13"
          />

          {/* Colored segments */}
          {segments.map((seg, i) => {
            const dash = (seg.value / total) * circumference;
            const gap = circumference - dash;
            const el = (
              <circle
                key={seg.label || i}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth="13"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                filter={`url(#${glowId})`}
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            );
            offset += dash;
            return el;
          })}

          {/* Center label */}
          <text
            x={center} y={center - 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="13"
            fontWeight="800"
            fill="#0f172a"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {total}
          </text>
          <text
            x={center} y={center + 9}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="6.5"
            fontWeight="600"
            fill="#94a3b8"
            style={{ fontFamily: "'Inter', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Total
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div
        className="d-flex flex-wrap gap-3 justify-content-center"
        style={{ marginTop: '12px' }}
      >
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="d-flex align-items-center gap-1"
            style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: seg.color,
                display: 'inline-block',
                boxShadow: `0 0 6px ${seg.color}80`,
                flexShrink: 0,
              }}
            />
            <span>{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartDonut;
