import React from "react";
import { Package, ShieldAlert } from "lucide-react";
import AISectionHeader from "./AISectionHeader";
import AICollapsiblePanel from "./AICollapsiblePanel";
import AIInsightCard from "./AIInsightCard";
import AIRecommendationList from "./AIRecommendationList";
import AIWarningBadge from "./AIWarningBadge";
import AIFormattedContent from "./AIFormattedContent";
import useAiPanel from "../../hooks/useAiPanel";
import aiService from "../../services/aiService";

const PharmacyAIPanel = ({ medicines = [], dispenseForm = {} }) => {
  const inventory = useAiPanel();
  const safety = useAiPanel();

  const lowStock = medicines.filter((m) => m.status === "low_stock" || m.status === "out_of_stock");
  const canRunSafety = Boolean(dispenseForm.medicine_id);

  const runInventory = () => inventory.run(() => aiService.pharmacyInsights({ medicines }));

  const runSafety = () => {
    if (!canRunSafety) return;
    const med = medicines.find((m) => String(m.id) === String(dispenseForm.medicine_id));
    safety.run(() =>
      aiService.prescriptionAssistance({
        medication_name: med?.name || "Selected medicine",
        patient_id: dispenseForm.patient_uid,
        diagnoses: dispenseForm.notes,
      }),
    );
  };

  return (
    <div className="pharmacy-ai-panel ai-module-shell">
      <AISectionHeader
        title="Pharmacy Intelligence"
        subtitle="Inventory forecasting and prescription safety checks."
      />

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <AIInsightCard title="Inventory Alerts" subtitle="Real-time stock risk indicators" icon={Package} variant="warning">
            {lowStock.length ? (
              <div className="ai-abnormal-badges">
                {lowStock.slice(0, 8).map((m) => (
                  <AIWarningBadge
                    key={m.id}
                    severity={m.status === "out_of_stock" ? "critical" : "moderate"}
                    label={`${m.name}: ${m.stock ?? 0} remaining`}
                  />
                ))}
              </div>
            ) : (
              <p className="ai-recommendation-empty mb-0">All monitored items are within acceptable stock levels.</p>
            )}
          </AIInsightCard>
        </div>
        <div className="col-md-6">
          <AIInsightCard
            title="Dispense Safety"
            subtitle="Interaction and contraindication screening"
            icon={ShieldAlert}
            variant="danger"
            loading={safety.loading}
          >
            {safety.content || safety.sections?.length ? (
              <AIFormattedContent content={safety.content} sections={safety.sections} />
            ) : (
              <AIRecommendationList
                emptyText={canRunSafety ? "Run safety check before dispensing." : "Select a medicine to enable safety screening."}
              />
            )}
          </AIInsightCard>
        </div>
      </div>

      <div className="ai-panel-stack">
        <AICollapsiblePanel
          variant="pharmacy"
          title="Inventory Assistant"
          subtitle="Stock predictions, expiry warnings, and movement analysis"
          actionLabel="Analyze Inventory"
          loading={inventory.loading}
          content={inventory.content}
          sections={inventory.sections}
          error={inventory.error}
          onAction={runInventory}
          onRefresh={runInventory}
          emptyDescription="Analyze current inventory for reorder and expiry risks."
        />

        <AICollapsiblePanel
          variant="medication"
          title="Prescription Safety Check"
          subtitle="Drug interactions, duplicates, and contraindications"
          actionLabel="Run Safety Check"
          loading={safety.loading}
          content={safety.content}
          sections={safety.sections}
          error={safety.error}
          disabled={!canRunSafety}
          disabledReason="Select a medicine in the dispense form first"
          onAction={runSafety}
          onRefresh={runSafety}
          emptyDescription="Verify medication safety before dispensing to the patient."
        />
      </div>
    </div>
  );
};

export default PharmacyAIPanel;
