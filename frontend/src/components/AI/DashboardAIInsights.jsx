import React, { useEffect, useCallback } from "react";
import { Banknote, Users, Lightbulb, TrendingUp, AlertTriangle, Stethoscope, Pill, CheckSquare } from "lucide-react";
import AISectionHeader from "./AISectionHeader";
import AIInsightCard from "./AIInsightCard";
import AIRecommendationList from "./AIRecommendationList";
import AITrendChart from "./AITrendChart";
import AILoadingState from "./AILoadingState";
import AISafetyDisclaimer from "./AISafetyDisclaimer";
import AIActionButton from "./AIActionButton";
import AIErrorState from "./AIErrorState";
import useAiPanel from "../../hooks/useAiPanel";
import aiService from "../../services/aiService";

// Helper to parse sections from markdown text
const parseDashboardSections = (content) => {
  if (!content) return {};
  const sections = {};
  const lines = content.split("\n");
  let currentHeader = "";

  lines.forEach((line) => {
    const boldHeading = line.match(/^\*\*(.+?)\*\*:?$/);
    const plainHeading = !boldHeading && line.match(/^([A-Z][A-Za-z\s/&-]{2,}):$/);

    if (boldHeading || plainHeading) {
      currentHeader = (boldHeading?.[1] || plainHeading?.[1]).trim();
      sections[currentHeader] = [];
      return;
    }

    if (currentHeader) {
      const cleanLine = line.replace(/^[-•*]\s*/, "").replace(/\*\*/g, "").trim();
      if (cleanLine) {
        sections[currentHeader].push(cleanLine);
      }
    }
  });

  return sections;
};

const DashboardAIInsights = ({ metrics = {} }) => {
  const { content, loading, error, run } = useAiPanel();

  const loadInsights = useCallback(
    () => run(() => aiService.dashboardInsights({ metrics })),
    [metrics, run],
  );

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // Parse the structured sections from AI content
  const parsed = parseDashboardSections(content || "");

  const getSection = (name) => {
    const key = Object.keys(parsed).find((k) => k.toLowerCase().includes(name.toLowerCase()));
    return parsed[key] || [];
  };

  const revenueTrends = getSection("Revenue Trends");
  const patientTrends = getSection("Patient Trends");
  const diseaseTrends = getSection("Disease Trends");
  const medicationTrends = getSection("Medication Usage Trends");
  const recommendations = getSection("Operational Recommendations");
  
  const topDiagnoses = getSection("Top Diagnoses");
  const topPrescriptions = getSection("Top Prescriptions");
  const revenueGrowth = getSection("Revenue Growth");
  const patientVolume = getSection("Patient Volume");
  const inventoryWarnings = getSection("Inventory Warnings");

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
      <div className="dashboard-ai-header d-flex justify-content-between align-items-center mb-3">
        <AISectionHeader
          title="Operations Intelligence & Analytics"
          subtitle="Real-time clinical patterns, utilization warnings, revenue forecasting, and CDSS operational recommendations."
        />
        <AIActionButton onClick={loadInsights} loading={loading} aria-label="Refresh AI insights">
          Refresh Insights
        </AIActionButton>
      </div>

      {loading && !content ? (
        <AILoadingState message="Aggregating clinical intelligence..." />
      ) : error ? (
        <AIErrorState
          title="Insights unavailable"
          message={error}
          onRetry={loadInsights}
        />
      ) : content ? (
        <div className="d-flex flex-column gap-4">
          
          {/* Executive KPI Row */}
          <div className="row g-3">
            <div className="col-md-4">
              <div className="p-3 border rounded bg-white shadow-xs d-flex align-items-center gap-3">
                <div className="p-2 bg-success bg-opacity-10 text-success rounded-circle">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <span className="text-caption text-muted d-block small">Revenue Growth</span>
                  <div className="fw-bold text-dark" style={{ fontSize: "1.1rem" }}>
                    {revenueGrowth.length > 0 ? revenueGrowth[0] : "Stable collections trend"}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="p-3 border rounded bg-white shadow-xs d-flex align-items-center gap-3">
                <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-circle">
                  <Users size={24} />
                </div>
                <div>
                  <span className="text-caption text-muted d-block small">Patient Volume</span>
                  <div className="fw-bold text-dark" style={{ fontSize: "1.1rem" }}>
                    {patientVolume.length > 0 ? patientVolume[0] : `${trendData[0].display} active cases`}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-3 border rounded bg-white shadow-xs d-flex align-items-center gap-3" style={{ borderLeft: "4px solid #ef4444" }}>
                <div className="p-2 bg-danger bg-opacity-10 text-danger rounded-circle animate-pulse">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <span className="text-caption text-muted d-block small">Critical Stock Warnings</span>
                  <div className="fw-bold text-danger animate-pulse" style={{ fontSize: "1.05rem" }}>
                    {inventoryWarnings.length > 0 ? inventoryWarnings[0] : "All items in-stock"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grids with parsed SaaS details */}
          <div className="row g-3">
            
            {/* Column 1: Financial & Patient Trends */}
            <div className="col-lg-4">
              <AIInsightCard title="Collections & Billing Trends" subtitle="Collections patterns and trends" icon={Banknote} variant="danger">
                <AITrendChart trends={trendData} />
                <AIRecommendationList items={revenueTrends} title="Revenue Analysis" variant="compact" />
              </AIInsightCard>
            </div>

            {/* Column 2: Disease Patterns & Rankings */}
            <div className="col-lg-4">
              <AIInsightCard title="Epidemiology & Patient Trends" subtitle="Disease outbreaks and patient flow" icon={Stethoscope} variant="primary">
                <div className="mb-3">
                  <span className="fw-bold text-dark small mb-1.5 d-block">Top Diagnoses</span>
                  <ul className="ps-3 mb-0 small text-dark">
                    {topDiagnoses.length > 0 ? (
                      topDiagnoses.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)
                    ) : (
                      <li className="text-muted">Awaiting epidemiologic data.</li>
                    )}
                  </ul>
                </div>
                <div className="border-top pt-2">
                  <span className="fw-bold text-dark small mb-1.5 d-block">Outbreak Projections</span>
                  <ul className="ps-3 mb-0 small text-muted">
                    {diseaseTrends.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}
                  </ul>
                </div>
              </AIInsightCard>
            </div>

            {/* Column 3: Medication Utilization */}
            <div className="col-lg-4">
              <AIInsightCard title="Medication & Pharmacy Trends" subtitle="High volume prescriptions & forecasting" icon={Pill} variant="success">
                <div className="mb-3">
                  <span className="fw-bold text-dark small mb-1.5 d-block">Top Prescriptions</span>
                  <ul className="ps-3 mb-0 small text-dark">
                    {topPrescriptions.length > 0 ? (
                      topPrescriptions.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)
                    ) : (
                      <li className="text-muted">Awaiting pharmacy dispatch data.</li>
                    )}
                  </ul>
                </div>
                <div className="border-top pt-2">
                  <span className="fw-bold text-dark small mb-1.5 d-block">Inventory & Utilization Patterns</span>
                  <ul className="ps-3 mb-0 small text-muted">
                    {medicationTrends.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}
                  </ul>
                </div>
              </AIInsightCard>
            </div>

          </div>

          {/* Operational Recommendations Card */}
          <div className="row g-3">
            <div className="col-12">
              <div className="mc-card border border-success border-opacity-20 shadow-xs bg-white">
                <div className="mc-card-body p-3">
                  <h6 className="fw-bold text-success mb-3 d-flex align-items-center gap-1.5">
                    <Lightbulb size={18} className="text-success" /> Operational & Resource Management Recommendations
                  </h6>
                  <div className="row g-3">
                    {recommendations.map((rec, idx) => (
                      <div key={idx} className="col-md-6">
                        <div className="d-flex align-items-start gap-2.5 p-2.5 border rounded bg-light">
                          <CheckSquare size={16} className="text-success mt-0.5 flex-shrink-0" />
                          <span className="small text-dark fw-medium">{rec}</span>
                        </div>
                      </div>
                    ))}
                    {recommendations.length === 0 && (
                      <div className="col-12 text-center py-3 text-muted small">
                        No operational recommendations compiled at this time.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="mc-card">
          <div className="mc-card-body text-center py-5 text-muted">
            <Lightbulb size={40} className="mb-3 opacity-50" />
            <p>Select Refresh Insights to trigger AI executive audit report.</p>
          </div>
        </div>
      )}

      <AISafetyDisclaimer className="mt-3" />
    </section>
  );
};

export default DashboardAIInsights;
