import React from "react";
import AISectionHeader from "./AISectionHeader";
import AICollapsiblePanel from "./AICollapsiblePanel";
import useAiPanel from "../../hooks/useAiPanel";
import aiService from "../../services/aiService";

const buildConsultationPayload = (patient, form) => ({
  patient_id: patient?.patient_id || patient?.id,
  complaint: form.complaint,
  diagnosis: form.diagnosis,
  prescription: form.prescription,
  notes: form.notes,
  vitals: { temp: form.temp, bp: form.bp, pulse: form.pulse, weight: form.weight },
  consultation: {
    complaint: form.complaint,
    diagnosis: form.diagnosis,
    notes: form.notes,
    vitals: { temp: form.temp, bp: form.bp, pulse: form.pulse, weight: form.weight },
  },
});

const ConsultationAIPanels = ({ patient, form }) => {
  const summary = useAiPanel();
  const diagnosis = useAiPanel();
  const medication = useAiPanel();

  if (!patient) return null;

  const payload = buildConsultationPayload(patient, form);

  return (
    <div className="consultation-ai-panels ai-module-shell">
      <AISectionHeader
        title="Clinical Decision Support"
        subtitle="AI-generated summaries and suggestions to assist your clinical workflow."
      />

      <div className="ai-panel-stack">
        <AICollapsiblePanel
          variant="summary"
          title="Clinical Summary"
          subtitle="Chief complaint, relevant history, and visit context"
          actionLabel="Generate Clinical Summary"
          loading={summary.loading}
          content={summary.content}
          sections={summary.sections}
          error={summary.error}
          onAction={() => summary.run(() => aiService.clinicalSummary({ patient_id: payload.patient_id }))}
          onRefresh={() => summary.run(() => aiService.clinicalSummary({ patient_id: payload.patient_id }))}
          emptyTitle="No summary generated"
          emptyDescription="Generate a concise clinical summary from the patient's record and current visit data."
        />

        <AICollapsiblePanel
          variant="diagnosis"
          title="Diagnosis Support"
          subtitle="Differential diagnoses, investigations, and red flag warnings"
          actionLabel="Generate Diagnosis Support"
          loading={diagnosis.loading}
          content={diagnosis.content}
          sections={diagnosis.sections}
          error={diagnosis.error}
          onAction={() => diagnosis.run(() => aiService.diagnosisSupport(payload))}
          onRefresh={() => diagnosis.run(() => aiService.diagnosisSupport(payload))}
          emptyTitle="No diagnosis support generated"
          emptyDescription="AI will suggest differential diagnoses based on complaint, vitals, and clinical notes."
        />

        <AICollapsiblePanel
          variant="medication"
          title="Medication Assistance"
          subtitle="Treatment options, interactions, and contraindications"
          actionLabel="Medication Assistance"
          loading={medication.loading}
          content={medication.content}
          sections={medication.sections}
          error={medication.error}
          onAction={() => medication.run(() => aiService.medicationAssistance(payload))}
          onRefresh={() => medication.run(() => aiService.medicationAssistance(payload))}
          emptyTitle="No medication guidance generated"
          emptyDescription="Review treatment options and safety considerations before prescribing."
        />
      </div>
    </div>
  );
};

export default ConsultationAIPanels;
