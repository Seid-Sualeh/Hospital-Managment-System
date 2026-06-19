import React from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

const AIErrorState = ({
  title = "Unable to generate insight",
  message = "The clinical AI service is temporarily unavailable. Please try again.",
  onRetry,
}) => (
  <div className="ai-error-state" role="alert" aria-live="assertive">
    <div className="ai-error-state-icon" aria-hidden="true">
      <AlertCircle size={22} />
    </div>
    <div className="ai-error-state-body">
      <h6 className="ai-error-state-title">{title}</h6>
      <p className="ai-error-state-message mb-0">{message}</p>
    </div>
    {onRetry && (
      <button type="button" className="btn btn-outline-danger btn-sm ai-error-retry" onClick={onRetry}>
        <RefreshCcw size={14} aria-hidden="true" />
        <span>Try again</span>
      </button>
    )}
  </div>
);

export default AIErrorState;
