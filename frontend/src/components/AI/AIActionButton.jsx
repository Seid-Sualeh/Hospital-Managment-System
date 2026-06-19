import React from "react";
import { Sparkles, Loader2 } from "lucide-react";

const AIActionButton = ({
  children,
  onClick,
  loading = false,
  disabled = false,
  variant = "primary",
  className = "",
  icon: Icon = Sparkles,
  ...rest
}) => (
  <button
    type="button"
    className={`ai-action-btn btn btn-${variant} btn-sm ${className}`}
    onClick={onClick}
    disabled={disabled || loading}
    aria-busy={loading}
    {...rest}
  >
    {loading ? (
      <Loader2 size={14} className="ai-spin" aria-hidden="true" />
    ) : (
      <Icon size={14} aria-hidden="true" />
    )}
    <span>{children}</span>
  </button>
);

export default AIActionButton;
