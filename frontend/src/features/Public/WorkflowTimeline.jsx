import React, { useState } from "react";
import { UserPlus, Banknote, Stethoscope, FlaskConical, Sparkles, ClipboardCheck, Pill, DoorClosed, ArrowRight, Check } from "lucide-react";

const WorkflowTimeline = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: <UserPlus size={20} />,
      label: "Patient Registration",
      role: "Receptionist",
      desc: "Reception captures patient demographics, creates a Medical Record Number (MRN), and routes them to the triage desk for vital signs measurement.",
      details: "Saves patient profiles in the unified registry and automatically opens a new visit queue item."
    },
    {
      icon: <Banknote size={20} />,
      label: "Payment Gate",
      role: "Cashier",
      desc: "Cashier issues a consultation invoice. Once payment is recorded, the patient is unlocked in the doctor's waiting queue.",
      details: "Ensures financial integrity by linking consultation access directly to cleared payment receipts."
    },
    {
      icon: <Stethoscope size={20} />,
      label: "Doctor Consultation",
      role: "Doctor / GP",
      desc: "Doctor captures patient history, checks vital trends, adds clinical notes, maps ICD-10 diagnoses, and drafts lab orders or medications.",
      details: "Clinical workspaces combine consultation notes with automated queue progression."
    },
    {
      icon: <FlaskConical size={20} />,
      label: "Laboratory Testing",
      role: "Lab Technician",
      desc: "If labs are ordered, patient pays cashier first, then sample is drawn, tests are processed, and verified results are signed off in LIS.",
      details: "LIS workspace allows multi-parameter result entry and pushes results back to the doctor's profile instantly."
    },
    {
      icon: <Sparkles size={20} />,
      label: "AI Clinical Support",
      role: "Gemini AI Engine",
      desc: "The system triggers Gemini AI to synthesize consultation notes, allergy histories, and lab results into an structured clinical summary.",
      details: "Provides clinical insights, potential diagnosis support, and drug-to-drug interaction alerts for the physician."
    },
    {
      icon: <ClipboardCheck size={20} />,
      label: "e-Prescribing",
      role: "Doctor / GP",
      desc: "With lab results and AI feedback available, the doctor updates the diagnosis and drafts a digital prescription containing precise dosages.",
      details: "Generates a pending drug invoice and sends the electronic prescription directly to the pharmacy desk."
    },
    {
      icon: <Pill size={20} />,
      label: "Pharmacy Dispense",
      role: "Pharmacist",
      desc: "Following drug invoice payment, the pharmacist reviews the prescription, verifies inventory levels, and dispenses the medication.",
      details: "Automated inventory depletion deducts stock counts and issues warning alerts for low batches."
    },
    {
      icon: <DoorClosed size={20} />,
      label: "Visit Closure",
      role: "System Auto-Trigger",
      desc: "After all consultation notes are completed, labs cleared, and prescriptions dispensed, the patient's visit status is updated to Closed.",
      details: "Records total patient turnaround times and compiles metrics for billing ledger reports."
    }
  ];

  return (
    <div className="timeline-container">
      {/* Connector Line */}
      <div className="timeline-line"></div>

      {/* Timeline Steps (Nodes) */}
      <div className="timeline-steps mb-5">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`timeline-step ${index === activeStep ? "active" : ""}`}
            onClick={() => setActiveStep(index)}
          >
            <div className="timeline-node">
              {index < activeStep ? <Check size={18} /> : step.icon}
            </div>
            <div className="timeline-label d-none d-lg-block">{step.label}</div>
          </div>
        ))}
      </div>

      {/* Active Step Content panel */}
      <div className="card border-0 shadow-sm p-4 p-md-5 glass-card-light timeline-content-panel">
        <div className="row g-4 align-items-center">
          <div className="col-md-8">
            <span className="badge bg-primary-soft text-primary mb-2 px-3 py-2 rounded-pill fw-semibold small">
              STEP 0{activeStep + 1} — {steps[activeStep].role}
            </span>
            <h3 className="fw-bold public-display-font text-dark mb-3">{steps[activeStep].label}</h3>
            <p className="text-secondary mb-0 lead" style={{ fontSize: "1.05rem", lineHeight: "1.6" }}>
              {steps[activeStep].desc}
            </p>
          </div>
          <div className="col-md-4">
            <div className="bg-light p-4 rounded-4 border border-light">
              <h6 className="fw-bold text-dark mb-2">Technical Insight</h6>
              <p className="text-secondary small mb-0">
                {steps[activeStep].details}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowTimeline;
