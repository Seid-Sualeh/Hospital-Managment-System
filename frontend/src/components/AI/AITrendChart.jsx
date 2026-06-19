import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const AITrendChart = ({ trends = [] }) => {
  if (!trends?.length) {
    return <p className="ai-recommendation-empty mb-0">No trend data available.</p>;
  }

  const max = Math.max(...trends.map((t) => Number(t.value) || 0), 1);

  return (
    <div className="ai-trend-chart" role="list" aria-label="Clinic performance trends">
      {trends.map((trend, idx) => {
        const value = Number(trend.value) || 0;
        const width = Math.max((value / max) * 100, 6);
        const TrendIcon =
          trend.direction === "up" ? TrendingUp : trend.direction === "down" ? TrendingDown : Minus;
        const colorClass =
          trend.direction === "up"
            ? "ai-trend-up"
            : trend.direction === "down"
              ? "ai-trend-down"
              : "ai-trend-neutral";

        return (
          <div key={idx} className="ai-trend-row" role="listitem">
            <div className="ai-trend-row-header">
              <span className="ai-trend-label">{trend.label}</span>
              <span className={`ai-trend-value ${colorClass}`}>
                <TrendIcon size={13} aria-hidden="true" />
                <span>{trend.display ?? value}</span>
              </span>
            </div>
            <div
              className="ai-trend-bar-bg"
              role="progressbar"
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={max}
              aria-label={trend.label}
            >
              <div className={`ai-trend-bar-fill ${colorClass}`} style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AITrendChart;
