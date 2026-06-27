import React from 'react';

const ChartLine = ({ data = [], labels = [], height = 180, color = '#2563eb', accentColor = '#06b6d4' }) => {
  const chartWidth = 460;
  const chartHeight = height;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((val, index) => {
    const x = data.length > 1 ? (index / (data.length - 1)) * (chartWidth - 40) + 20 : chartWidth / 2;
    const y = chartHeight - ((val - min) / range) * (chartHeight - 40) - 20;
    return { x, y, value: val };
  });

  // Smooth bezier path
  const getSmoothedPath = (pts) => {
    if (!pts.length) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const pathD = getSmoothedPath(points);
  const areaD = points.length
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - 10} L ${points[0].x} ${chartHeight - 10} Z`
    : '';

  const gradId = `lineGrad_${Math.random().toString(36).substr(2, 6)}`;
  const glowId = `glowFilter_${Math.random().toString(36).substr(2, 6)}`;

  return (
    <div className="chart-area rounded-3">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-100">
        <defs>
          {/* Area gradient fill */}
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color}       stopOpacity="0.18" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </linearGradient>
          {/* Glow filter for the line */}
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feColorMatrix in="blur" type="matrix"
              values="0 0 0 0 0.14  0 0 0 0 0.39  0 0 0 0 0.92  0 0 0 0.5 0"
              result="coloredBlur"
            />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((frac, i) => (
          <line
            key={i}
            x1="20" y1={chartHeight * frac}
            x2={chartWidth - 20} y2={chartHeight * frac}
            stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4"
          />
        ))}

        {/* Area fill */}
        {areaD && <path d={areaD} fill={`url(#${gradId})`} />}

        {/* Main line with glow */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glowId})`}
          />
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            {/* Outer glow circle */}
            <circle cx={p.x} cy={p.y} r="7" fill={color} opacity="0.12" />
            {/* Inner circle */}
            <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={color} strokeWidth="2.5" />
          </g>
        ))}
      </svg>

      {/* Labels */}
      {labels.length > 0 && (
        <div className="d-flex justify-content-between px-2" style={{ marginTop: '6px' }}>
          {labels.map((label) => (
            <span
              key={label}
              style={{
                fontSize: '0.68rem',
                color: '#94a3b8',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChartLine;
