import React from "react";
import WorkflowTimeline from "./WorkflowTimeline";
import { Users, Calendar, Stethoscope, FlaskConical, Pill, Banknote, Sparkles, Clipboard, CheckCircle2 } from "lucide-react";

const FeaturesPage = () => {
  const modules = [
    {
      title: "Patient & Queue Management",
      icon: <Users size={24} />,
      desc: "Register patients, generate unique MRN codes, capture triage vitals, and coordinate active clinic queue waitlists dynamically.",
      details: ["Walk-in & Scheduled Registration", "Vital Signs History Trending", "Multi-department Queue Transfer", "Full Patient Health Records (EMR)"]
    },
    {
      title: "Appointment Management",
      icon: <Calendar size={24} />,
      desc: "Manage slots for doctors, schedule follow-ups, and track check-in status directly from a unified visual calendar grid.",
      details: ["Practitioner Availability Control", "Appointment Check-in Indicators", "Follow-up Visit Links", "Resource Slot Management"]
    },
    {
      title: "Consultation Workspace",
      icon: <Stethoscope size={24} />,
      desc: "Intuitive clinical desktop enabling doctors to write ICD-10 medical notes, review historical files, and issue lab or pharmacy requests.",
      details: ["Symptom & History Tracking", "ICD-10 Diagnostic Registry", "Direct LIS Integration", "Electronic Prescribing Module"]
    },
    {
      title: "Laboratory Information (LIS)",
      icon: <FlaskConical size={24} />,
      desc: "Coordinates technician queues, records multi-parameter test results, manages sample barcodes, and handles doctor approval signatures.",
      details: ["Paid Test Worklists", "Numeric & Text Result Fields", "Critical Range Alerts", "Digital Sign-off Audits"]
    },
    {
      title: "e-Pharmacy & Inventory",
      icon: <Pill size={24} />,
      desc: "Dispense prescriptions digitally, track expiry dates, manage suppliers, and trigger low-stock alerts automatically.",
      details: ["Prescription Dispensing List", "Auto Stock Count Deductions", "Low Stock & Expiry Flags", "Supplier Batch Ledgers"]
    },
    {
      title: "Billing & Cashier Ledger",
      icon: <Banknote size={24} />,
      desc: "Generate clinic receipts, invoice consultations, track unpaid balances, and manage payment reconciliation logs in real-time.",
      details: ["Itemized Receipt Printing", "Credit and Debt Invoices", "Multi-tenant Fee Schedules", "Cash Reconciliation Reports"]
    },
    {
      title: "Gemini AI Support",
      icon: <Sparkles size={24} />,
      desc: "Enhances consultation safety with structured clinical summaries, lab result interpretations, and AI diagnosis recommendations.",
      details: ["Automated Clinical Summaries", "Lab Report Translation", "Medication Safety Checks", "Diagnostic Support Alerts"]
    },
    {
      title: "Workforce & Attendance",
      icon: <Clipboard size={24} />,
      desc: "Manage doctor, nurse, and admin shifts. Monitors clock-in/out stamps to generate attendance compliance metrics.",
      details: ["Daily Shift Rosters", "Clock-in Status Indicators", "Lateness Metrics", "Staff Activity Audits"]
    }
  ];

  return (
    <div style={{ paddingTop: "6rem" }}>
      {/* Page Header */}
      <section className="bg-light py-5 border-bottom border-light">
        <div className="container text-center">
          <span className="badge bg-primary-soft text-primary mb-2 px-3 py-2 rounded-pill fw-semibold">CMS CAPABILITIES</span>
          <h1 className="fw-bold display-5 public-display-font text-dark mb-3">Platform Features</h1>
          <p className="text-secondary mx-auto mb-0 lead" style={{ maxWidth: "700px" }}>
            Explore the core module specifications that consolidate clinical workflows, financial processes, and AI decision systems in one place.
          </p>
        </div>
      </section>

      {/* Featured App Showcase */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <span className="badge bg-teal-soft text-teal mb-2 px-3 py-2 rounded-pill fw-semibold">EMR WORKSPACE</span>
              <h2 className="fw-bold public-display-font text-dark mb-4">
                Unified Electronic Medical Records & Intelligence
              </h2>
              <p className="text-secondary mb-4" style={{ lineHeight: "1.7" }}>
                Our Electronic Medical Records (EMR) interface puts critical insights at a physician's fingertips. From initial intake files and triage logs to pharmacy records and lab histories, everything flows together dynamically.
              </p>
              <div className="d-flex flex-column gap-2 mb-0">
                {["ICD-10 Diagnostic Registry Search", "Automatic drug interaction warnings", "Direct LIS integration and electronic orders"].map((f, i) => (
                  <div key={i} className="d-flex align-items-center gap-2 small text-dark fw-semibold">
                    <CheckCircle2 size={16} className="text-success" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-6">
              <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 45px rgba(0,0,0,0.1)", border: "1px solid rgba(0,0,0,0.06)" }}>
                <img
                  src="/emr_features.png"
                  alt="EMR Features Tablet Mockup"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid of Modules */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row g-4">
            {modules.map((m, index) => (
              <div key={index} className="col-lg-6 col-12">
                <div className="card h-100 p-4 border-0 shadow-sm rounded-4 glass-card-light">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="feature-icon-wrapper bg-primary-soft mb-0 flex-shrink-0">
                      {m.icon}
                    </div>
                    <h4 className="fw-bold public-display-font text-dark mb-0">{m.title}</h4>
                  </div>
                  <p className="text-secondary small mb-4">{m.desc}</p>
                  <div className="row g-2">
                    {m.details.map((detail, idx) => (
                      <div key={idx} className="col-md-6 d-flex align-items-center gap-2 small text-dark fw-semibold">
                        <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Workflow Section */}
      <section className="py-5 bg-light border-top border-bottom border-light">
        <div className="container">
          <div className="text-center mb-5">
            <span className="badge bg-purple-soft text-purple mb-2 px-3 py-2 rounded-pill fw-semibold">SYSTEM WORKFLOW</span>
            <h2 className="fw-bold display-6 public-display-font text-dark">Interactive Clinical Timeline</h2>
            <p className="text-secondary mx-auto" style={{ maxWidth: "600px" }}>
              See how actions taken by your staff flow dynamically to coordinate patient care and billing processes.
            </p>
          </div>
          <WorkflowTimeline />
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;
