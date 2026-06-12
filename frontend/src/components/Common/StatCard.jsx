import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

/**
 * StatCard — accepts either:
 *   trendDirection="up"|"down"   (explicit)
 *   up={true}                    (boolean shorthand)
 */
const StatCard = ({
  label,
  value,
  trend,
  trendDirection,
  up,
  icon: Icon,
  variant = "primary",
  highlight,
  footer,
}) => {
  const isUp =
    trendDirection === "up" ||
    up === true ||
    (trendDirection === undefined && up !== false);
  const highlightClass = highlight ? `stat-card--${highlight}` : "";

  return (
    <div className={`stat-card ${highlightClass}`.trim()}>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <div className={`stat-card-icon ${variant}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      {trend && (
        <div
          className={`d-flex align-items-center gap-2 mt-2 ${!isUp ? "stat-trend-down" : "stat-trend-up"}`}
        >
          {!isUp ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
          <span>{trend}</span>
        </div>
      )}
      {footer && <p className="text-caption mb-0 mt-3">{footer}</p>}
    </div>
  );
};

export default StatCard;
