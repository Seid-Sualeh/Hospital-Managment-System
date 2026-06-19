import React, { useEffect, useCallback } from "react";
import { Banknote, Users, Lightbulb } from "lucide-react";
import AISectionHeader from "./AISectionHeader";
import AIInsightCard from "./AIInsightCard";
import AIRecommendationList from "./AIRecommendationList";
import AITrendChart from "./AITrendChart";
import AILoadingState from "./AILoadingState";
import AISafetyDisclaimer from "./AISafetyDisclaimer";
import AIActionButton from "./AIActionButton";
import AIErrorState from "./AIErrorState";
import AIFormattedContent from "./AIFormattedContent";
import useAiPanel from "../../hooks/useAiPanel";
import aiService from "../../services/aiService";

const DashboardAIInsights = ({ metrics = {} }) => {
  const { content, sections, loading, error, extra, run } = useAiPanel();

  const loadInsights = useCallback(
    () => run(() => aiService.dashboardInsights({ metrics })),
    [metrics, run],
  );

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const revenueSection = extra?.revenueTrends || sections.find((s) => s.title?.toLowerCase().includes("revenue"));
  const patientSection = extra?.patientTrends || sections.find((s) => s.title?.toLowerCase().includes("patient"));
  const recSection =
    extra?.recommendations ||
    sections.find((s) => /operational|recommend/i.test(s.title || ""));

  const trendData = [
    {
      label: "Total Patients",
      value: metrics.totalPatients || metrics.totalCount || 0,
      display: (metrics.totalPatients || metrics.totalCount || 0).toLocaleString(),
      direction: "up",
    },
    {
      label: "Appointments",
      value: metrics.totalAppointments || 0,
      display: (metrics.totalAppointments || 0).toLocaleString(),
      direction: "up",
    },
    {
      label: "Today's Revenue",
      value: metrics.todayRevenue || 0,
      display: `${(metrics.todayRevenue || 0).toLocaleString()} ETB`,
      direction: metrics.todayRevenue > 0 ? "up" : "neutral",
    },
    {
      label: "Lab Requests",
      value: metrics.labResults || metrics.labRequests || 0,
      display: (metrics.labResults || metrics.labRequests || 0).toLocaleString(),
      direction: "neutral",
    },
  ];

  return (
    <section className="dashboard-ai-insights ai-module-shell mb-4" aria-labelledby="dashboard-ai-heading">
      <div className="dashboard-ai-header">
        <AISectionHeader
          title="Operations Intelligence"
          subtitle="AI-driven analysis of clinic performance, patient flow, and operational efficiency."
        />
        <AIActionButton onClick={loadInsights} loading={loading} aria-label="Refresh AI insights">
          Refresh Insights
        </AIActionButton>
      </div>

      {loading && !content ? (
        <AILoadingState message="Analyzing clinic performance" />
      ) : error ? (
        <AIErrorState
          title="Insights unavailable"
          message={error}
          onRetry={loadInsights}
        />
      ) : (
        <div className="row g-3">
          <div className="col-lg-4">
            <AIInsightCard title="Revenue Trends" subtitle="Collections and billing patterns" icon={Banknote} variant="danger">
              <AITrendChart trends={trendData} />
              <AIRecommendationList items={revenueSection?.items} title="Analysis" variant="compact" />
            </AIInsightCard>
          </div>
          <div className="col-lg-4">
            <AIInsightCard title="Patient Trends" subtitle="Volume and department utilization" icon={Users} variant="primary">
              <AIRecommendationList items={patientSection?.items} title="Volume Insights" />
              {!patientSection?.items?.length && content && (
                <AIFormattedContent content={content} sections={patientSection ? [patientSection] : []} />
              )}
            </AIInsightCard>
          </div>
          <div className="col-lg-4">
            <AIInsightCard title="Recommendations" subtitle="Staffing, inventory, and workflow" icon={Lightbulb} variant="success">
              <AIRecommendationList items={recSection?.items} title="Suggested Actions" />
            </AIInsightCard>
          </div>
        </div>
      )}

      <AISafetyDisclaimer className="mt-3" />
    </section>
  );
};

export default DashboardAIInsights;
