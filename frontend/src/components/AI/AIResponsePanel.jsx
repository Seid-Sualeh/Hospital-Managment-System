import React from "react";
import AILoadingState from "./AILoadingState";
import AISafetyDisclaimer from "./AISafetyDisclaimer";
import AIFormattedContent from "./AIFormattedContent";
import AIErrorState from "./AIErrorState";
import AIEmptyState from "./AIEmptyState";
import AIToolbar from "./AIToolbar";

const AIResponsePanel = ({
  content,
  sections = [],
  loading = false,
  error = null,
  onRefresh,
  showDisclaimer = true,
  exportTitle = "Clinical AI Insight",
  emptyTitle,
  emptyDescription,
}) => {
  const hasContent = Boolean(content?.trim()) || sections?.length > 0;

  return (
    <article className="ai-response-panel" aria-label={exportTitle}>
      {(hasContent || onRefresh) && !loading && !error && (
        <AIToolbar content={content} onRefresh={onRefresh} exportTitle={exportTitle} />
      )}

      {loading ? (
        <AILoadingState message={`Generating ${exportTitle.toLowerCase()}`} />
      ) : error ? (
        <AIErrorState message={error} onRetry={onRefresh} />
      ) : hasContent ? (
        <div className="ai-response-body">
          <AIFormattedContent content={content} sections={sections} />
          {showDisclaimer && <AISafetyDisclaimer className="mt-3" />}
        </div>
      ) : (
        <AIEmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </article>
  );
};

export default AIResponsePanel;
