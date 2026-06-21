import React from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

const AIErrorState = ({
  title = "Unable to generate insight",
  message = "The clinical AI service is temporarily unavailable. Please try again.",
  onRetry,
}) => {
  const isOffline = 
    message?.includes("Gemini API key is not configured") || 
    message?.includes("OFFLINE") || 
    message?.includes("offline") ||
    message?.includes("Offline");

  const displayTitle = isOffline ? "AI Service Offline" : title;
  const displayMessage = isOffline 
    ? "Gemini API key is not configured. Clinical AI features are temporarily unavailable." 
    : message;

  return (
    <div className="ai-error-state p-3 border rounded bg-danger bg-opacity-10 border-danger border-opacity-20 d-flex align-items-start gap-3" role="alert" aria-live="assertive">
      <div className="ai-error-state-icon text-danger p-1 bg-white rounded shadow-xs" aria-hidden="true" style={{ flexShrink: 0 }}>
        <AlertCircle size={22} />
      </div>
      <div className="ai-error-state-body flex-grow-1">
        <h6 className="ai-error-state-title fw-bold text-danger mb-1" style={{ fontSize: "0.95rem" }}>{displayTitle}</h6>
        <p className="ai-error-state-message text-danger text-opacity-80 mb-0 small">{displayMessage}</p>
      </div>
      {onRetry && (
        <button 
          type="button" 
          className="btn btn-outline-danger btn-sm ai-error-retry d-flex align-items-center gap-1 border-0 fw-semibold align-self-center" 
          onClick={onRetry}
          style={{ whiteSpace: "nowrap" }}
        >
          <RefreshCcw size={14} aria-hidden="true" />
          <span>Try again</span>
        </button>
      )}
    </div>
  );
};

export default AIErrorState;
