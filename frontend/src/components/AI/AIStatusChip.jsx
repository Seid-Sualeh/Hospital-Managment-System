import React from "react";
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";

const STATUS = {
  idle: { label: "Ready", className: "ai-status-idle", Icon: Circle },
  loading: { label: "Analyzing", className: "ai-status-loading", Icon: Loader2 },
  success: { label: "Generated", className: "ai-status-success", Icon: CheckCircle2 },
  error: { label: "Failed", className: "ai-status-error", Icon: AlertCircle },
};

const AIStatusChip = ({ status = "idle" }) => {
  const config = STATUS[status] || STATUS.idle;
  const { Icon } = config;

  return (
    <span className={`ai-status-chip ${config.className}`} aria-label={`Status: ${config.label}`}>
      <Icon size={12} className={status === "loading" ? "ai-spin" : ""} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

export default AIStatusChip;
