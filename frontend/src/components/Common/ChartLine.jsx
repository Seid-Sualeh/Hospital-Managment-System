import React from 'react';

const ChartLine = ({ data = [], labels = [], height = 180, color = '#2d5cfe' }) => {
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

  const pathD = points.length ? `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}` : '';
  const areaD = points.length
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - 10} L ${points[0].x} ${chartHeight - 10} Z`
    : '';

  return (
    <div className="chart-area p-2 rounded border bg-white">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-100">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[20, 65, 110].map((y) => (
          <line key={y} x1="20" y1={y} x2={chartWidth - 20} y2={y} stroke="#f1f5f9" strokeWidth="1" />
        ))}
        {areaD && <path d={areaD} fill="url(#lineGrad)" />}
        {pathD && (
          <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        )}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#fff" stroke={color} strokeWidth="2" />
        ))}
      </svg>
      {labels.length > 0 && (
        <div className="d-flex justify-content-between px-2 mt-2">
          {labels.map((label) => (
            <span key={label} className="text-muted small">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChartLine;
