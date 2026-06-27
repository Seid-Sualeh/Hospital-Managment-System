import React, { useEffect } from "react";
import { Package, ShieldCheck, ShieldAlert, AlertTriangle, Pill, BookOpen, Layers, Info } from "lucide-react";
import AISectionHeader from "./AISectionHeader";
import AICollapsiblePanel from "./AICollapsiblePanel";
import AILoadingState from "./AILoadingState";
import AIErrorState from "./AIErrorState";
import useAiPanel from "../../hooks/useAiPanel";
import aiService from "../../services/aiService";

// Helper to parse sections from markdown text
const parsePharmacySections = (content) => {
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

const PharmacyAIPanel = ({ medicines = [], dispenseForm = {} }) => {
  const inventory = useAiPanel();
  const safety = useAiPanel();

  const lowStock = medicines.filter((m) => m.status === "low_stock" || m.status === "out_of_stock");
  const canRunSafety = Boolean(dispenseForm.medicine_id && dispenseForm.patient_uid);

  const runInventory = () => inventory.run(() => aiService.pharmacyInsights({ medicines }));

  const runSafety = () => {
    if (!canRunSafety) return;
    const med = medicines.find((m) => String(m.id) === String(dispenseForm.medicine_id));
    safety.run(() =>
      aiService.prescriptionAssistance({
        medication_name: med?.name || "Selected medicine",
        patient_id: dispenseForm.patient_uid,
        diagnoses: dispenseForm.notes || "None documented",
      }),
    );
  };

  // Run automatically when medicine selection or patient selection changes in the form
  useEffect(() => {
    if (canRunSafety) {
      runSafety();
    } else {
      safety.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispenseForm.medicine_id, dispenseForm.patient_uid]);

  // Parse safety contents
  const parsedSections = parsePharmacySections(safety.content);
  
  // Detect safety level
  let safetyLevel = "idle"; // green, yellow, red, idle
  let safetyLevelText = "Awaiting Screen";
  
  const safetyLevelKey = Object.keys(parsedSections).find((k) => /safety level/i.test(k));
  if (safetyLevelKey && parsedSections[safetyLevelKey].length > 0) {
    const levelStr = parsedSections[safetyLevelKey][0].toLowerCase();
    if (levelStr.includes("green") || levelStr.includes("no interaction")) {
      safetyLevel = "green";
      safetyLevelText = "No Clinical Interactions Detected";
    } else if (levelStr.includes("red") || levelStr.includes("severe") || levelStr.includes("danger")) {
      safetyLevel = "red";
      safetyLevelText = "Severe Interaction / Contraindication Flagged";
    } else if (levelStr.includes("yellow") || levelStr.includes("caution") || levelStr.includes("moderate")) {
      safetyLevel = "yellow";
      safetyLevelText = "Moderate Interaction Risk - Use Caution";
    } else {
      safetyLevelText = parsedSections[safetyLevelKey][0];
      safetyLevel = "yellow";
    }
  }

  // Map other sections
  const interactionKey = Object.keys(parsedSections).find((k) => /interaction/i.test(k));
  const counselingKey = Object.keys(parsedSections).find((k) => /counseling/i.test(k));
  const alternativesKey = Object.keys(parsedSections).find((k) => /alternative/i.test(k));
  const doseKey = Object.keys(parsedSections).find((k) => /dose/i.test(k));
  const educationKey = Object.keys(parsedSections).find((k) => /education/i.test(k));
  const contraKey = Object.keys(parsedSections).find((k) => /contraindication/i.test(k));

  const interactionAlerts = parsedSections[interactionKey] || parsedSections[contraKey] || [];
  const counselingItems = parsedSections[counselingKey] || [];
  const alternatives = parsedSections[alternativesKey] || [];
  const doseGuidance = parsedSections[doseKey] || [];
  const patientEducation = parsedSections[educationKey] || [];

  return (
    <div className="pharmacy-ai-panel ai-module-shell">
      <AISectionHeader
        title="Pharmacy Intelligence Workstation"
        subtitle="CDSS clinical screening, safety screening, and stock runout forecasting."
      />

      {/* Real-time stock alerts card */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="mc-card h-100 border border-warning border-opacity-20 bg-warning bg-opacity-5">
            <div className="mc-card-body p-3">
              <h6 className="fw-bold text-warning mb-2 d-flex align-items-center gap-1 small">
                <Package size={16} /> Inventory Stock Warnings
              </h6>
              {lowStock.length ? (
                <div className="d-flex flex-column gap-1.5 mt-2">
                  {lowStock.slice(0, 5).map((m) => (
                    <div key={m.id} className="d-flex align-items-center justify-content-between p-1.5 border rounded bg-white small">
                      <span className="fw-semibold text-dark text-truncate" style={{ maxWidth: "120px" }}>{m.name}</span>
                      <span className={`badge ${m.status === "out_of_stock" ? "bg-danger" : "bg-warning text-dark"} rounded-pill`}>
                        {m.stock ?? 0} left
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="small text-muted mb-0 py-3 text-center">No critical stock warnings.</p>
              )}
            </div>
          </div>
        </div>

        {/* CDSS Prescription Dispense Safety Screen */}
        <div className="col-md-8">
          <div className="mc-card h-100 border border-primary border-opacity-20 shadow-xs bg-white">
            <div className="mc-card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                <h6 className="fw-bold text-primary mb-0 d-flex align-items-center gap-1.5 small">
                  <ShieldAlert size={16} className="text-primary" /> Dispense Safety Screen (CDSS)
                </h6>
                {safetyLevel === "green" && <span className="badge bg-success px-3 py-1 rounded-pill">SAFE</span>}
                {safetyLevel === "yellow" && <span className="badge bg-warning text-dark px-3 py-1 rounded-pill animate-pulse">CAUTION</span>}
                {safetyLevel === "red" && <span className="badge bg-danger px-3 py-1 rounded-pill animate-pulse">CONTRAINDICATED</span>}
              </div>

              {!canRunSafety ? (
                <div className="text-center py-4 text-muted small">
                  <Pill size={32} className="mb-2 opacity-25 text-primary" />
                  <p className="mb-0">Select both a patient and a medicine in the form to activate CDSS safety screening.</p>
                </div>
              ) : safety.loading ? (
                <AILoadingState message="Conducting drug safety check..." />
              ) : safety.error ? (
                <AIErrorState message={safety.error} onRetry={runSafety} />
              ) : safety.content ? (
                <div>
                  {/* Safety Indicator Banner */}
                  <div className={`p-3 rounded mb-3 border d-flex align-items-center gap-3 ${
                    safetyLevel === "green" ? "bg-success bg-opacity-10 border-success border-opacity-20 text-success" :
                    safetyLevel === "red" ? "bg-danger bg-opacity-10 border-danger border-opacity-20 text-danger" :
                    "bg-warning bg-opacity-10 border-warning border-opacity-20 text-warning-emphasis"
                  }`}>
                    {safetyLevel === "green" ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
                    <div>
                      <div className="fw-bold" style={{ fontSize: "0.95rem" }}>{safetyLevelText}</div>
                      <div className="small opacity-80">Screened against active patient EMR clinical profile.</div>
                    </div>
                  </div>

                  <div className="row g-3">
                    {/* Columns containing information parsed from CDSS */}
                    <div className="col-md-6 border-end">
                      <div className="mb-3">
                        <span className="fw-bold text-dark d-flex align-items-center gap-1.5 small mb-1.5">
                          <AlertTriangle size={14} className="text-danger" /> Interaction & Contraindication Review
                        </span>
                        {interactionAlerts.length > 0 ? (
                          <ul className="ps-3 mb-0 small text-danger">
                            {interactionAlerts.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}
                          </ul>
                        ) : (
                          <p className="small text-muted mb-0">No interactions detected.</p>
                        )}
                      </div>

                      <div>
                        <span className="fw-bold text-dark d-flex align-items-center gap-1.5 small mb-1.5">
                          <Layers size={14} className="text-primary" /> Dose Guidance & Safety Parameters
                        </span>
                        {doseGuidance.length > 0 ? (
                          <ul className="ps-3 mb-0 small text-dark">
                            {doseGuidance.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}
                          </ul>
                        ) : (
                          <p className="small text-muted mb-0">No dose abnormalities detected.</p>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <span className="fw-bold text-dark d-flex align-items-center gap-1.5 small mb-1.5">
                          <BookOpen size={14} className="text-success" /> Pharmacist Counseling Points
                        </span>
                        {counselingItems.length > 0 ? (
                          <ul className="ps-3 mb-0 small text-dark">
                            {counselingItems.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}
                          </ul>
                        ) : (
                          <p className="small text-muted mb-0">No specific counseling guidelines provided.</p>
                        )}
                      </div>

                      <div>
                        <span className="fw-bold text-dark d-flex align-items-center gap-1.5 small mb-1.5">
                          <Info size={14} className="text-info" /> Alternative Medications (Out-of-Stock/Risk)
                        </span>
                        {alternatives.length > 0 ? (
                          <ul className="ps-3 mb-0 small text-dark">
                            {alternatives.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}
                          </ul>
                        ) : (
                          <p className="small text-muted mb-0">No alternatives suggested.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Patient Education summary */}
                  {patientEducation.length > 0 && (
                    <div className="mt-3 p-2 bg-light border rounded">
                      <span className="fw-bold text-dark small mb-1 d-block">Patient Education Summary</span>
                      <p className="small text-muted mb-0">{patientEducation.join(" ")}</p>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-4 text-muted small">
                  <Pill size={32} className="mb-2 opacity-25 text-primary" />
                  <p className="mb-0">Safety screening results will show here once activated.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Accordion drawers for detailed intelligence reports */}
      <div className="ai-panel-stack mt-4">
        <AICollapsiblePanel
          variant="pharmacy"
          title="Inventory Assistant"
          subtitle="Low-stock predictions, expiry warnings, and fast/slow drug movement analytics"
          actionLabel="Forecast Inventory"
          loading={inventory.loading}
          content={inventory.content}
          sections={inventory.sections}
          error={inventory.error}
          onAction={runInventory}
          onRefresh={runInventory}
          emptyDescription="Analyze current pharmacy inventory to forecast batch runouts and check expiry milestones."
        />

        <AICollapsiblePanel
          variant="medication"
          title="Prescription Safety Check (Raw CDSS Report)"
          subtitle="Structured raw analysis logs from Gemini CDSS decision node"
          actionLabel="Run Safety Check"
          loading={safety.loading}
          content={safety.content}
          sections={safety.sections}
          error={safety.error}
          disabled={!canRunSafety}
          disabledReason="Select both patient MRN and medication from the form first"
          onAction={runSafety}
          onRefresh={runSafety}
          emptyDescription="Screen prescription details against active health conditions and allergen archives."
        />
      </div>
    </div>
  );
};

export default PharmacyAIPanel;
