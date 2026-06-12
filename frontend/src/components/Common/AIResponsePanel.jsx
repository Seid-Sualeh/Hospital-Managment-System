import React from "react";
import { Copy, RefreshCcw } from "lucide-react";

const AIResponsePanel = ({
  title,
  content,
  loading,
  error,
  note,
  onCopy,
  onRefresh,
}) => {
  const copyText = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // ignore clipboard failures
    }
    if (onCopy) onCopy();
  };

  return (
    <div className="mc-card mt-4">
      <div className="mc-card-body">
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div>
            <h6 className="mb-1">{title}</h6>
            {note && <p className="small text-muted mb-0">{note}</p>}
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {onRefresh && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={onRefresh}
              >
                <RefreshCcw size={14} />
                <span className="ms-1">Regenerate</span>
              </button>
            )}
            {content && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={copyText}
              >
                <Copy size={14} />
                <span className="ms-1">Copy</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="mt-2 text-muted">Generating AI insight...</div>
          </div>
        ) : error ? (
          <div className="alert alert-danger mb-0">{error}</div>
        ) : content ? (
          <div style={{ whiteSpace: "pre-wrap" }} className="text-sm text-dark">
            {content}
          </div>
        ) : (
          <div className="text-muted">No AI output has been generated yet.</div>
        )}
      </div>
    </div>
  );
};

export default AIResponsePanel;
