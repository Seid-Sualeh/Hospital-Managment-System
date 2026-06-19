import React, { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import AISectionHeader from "./AISectionHeader";
import AICollapsiblePanel from "./AICollapsiblePanel";
import AIWarningBadge from "./AIWarningBadge";
import AILoadingState from "./AILoadingState";
import AIEmptyState from "./AIEmptyState";
import useAiPanel from "../../hooks/useAiPanel";
import aiService from "../../services/aiService";

const LaboratoryAIPanel = ({ request, resultForm }) => {
  const explanation = useAiPanel();
  const summary = useAiPanel();
  const abnormal = useAiPanel();

  const hasResult = Boolean(resultForm?.result?.trim());
  const payload = {
    lab_request_id: request?.id,
    test_name: request?.test_name,
    patient_id: request?.patient_id,
    result: resultForm?.result,
    interpretation: resultForm?.interpretation,
  };

  useEffect(() => {
    if (!hasResult) {
      abnormal.reset();
      return;
    }
    abnormal.run(() =>
      aiService.labAbnormalDetection({
        result: resultForm.result,
        interpretation: resultForm.interpretation,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultForm?.result, resultForm?.interpretation]);

  if (!request) return null;

  return (
    <div className="laboratory-ai-panel ai-module-shell">
      <AISectionHeader
        title="Laboratory Intelligence"
        subtitle="AI-assisted result interpretation and abnormality detection."
      />

      {!hasResult ? (
        <AIEmptyState
          title="Awaiting laboratory results"
          description="Enter test results above to enable AI explanation, summary, and abnormality screening."
        />
      ) : (
        <>
          <div className="ai-abnormal-card mb-3" role="region" aria-label="Abnormality screening">
            <div className="ai-abnormal-card-header">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>Abnormality Screening</span>
            </div>
            {abnormal.loading ? (
              <AILoadingState message="Screening result values" />
            ) : abnormal.extra?.abnormalities?.length > 0 ? (
              <div className="ai-abnormal-badges">
                {abnormal.extra.abnormalities.map((item, idx) => (
                  <AIWarningBadge key={idx} severity={item.severity} label={item.finding} />
                ))}
              </div>
            ) : (
              <p className="ai-abnormal-empty mb-0">No critical abnormalities detected in entered values.</p>
            )}
          </div>

          <div className="ai-panel-stack">
            <AICollapsiblePanel
              variant="lab"
              title="Result Explanation"
              subtitle="Plain-language clinical interpretation"
              actionLabel="Explain Result"
              loading={explanation.loading}
              content={explanation.content}
              sections={explanation.sections}
              error={explanation.error}
              defaultOpen
              onAction={() => explanation.run(() => aiService.labSummary(payload))}
              onRefresh={() => explanation.run(() => aiService.labSummary(payload))}
              emptyDescription="Generate a clinician-friendly explanation of these laboratory findings."
            />

            <AICollapsiblePanel
              variant="lab"
              title="Lab Summary"
              subtitle="Key abnormalities and physician review points"
              actionLabel="Generate Lab Summary"
              loading={summary.loading}
              content={summary.content}
              sections={summary.sections}
              error={summary.error}
              onAction={() => summary.run(() => aiService.labSummary(payload))}
              onRefresh={() => summary.run(() => aiService.labSummary(payload))}
              emptyDescription="Generate a structured summary for physician review."
            />
          </div>
        </>
      )}
    </div>
  );
};

export default LaboratoryAIPanel;
