import React from "react";

const SEVERITY_MAP = {
  normal: { label: "Normal", className: "ai-badge-normal" },
  mild: { label: "Mild Concern", className: "ai-badge-mild" },
  moderate: { label: "Moderate Concern", className: "ai-badge-moderate" },
  critical: { label: "Critical", className: "ai-badge-critical" },
};

const AIWarningBadge = ({ severity = "normal", label }) => {
  const config = SEVERITY_MAP[severity] || SEVERITY_MAP.normal;
  return (
    <span className={`ai-warning-badge ${config.className}`} role="status">
      <span className="ai-warning-dot" aria-hidden="true" />
      <span>{label || config.label}</span>
    </span>
  );
};

export default AIWarningBadge;
