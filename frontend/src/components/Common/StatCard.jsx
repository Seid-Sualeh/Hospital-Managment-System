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
      <div className="d-flex justify-content-between align-items-start mb-3">
        <span className="stat-card-label text-truncate" title={label}>{label}</span>
        {Icon && (
          <div className={`stat-card-icon ${variant} d-flex align-items-center justify-content-center`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="stat-card-value my-2">{value}</div>
      
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-2">
        {trend && (
          <span 
            className={`badge d-inline-flex align-items-center gap-1 py-1.5 px-2.5 rounded-pill ${
              isUp 
                ? "bg-success bg-opacity-10 text-success border border-success border-opacity-10" 
                : "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-10"
            }`}
            style={{ fontSize: "0.75rem", fontWeight: "600" }}
          >
            {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            <span>{trend}</span>
          </span>
        )}
        {footer && <span className="text-muted small text-truncate" style={{ fontSize: "0.75rem" }}>{footer}</span>}
      </div>
    </div>
  );
};

export default StatCard;

