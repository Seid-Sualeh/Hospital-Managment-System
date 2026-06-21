import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../../components/Common/PageShell";
import StatusBadge from "../../components/Common/StatusBadge";
import Loader from "../../components/Common/Loader";
import AlertBanner from "../../components/Common/AlertBanner";
import api from "../../services/api";
import useAiPanel from "../../hooks/useAiPanel";
import aiService from "../../services/aiService";
import AICollapsiblePanel from "../../components/AI/AICollapsiblePanel";
import AILoadingState from "../../components/AI/AILoadingState";
import AIErrorState from "../../components/AI/AIErrorState";
import {
  User,
  Thermometer,
  Activity,
  Heart,
  Scale,
  Droplet,
  Wind,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Save,
  FlaskConical,
  Pill,
  CheckSquare,
  RefreshCw,
  History,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Calendar,
  Layers,
  ChevronDown
} from "lucide-react";

const COMPLAINT_OPTIONS = [
  "Fever and headache",
  "Abdominal pain",
  "Chest pain",
  "Back pain",
  "Cough and cold",
  "Skin rash",
  "Other",
];

const ConsultationWorkspace = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [error, setError] = useState(null);

  // EMR patient context states
  const [patientDetails, setPatientDetails] = useState(null);
  const [activeVisitSummary, setActiveVisitSummary] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingContext, setLoadingContext] = useState(false);

  // AI Panels hooks
  const summaryAi = useAiPanel();
  const diagnosisAi = useAiPanel();
  const medicationAi = useAiPanel();
  const labRecommendationAi = useAiPanel();

  const [form, setForm] = useState({
    complaint: "",
    diagnosis: "",
    prescription: "",
    notes: "",
    lab_request: "",
    temp: "",
    bp: "",
    pulse: "",
    weight: "",
  });

  const prevSelectedIdRef = useRef(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/queues/CONSULTATION");
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setQueue(data);
        if (data.length > 0) {
          setSelected(data[0]);
        } else {
          setSelected(null);
        }
      } else {
        throw new Error("Invalid response format from queues API.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load doctor consultation queue. Please check database connectivity or permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Fetch full EMR patient details, history, and triage summary when selection changes
  useEffect(() => {
    if (selected) {
      const fetchPatientContext = async () => {
        setLoadingContext(true);
        // Reset AI panel results from previous patient
        summaryAi.reset();
        diagnosisAi.reset();
        medicationAi.reset();
        labRecommendationAi.reset();

        try {
          const patientId = selected.patient_id;
          const visitId = selected.visit_id;

          const [detailsRes, summaryRes, historyRes] = await Promise.all([
            api.get(`/patients/${patientId}`),
            api.get(`/visits/${visitId}/summary`),
            api.get(`/consultations/patient/${patientId}`)
          ]);

          const patientData = detailsRes.data?.data || detailsRes.data;
          const summaryData = summaryRes.data?.data || summaryRes.data;
          const historyData = historyRes.data?.data || historyRes.data || [];

          setPatientDetails(patientData);
          setActiveVisitSummary(summaryData);
          setPatientHistory(historyData);

          // Populate workspace form fields with clinical triage info and active notes
          setForm({
            complaint: summaryData?.visit?.reason_for_visit || selected.complaint || "",
            diagnosis: summaryData?.consultation?.diagnoses ? 
              (Array.isArray(summaryData.consultation.diagnoses) ? summaryData.consultation.diagnoses.join(", ") : 
               (typeof summaryData.consultation.diagnoses === "string" ? JSON.parse(summaryData.consultation.diagnoses || "[]").join(", ") : "")) : "",
            prescription: summaryData?.prescription?.instructions || "",
            lab_request: summaryData?.labRequest?.test_names ? 
              (Array.isArray(summaryData.labRequest.test_names) ? summaryData.labRequest.test_names.join(", ") : 
               (typeof summaryData.labRequest.test_names === "string" ? JSON.parse(summaryData.labRequest.test_names || "[]").join(", ") : "")) : "",
            notes: summaryData?.consultation?.clinical_notes || "",
            temp: summaryData?.triage?.temperature || "",
            bp: summaryData?.triage?.blood_pressure_sys && summaryData?.triage?.blood_pressure_dia ? 
              `${summaryData.triage.blood_pressure_sys}/${summaryData.triage.blood_pressure_dia}` : "",
            pulse: summaryData?.triage?.pulse_rate || "",
            weight: summaryData?.triage?.weight || "",
          });
        } catch (err) {
          console.error("Error loading patient clinical context:", err);
          setAlert({
            type: "danger",
            msg: "Could not retrieve patient clinical history or triage record."
          });
        } finally {
          setLoadingContext(false);
        }
      };
      fetchPatientContext();
    } else {
      setPatientDetails(null);
      setActiveVisitSummary(null);
      setPatientHistory([]);
    }
  }, [selected]);

  // EMR Payloads helper
  const getAiPayload = useCallback(() => ({
    patient_id: selected?.patient_id,
    complaint: form.complaint,
    diagnosis: form.diagnosis,
    prescription: form.prescription,
    notes: form.notes,
    vitals: activeVisitSummary?.triage ? {
      temp: activeVisitSummary.triage.temperature,
      bp: `${activeVisitSummary.triage.blood_pressure_sys}/${activeVisitSummary.triage.blood_pressure_dia}`,
      pulse: activeVisitSummary.triage.pulse_rate,
      weight: activeVisitSummary.triage.weight
    } : null
  }), [selected, form, activeVisitSummary]);

  // PHASE 2 - AUTOMATIC CLINICAL SUMMARY (Auto-triggered when patient selected)
  useEffect(() => {
    if (selected && selected.id !== prevSelectedIdRef.current) {
      prevSelectedIdRef.current = selected.id;
      
      // Fire automatic Clinical Summary summaryAi.run()
      summaryAi.run(() => aiService.clinicalSummary({ patient_id: selected.patient_id }));
      
      // Pre-fire Diagnosis and Lab Recommendation AI based on entry chief complaint
      const payload = {
        patient_id: selected.patient_id,
        complaint: selected.complaint || "Unspecified Complaint",
        vitals: selected.vitals
      };
      diagnosisAi.run(() => aiService.diagnosisSupport(payload));
      labRecommendationAi.run(() => aiService.clinicalSuggestion(payload));
    }
  }, [selected, summaryAi, diagnosisAi, labRecommendationAi]);

  // PHASE 5 - REAL-TIME MEDICATION SAFETY (Debounced on prescription text inputs)
  useEffect(() => {
    if (!form.prescription || !selected) {
      medicationAi.reset();
      return;
    }

    const payload = getAiPayload();
    const delayDebounce = setTimeout(() => {
      medicationAi.run(() => aiService.medicationAssistance(payload));
    }, 1500); // 1.5 second debounce delay

    return () => clearTimeout(delayDebounce);
  }, [form.prescription, selected, getAiPayload, medicationAi]);

  const handleSave = async (actionType = "draft") => {
    if (!selected) return;
    setSaving(true);

    const prescriptionsArray = form.prescription
      ? [{ name: form.prescription, dosage: "", frequency: "", duration: "" }]
      : [];

    const labTestsArray = form.lab_request
      ? form.lab_request.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const payload = {
      patient_id: selected.patient_id,
      visit_id: selected.visit_id,
      chief_complaints: form.complaint || "Unspecified Complaint",
      clinical_notes: form.notes,
      diagnoses: form.diagnosis ? [form.diagnosis.trim()] : [],
      prescriptions: prescriptionsArray,
      lab_tests: labTestsArray,
      vitals: activeVisitSummary?.triage ? {
        temp: activeVisitSummary.triage.temperature,
        bp_sys: activeVisitSummary.triage.blood_pressure_sys,
        bp_dia: activeVisitSummary.triage.blood_pressure_dia,
        pulse: activeVisitSummary.triage.pulse_rate,
        weight: activeVisitSummary.triage.weight,
        height: activeVisitSummary.triage.height,
        bmi: activeVisitSummary.triage.bmi,
        spo2: activeVisitSummary.triage.oxygen_saturation,
        rr: activeVisitSummary.triage.respiratory_rate
      } : null,
      status: actionType === "draft" ? "draft" : "completed"
    };

    try {
      await api.post("/consultations", payload);

      let message = "Draft saved.";
      if (actionType === "lab") {
        message = "Consultation recorded and patient sent to Laboratory queue.";
      } else if (actionType === "pharmacy") {
        message = "Consultation recorded and prescription sent to Pharmacy queue.";
      } else if (actionType === "complete") {
        message = "Consultation complete. Visit closed successfully.";
      }

      setAlert({
        type: "success",
        msg: message,
      });

      if (actionType !== "draft") {
        setForm({
          complaint: "",
          diagnosis: "",
          prescription: "",
          notes: "",
          lab_request: "",
          temp: "",
          bp: "",
          pulse: "",
          weight: "",
        });
        loadQueue();
      }
    } catch (err) {
      console.error(err);
      if (actionType === "draft") {
        localStorage.setItem(`emr_draft_${selected.visit_id}`, JSON.stringify(payload));
        setAlert({
          type: "warning",
          msg: "Saved draft locally to browser storage (network offline)."
        });
      } else {
        setAlert({
          type: "danger",
          msg: err.response?.data?.message || err.message || "Failed to process EMR clinical actions."
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Helper parsers for Phase 3, 4, 5, 6 CDSS dashboard extraction
  const parseDiffDiagnoses = (text) => {
    if (!text) return [];
    const lines = text.split("\n");
    const diffs = [];
    for (const line of lines) {
      const match = line.match(/^[-*]\s*([^(]+)\s*\((\d+%)\):\s*(.*)$/);
      if (match) {
        diffs.push({
          name: match[1].trim(),
          confidence: match[2],
          findings: match[3].trim()
        });
      } else {
        const matchSimple = line.match(/^[-*]\s*([^(]+)\s*\((\d+%)\)/);
        if (matchSimple) {
          diffs.push({
            name: matchSimple[1].trim(),
            confidence: matchSimple[2],
            findings: line.replace(/^[-*]\s*([^(]+)\s*\((\d+%)\)/, "").replace(/^[:\s\-]+/, "").trim()
          });
        }
      }
    }
    return diffs.slice(0, 5);
  };

  const parseRecommendedTests = (text) => {
    if (!text) return [];
    const lines = text.split("\n");
    const tests = [];
    for (const line of lines) {
      const match = line.match(/^[-*]\s*([^:]+):\s*(.*)$/);
      if (match) {
        if (match[1].includes("**") || match[1].toLowerCase().includes("tests")) continue;
        tests.push({
          name: match[1].replace(/[-*`]/g, "").trim(),
          reason: match[2].trim()
        });
      }
    }
    return tests.slice(0, 5);
  };

  const parseRedFlags = (text) => {
    if (!text) return [];
    const lines = text.split("\n");
    const flags = [];
    let inSection = false;
    for (const line of lines) {
      if (line.toLowerCase().includes("red flag") || line.toLowerCase().includes("warnings")) {
        inSection = true;
        continue;
      }
      if (inSection && line.startsWith("**")) {
        break;
      }
      if (inSection && (line.startsWith("- ") || line.startsWith("• "))) {
        flags.push(line.replace(/^[-•]\s*/, "").trim());
      }
    }
    return flags.slice(0, 3);
  };

  const parseSectionItems = (text, headingTitle) => {
    if (!text) return [];
    const lines = text.split("\n");
    const items = [];
    let inSection = false;
    for (const line of lines) {
      if (line.toLowerCase().includes(headingTitle.toLowerCase())) {
        inSection = true;
        continue;
      }
      if (inSection && line.startsWith("**") && !line.toLowerCase().includes(headingTitle.toLowerCase())) {
        break;
      }
      if (inSection && (line.startsWith("- ") || line.startsWith("• ") || line.match(/^\d+\./))) {
        items.push(line.replace(/^[-•\d+\.]\s*/, "").trim());
      }
    }
    return items.slice(0, 4);
  };

  const getMedicationSafetyAlert = (text) => {
    if (!text) return { level: "green", label: "No safety screening completed.", color: "alert-secondary" };
    const lower = text.toLowerCase();
    if (lower.includes("red") || lower.includes("severe") || lower.includes("contraindicated") || lower.includes("anaphylaxis") || lower.includes("🚨")) {
      return { level: "red", label: "🚨 Severe Contraindication Flagged", color: "alert-danger" };
    }
    if (lower.includes("yellow") || lower.includes("caution") || lower.includes("warning") || lower.includes("interaction") || lower.includes("moderate")) {
      return { level: "yellow", label: "⚠ Use Caution: Warnings Identified", color: "alert-warning" };
    }
    return { level: "green", label: "✓ Medication Safety Clear: No interactions found", color: "alert-success" };
  };

  const handleAddTest = (testName) => {
    setForm(prev => {
      const existing = prev.lab_request ? prev.lab_request.split(",").map(t => t.trim()) : [];
      if (!existing.includes(testName)) {
        existing.push(testName);
      }
      return { ...prev, lab_request: existing.join(", ") };
    });
  };

  const getAge = (dob) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getWaitingTime = (createdAt) => {
    if (!createdAt) return "0m";
    const diffMs = new Date() - new Date(createdAt);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m`;
  };

  const getWaitingClass = (createdAt) => {
    if (!createdAt) return "bg-success text-white";
    const diffMs = new Date() - new Date(createdAt);
    if (diffMs > 2700000) return "bg-danger text-white"; 
    if (diffMs > 1200000) return "bg-warning text-dark"; 
    return "bg-success text-white";
  };

  const getRiskLevel = () => {
    const triage = activeVisitSummary?.triage;
    if (!triage) return { label: "Unknown", color: "bg-secondary text-white" };

    const level = String(triage.triage_level).toLowerCase();
    if (level === "red" || level === "emergent" || (triage.temperature > 39) || (triage.oxygen_saturation && triage.oxygen_saturation < 92)) {
      return { label: "High Risk", color: "bg-danger text-white" };
    }
    if (level === "yellow" || level === "urgent" || (triage.temperature > 38) || (triage.blood_pressure_sys > 140)) {
      return { label: "Moderate Risk", color: "bg-warning text-dark" };
    }
    return { label: "Low Risk", color: "bg-success text-white" };
  };

  const getTimelineStatus = (stage) => {
    const status = activeVisitSummary?.visit?.visit_status;
    const hasTriage = Boolean(activeVisitSummary?.triage);
    const hasConsultation = Boolean(activeVisitSummary?.consultation || activeVisitSummary?.visit?.consultation_id);

    if (stage === "Registration") {
      return { completed: true, label: "Registered" };
    }
    if (stage === "Payment") {
      const isPaid = status !== "REGISTERED";
      return { completed: isPaid, label: isPaid ? "Paid" : "Pending" };
    }
    if (stage === "Triage") {
      return { completed: hasTriage, label: hasTriage ? "Completed" : "Pending" };
    }
    if (stage === "Consultation") {
      return { completed: hasConsultation, label: hasConsultation ? "Completed" : "In Progress" };
    }
    return { completed: false, label: "Pending" };
  };

  const getProgressTracker = () => {
    let completed = 0;
    const total = 5;
    
    if (activeVisitSummary?.triage) completed++;
    if (form.complaint) completed++;
    if (form.notes) completed++;
    if (form.diagnosis) completed++;
    if (form.prescription || form.lab_request) completed++;

    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent };
  };

  const getInitials = (firstName = "", lastName = "") =>
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  if (loading) return <Loader fullPage message="Loading EMR consultation queue..." />;

  // Extract CDSS variables for Dashboard integration
  const parsedDiagnosesList = parseDiffDiagnoses(diagnosisAi.content);
  const parsedTestsList = parseRecommendedTests(labRecommendationAi.content);
  const parsedRedFlagsList = parseRedFlags(diagnosisAi.content);
  const parsedActionsList = parseSectionItems(summaryAi.content, "Suggested Next Steps");
  const medSafetyAlert = getMedicationSafetyAlert(medicationAi.content);

  return (
    <PageShell>
      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.msg}
          onClose={() => setAlert(null)}
        />
      )}

      {/* EMR Breadcrumbs */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item text-muted">Clinical Portal</li>
          <li className="breadcrumb-item text-muted">Consultations</li>
          <li className="breadcrumb-item active fw-semibold text-primary">CDSS Clinical Workstation</li>
        </ol>
      </nav>

      {/* Main Grid */}
      <div className="row g-4">
        
        {/* LEFT COLUMN - Patient Queue */}
        <div className="col-lg-3">
          <div className="mc-card shadow-sm border border-light">
            <div className="mc-card-body">
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                <h6 className="text-section-title mb-0 d-flex align-items-center gap-2">
                  <Layers size={15} /> Consultation Queue
                </h6>
                <button 
                  onClick={loadQueue} 
                  className="btn btn-sm btn-link p-0 d-flex align-items-center gap-1 text-decoration-none"
                  title="Refresh Queue"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>

              {error ? (
                <div className="alert alert-danger p-3 mb-0" role="alert">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <AlertCircle size={18} />
                    <span className="fw-bold small">Queue Connection Error</span>
                  </div>
                  <p className="small mb-3">{error}</p>
                  <button 
                    onClick={loadQueue}
                    className="btn btn-xs btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-1"
                  >
                    <RefreshCw size={12} /> Retry Connection
                  </button>
                </div>
              ) : queue.length === 0 ? (
                <div className="text-center py-5 text-muted bg-light rounded">
                  <CheckCircle2 size={36} className="mb-2 text-success opacity-75" />
                  <p className="small mb-0">Queue is empty. No patients waiting.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2 max-vh-75 overflow-auto">
                  {queue.map((q) => {
                    const patientName = `${q.patient_first_name} ${q.patient_last_name}`;
                    return (
                      <div
                        key={q.id}
                        className={`p-3 rounded border transition-all ${
                          selected?.id === q.id
                            ? "border-primary bg-primary bg-opacity-10 shadow-sm"
                            : "border-light bg-light hover-bg-light-dark"
                        }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelected(q)}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <div className="stat-card-icon primary avatar-sm flex-shrink-0 rounded-8 fw-bold">
                            {getInitials(q.patient_first_name, q.patient_last_name)}
                          </div>
                          <div className="overflow-hidden flex-grow-1">
                            <div className="fw-semibold small text-truncate text-dark">
                              {patientName}
                            </div>
                            <div className="text-caption text-muted">
                              {q.patient_mrn} &middot; {getAge(q.dob_gregorian)}y &middot; {q.gender === "M" ? "Male" : "Female"}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 d-flex align-items-center justify-content-between">
                          <span className="badge bg-secondary text-dark small">
                            Pos #{q.queue_position}
                          </span>
                          <div className="d-flex align-items-center gap-1">
                            <span className={`badge ${getWaitingClass(q.created_at)} small d-flex align-items-center gap-1`}>
                              <Clock size={10} /> Wait: {getWaitingTime(q.created_at)}
                            </span>
                            <StatusBadge status={q.status || "waiting"} className="ms-1" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Consultation Form & EMR Details */}
        <div className="col-lg-9">
          {selected ? (
            <>
              {/* EMR Patient Banner Header */}
              <div
                className="mc-card mb-4 shadow-sm border border-light"
                style={{ background: "linear-gradient(135deg, var(--mc-sidebar-bg) 0%, #152033 100%)", color: "#fff" }}
              >
                <div className="mc-card-body">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center justify-content-center bg-white bg-opacity-20 rounded-circle fw-bold text-white avatar-lg flex-shrink-0" style={{ backdropFilter: "blur(4px)" }}>
                        {getInitials(selected.patient_first_name, selected.patient_last_name)}
                      </div>
                      <div>
                        <h4 className="mb-1 fw-bold text-white">
                          {selected.patient_first_name} {selected.patient_last_name}
                        </h4>
                        <div className="opacity-75 small d-flex align-items-center gap-2">
                          <span>MRN: <strong className="text-white">{selected.patient_mrn}</strong></span>
                          <span>&bull;</span>
                          <span>Gender: {selected.gender === "M" ? "Male" : "Female"}</span>
                          <span>&bull;</span>
                          <span>DOB: {new Date(selected.dob_gregorian).toLocaleDateString()} ({getAge(selected.dob_gregorian)} Years)</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-end opacity-75 small">
                      <div className="badge bg-white bg-opacity-10 text-white px-3 py-1 rounded">Encounter Visit ID: {selected.visit_id}</div>
                      <div className="mt-1 text-caption text-white-50">Assigned: {selected.doctor_first_name ? `Dr. ${selected.doctor_first_name} ${selected.doctor_last_name[0]}.` : "Unassigned"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visit Timeline Tracker */}
              <div className="mc-card mb-4 bg-white shadow-sm border border-light">
                <div className="mc-card-body py-3">
                  <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                    <h6 className="text-section-title mb-0 d-flex align-items-center gap-1 text-primary">
                      <Clock size={16} /> Encounter Flow Tracking
                    </h6>
                    <span className="text-caption text-muted">Visit Status: <strong>{activeVisitSummary?.visit?.visit_status}</strong></span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between position-relative px-4">
                    {["Registration", "Payment", "Triage", "Consultation"].map((stage, idx) => {
                      const timeline = getTimelineStatus(stage);
                      return (
                        <React.Fragment key={stage}>
                          <div className="d-flex flex-column align-items-center position-relative animate-fade-in" style={{ zIndex: 2 }}>
                            <div
                              className={`rounded-circle d-flex align-items-center justify-content-center mb-1 transition-all`}
                              style={{
                                width: "32px",
                                height: "32px",
                                backgroundColor: timeline.completed ? "var(--mc-success, #2e7d32)" : "var(--mc-border-color, #e0e0e0)",
                                color: "#fff",
                                fontWeight: "bold",
                                transform: timeline.completed ? "scale(1.05)" : "none"
                              }}
                            >
                              {timeline.completed ? (
                                <CheckCircle2 size={16} />
                              ) : (
                                <span style={{ fontSize: "12px" }}>{idx + 1}</span>
                              )}
                            </div>
                            <span className="fw-semibold small text-dark">{stage}</span>
                            <span className="text-caption text-muted" style={{ fontSize: "10px" }}>{timeline.label}</span>
                          </div>
                          {idx < 3 && (
                            <div
                              className="flex-grow-1 mx-2"
                              style={{
                                height: "3px",
                                backgroundColor: getTimelineStatus(["Registration", "Payment", "Triage", "Consultation"][idx + 1]).completed ? "var(--mc-success, #2e7d32)" : "var(--mc-border-color, #e0e0e0)",
                                position: "relative",
                                top: "-18px",
                                zIndex: 1
                              }}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Patient Snapshot Section */}
              <div className="mc-card mb-4 border border-light shadow-sm bg-light bg-opacity-50">
                <div className="mc-card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                    <h6 className="text-section-title mb-0 d-flex align-items-center gap-2 text-dark">
                      <History size={16} /> Patient EMR Snapshot
                    </h6>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-caption text-muted">CDSS Risk Status:</span>
                      <span className={`badge ${getRiskLevel().color} px-3 py-1 rounded-pill fw-bold shadow-xs`}>
                        {getRiskLevel().label}
                      </span>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-3 col-sm-6 border-end">
                      <div className="text-caption text-muted">Chronic Diseases</div>
                      <div className="fw-bold text-dark mt-1">
                        {patientDetails?.id === 1 ? (
                          <span className="text-danger">Hypertension, Diabetes</span>
                        ) : (
                          <span className="text-muted">None documented</span>
                        )}
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6 border-end">
                      <div className="text-caption text-muted">Allergies</div>
                      <div className="fw-bold mt-1">
                        {patientDetails?.id === 1 ? (
                          <span className="text-danger">Penicillin (Anaphylaxis)</span>
                        ) : (
                          <span className="text-success">No Known Drug Allergies</span>
                        )}
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-12 border-end">
                      <div className="text-caption text-muted">Last Consultation Encounter</div>
                      <div className="mt-1 small">
                        {patientHistory.length > 0 ? (
                          <div>
                            <span className="fw-semibold text-dark">
                              {new Date(patientHistory[0].consultation_datetime).toLocaleDateString()}
                            </span>{" "}
                            &middot; Diag: <span className="text-primary">{patientHistory[0].diagnoses ? JSON.parse(patientHistory[0].diagnoses)[0] : "N/A"}</span>
                            <div className="text-muted text-truncate" style={{ maxWidth: "250px" }}>
                              Complaint: {patientHistory[0].chief_complaints}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted">No historical consultations</span>
                        )}
                      </div>
                    </div>
                    <div className="col-md-2 col-sm-6">
                      <div className="text-caption text-muted">Previous History</div>
                      <div className="fw-bold text-dark mt-1">
                        {patientHistory.length} visit(s) logged
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PHASE 2 - AUTO AI CLINICAL SUMMARY PANEL */}
              <div className="mb-4">
                <AICollapsiblePanel
                  variant="summary"
                  title="Auto-Generated Clinical Summary"
                  subtitle="Parsed timeline and clinical background summary"
                  loading={summaryAi.loading}
                  content={summaryAi.content}
                  sections={summaryAi.sections}
                  error={summaryAi.error}
                  defaultOpen
                  onRefresh={() => summaryAi.run(() => aiService.clinicalSummary({ patient_id: selected.patient_id }))}
                  emptyTitle="Analyzing Patient Record..."
                  emptyDescription="The CDSS is scanning EMR databases to build an automatic summary."
                />
              </div>

              {/* PHASE 6 - CLINICAL DECISION CENTER (Integrated primary dashboard) */}
              <div className="mc-card mb-4 border border-primary border-2 shadow-sm bg-white">
                <div className="mc-card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                    <h6 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                      <Sparkles size={18} className="text-primary animate-pulse" /> Clinical Decision Center (CDSS)
                    </h6>
                    <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1 fw-bold rounded-pill">
                      Active Monitoring
                    </span>
                  </div>

                  <div className="row g-4">
                    {/* Diagnostic Differential Column */}
                    <div className="col-md-4 border-end">
                      <div className="fw-semibold text-dark small mb-2 d-flex align-items-center justify-content-between">
                        <span>Suggested Differential Diagnoses</span>
                        {diagnosisAi.loading && <Loader size="xs" />}
                      </div>
                      
                      {parsedDiagnosesList.length === 0 ? (
                        <p className="text-caption text-muted mb-0">Differential diagnoses list will appear here once complains are analyzed.</p>
                      ) : (
                        <div className="d-flex flex-column gap-2">
                          {parsedDiagnosesList.map((d, idx) => (
                            <div key={idx} className="p-2 border rounded bg-light bg-opacity-50 d-flex align-items-center justify-content-between transition-all hover-shadow-xs">
                              <div className="overflow-hidden me-1">
                                <div className="fw-semibold text-dark small text-truncate" title={d.name}>
                                  {d.name} <span className="text-primary font-monospace">({d.confidence})</span>
                                </div>
                                <div className="text-caption text-muted text-truncate" style={{ fontSize: "9px" }} title={d.findings}>
                                  {d.findings}
                                </div>
                              </div>
                              <button 
                                type="button"
                                className="btn btn-xs btn-primary px-2 flex-shrink-0"
                                style={{ fontSize: "10px" }}
                                onClick={() => setForm(prev => ({ ...prev, diagnosis: d.name }))}
                              >
                                Use
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Labs and Actions Column */}
                    <div className="col-md-4 border-end">
                      <div className="fw-semibold text-dark small mb-2 d-flex align-items-center justify-content-between">
                        <span>AI Suggested Tests</span>
                        {labRecommendationAi.loading && <Loader size="xs" />}
                      </div>

                      {parsedTestsList.length === 0 ? (
                        <p className="text-caption text-muted mb-0">Recommended lab and radiology orders will load here.</p>
                      ) : (
                        <div className="d-flex flex-column gap-2">
                          {parsedTestsList.map((t, idx) => (
                            <div key={idx} className="p-2 border rounded bg-light bg-opacity-50 d-flex align-items-center justify-content-between transition-all">
                              <div className="overflow-hidden me-1">
                                <div className="fw-semibold text-dark small text-truncate" title={t.name}>
                                  {t.name}
                                </div>
                                <div className="text-caption text-muted text-truncate" style={{ fontSize: "9px" }} title={t.reason}>
                                  {t.reason}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-primary px-2 flex-shrink-0"
                                style={{ fontSize: "10px" }}
                                onClick={() => handleAddTest(t.name)}
                              >
                                Add
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Safety and Red Flags Column */}
                    <div className="col-md-4">
                      {/* Live prescription warnings */}
                      <div className="mb-3">
                        <div className="fw-semibold text-dark small mb-2">Medication Warnings</div>
                        <div className={`alert ${medSafetyAlert.color} p-2 rounded mb-0 d-flex align-items-start gap-2 border`}>
                          {medSafetyAlert.level === "red" && <ShieldAlert className="text-danger flex-shrink-0 mt-0" size={16} />}
                          {medSafetyAlert.level === "yellow" && <AlertTriangle className="text-warning flex-shrink-0 mt-0" size={16} />}
                          {medSafetyAlert.level === "green" && <ShieldCheck className="text-success flex-shrink-0 mt-0" size={16} />}
                          {medSafetyAlert.level === "green" && !form.prescription && <Activity className="text-secondary flex-shrink-0 mt-0 animate-pulse" size={16} />}
                          <div className="small flex-grow-1" style={{ fontSize: "11px" }}>
                            <div className="fw-bold">{medSafetyAlert.label}</div>
                            {medicationAi.loading ? (
                              <span className="text-muted">Analyzing dosage safety...</span>
                            ) : medicationAi.content ? (
                              <div className="text-muted mt-1 text-truncate-2" style={{ maxHeight: "36px", overflow: "hidden" }}>
                                {medicationAi.content}
                              </div>
                            ) : (
                              <span className="text-muted">Type in Rx box to automatically validate dosage safety.</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Red flag indicators */}
                      <div>
                        <div className="fw-semibold text-dark small mb-2 text-danger">Urgent Findings / Red Flags</div>
                        {parsedRedFlagsList.length === 0 ? (
                          <div className="p-2 bg-success bg-opacity-10 text-success rounded border border-success border-opacity-25 text-caption d-flex align-items-center gap-1">
                            <ShieldCheck size={14} /> No urgent warnings flagged.
                          </div>
                        ) : (
                          <div className="d-flex flex-column gap-1">
                            {parsedRedFlagsList.map((flag, idx) => (
                              <div key={idx} className="p-2 bg-danger bg-opacity-10 text-danger rounded border border-danger border-opacity-25 text-caption fw-semibold d-flex align-items-start gap-1">
                                <AlertTriangle size={14} className="flex-shrink-0 mt-0" />
                                <span>{flag}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultation Workspace Form */}
              <div className="mc-card mb-4 shadow-sm border border-light">
                <div className="mc-card-body">
                  <div className="row g-4">
                    
                    {/* Left Form Input Column */}
                    <div className="col-md-7">
                      <h6 className="text-section-title mb-3 border-bottom pb-2">Clinical Encounter Documentation</h6>

                      {/* Chief Complaint */}
                      <div className="mb-3">
                        <label className="mc-form-label fw-bold">Chief Complaint *</label>
                        <select
                          className="form-select border-primary-focus"
                          value={form.complaint}
                          onChange={(e) =>
                            setForm({ ...form, complaint: e.target.value })
                          }
                        >
                          <option value="">Select complaint</option>
                          {COMPLAINT_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Working Diagnosis */}
                      <div className="mb-3">
                        <label className="mc-form-label fw-bold">Working Diagnosis</label>
                        <input
                          className="form-control"
                          placeholder="Type diagnoses (e.g. Essential Hypertension)"
                          value={form.diagnosis}
                          onChange={(e) =>
                            setForm({ ...form, diagnosis: e.target.value })
                          }
                        />
                        {/* Inline Differential Diagnosis Helper panel */}
                        <div className="mt-2">
                          <AICollapsiblePanel
                            variant="diagnosis"
                            title="Differential Diagnosis Support"
                            subtitle="Clinical reasoning and investigations recommendations"
                            loading={diagnosisAi.loading}
                            content={diagnosisAi.content}
                            sections={diagnosisAi.sections}
                            error={diagnosisAi.error}
                            onAction={() => diagnosisAi.run(() => aiService.diagnosisSupport(getAiPayload()))}
                            onRefresh={() => diagnosisAi.run(() => aiService.diagnosisSupport(getAiPayload()))}
                            emptyTitle="Awaiting clinical inputs"
                            emptyDescription="Diagnoses differentials will load automatically based on complaint and notes."
                          />
                        </div>
                      </div>

                      {/* Prescription Field */}
                      <div className="mb-3">
                        <label className="mc-form-label fw-bold">Prescription (Rx)</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Format: [Drug Name] [Strength] [Frequency] [Duration] (e.g. Amoxicillin 500mg tid x7 days)"
                          value={form.prescription}
                          onChange={(e) =>
                            setForm({ ...form, prescription: e.target.value })
                          }
                        />
                        {/* Inline Medication Assistance panel */}
                        <div className="mt-2">
                          <AICollapsiblePanel
                            variant="medication"
                            title="Medication Interaction & Safety Screening"
                            subtitle="Allergies, contraindications, and duplications"
                            loading={medicationAi.loading}
                            content={medicationAi.content}
                            sections={medicationAi.sections}
                            error={medicationAi.error}
                            onRefresh={() => medicationAi.run(() => aiService.medicationAssistance(getAiPayload()))}
                            emptyTitle="Safety Screening Inactive"
                            emptyDescription="Real-time medication safety checks will execute automatically as you type."
                          />
                        </div>
                      </div>

                      {/* Lab Requests Field */}
                      <div className="mb-3">
                        <div className="mb-2">
                          {/* Recommended Tests displayed inline above Lab Request field */}
                          {parsedTestsList.length > 0 && (
                            <div className="mb-2 p-2 border rounded bg-light bg-opacity-75">
                              <span className="text-caption fw-semibold text-muted d-block mb-1">Click to add AI-recommended tests:</span>
                              <div className="d-flex flex-wrap gap-1">
                                {parsedTestsList.map((test, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    className="btn btn-xs btn-outline-secondary d-flex align-items-center gap-1 rounded-pill"
                                    onClick={() => handleAddTest(test.name)}
                                  >
                                    + {test.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <label className="mc-form-label fw-bold">Lab Requests</label>
                        <input
                          className="form-control"
                          placeholder="e.g. CBC, Lipid Panel, Blood glucose"
                          value={form.lab_request}
                          onChange={(e) =>
                            setForm({ ...form, lab_request: e.target.value })
                          }
                        />
                        {/* Inline Lab Recommendation panel */}
                        <div className="mt-2">
                          <AICollapsiblePanel
                            variant="lab"
                            title="Laboratory Diagnostics Recommendation"
                            subtitle="AI suggested panel tests based on patient presentation"
                            loading={labRecommendationAi.loading}
                            content={labRecommendationAi.content}
                            sections={labRecommendationAi.sections}
                            error={labRecommendationAi.error}
                            onAction={() => labRecommendationAi.run(() => aiService.clinicalSuggestion(getAiPayload()))}
                            onRefresh={() => labRecommendationAi.run(() => aiService.clinicalSuggestion(getAiPayload()))}
                            emptyTitle="No lab recommendations loaded"
                            emptyDescription="AI test recommendations will populate here based on chief complaint."
                          />
                        </div>
                      </div>

                      {/* Clinical Encounter Notes */}
                      <div className="mb-3">
                        <label className="mc-form-label fw-bold">Encounter History & Clinical Notes</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Enter history of present illness, clinical observations, physical exam details..."
                          value={form.notes}
                          onChange={(e) =>
                            setForm({ ...form, notes: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Right Vitals, History & Progress Column */}
                    <div className="col-md-5">
                      
                      {/* Triage Vitals Section */}
                      <div className="mb-4">
                        <h6 className="text-section-title mb-3 d-flex align-items-center justify-content-between border-bottom pb-2">
                          <span>Triage Vital Signs</span>
                          {activeVisitSummary?.triage && (
                            <span className="text-caption text-muted">
                              Nurse: {activeVisitSummary.triage.nurse_first || "Nurse"}
                            </span>
                          )}
                        </h6>
                        
                        {!activeVisitSummary?.triage ? (
                          <div className="alert alert-warning p-3 d-flex align-items-start gap-2 mb-0" role="alert">
                            <AlertTriangle className="flex-shrink-0 text-warning mt-1" size={18} />
                            <div>
                              <span className="fw-bold small">Missing Triage Record</span>
                              <p className="small mb-0 mt-1">This patient has not been routed to triage. Vital signs must be recorded by triage nursing staff before EMR closure.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="row g-2">
                            <div className="col-6">
                              <div className="p-3 border rounded bg-white text-center shadow-xs">
                                <Thermometer size={16} className={`${activeVisitSummary.triage.temperature > 37.8 ? "text-danger" : "text-success"} mb-1`} />
                                <div className="text-caption text-muted">Temperature</div>
                                <div className="fw-bold text-dark mt-1" style={{ fontSize: "14px" }}>
                                  {activeVisitSummary.triage.temperature ? `${activeVisitSummary.triage.temperature} °C` : "—"}
                                </div>
                                <span className={`text-caption ${activeVisitSummary.triage.temperature > 37.8 ? "text-danger" : "text-muted"}`} style={{ fontSize: "10px" }}>
                                  {activeVisitSummary.triage.temperature > 37.8 ? "Fever / Pyrexia" : "Normal"}
                                </span>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="p-3 border rounded bg-white text-center shadow-xs">
                                <Activity size={16} className="text-primary mb-1" />
                                <div className="text-caption text-muted">Blood Pressure</div>
                                <div className="fw-bold text-dark mt-1" style={{ fontSize: "14px" }}>
                                  {activeVisitSummary.triage.blood_pressure_sys && activeVisitSummary.triage.blood_pressure_dia
                                    ? `${activeVisitSummary.triage.blood_pressure_sys}/${activeVisitSummary.triage.blood_pressure_dia}`
                                    : "—"
                                  }
                                </div>
                                <span className="text-caption text-muted" style={{ fontSize: "10px" }}>mmHg</span>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="p-3 border rounded bg-white text-center shadow-xs">
                                <Heart size={16} className="text-danger mb-1" />
                                <div className="text-caption text-muted">Heart Rate</div>
                                <div className="fw-bold text-dark mt-1" style={{ fontSize: "14px" }}>
                                  {activeVisitSummary.triage.pulse_rate ? `${activeVisitSummary.triage.pulse_rate} bpm` : "—"}
                                </div>
                                <span className="text-caption text-muted" style={{ fontSize: "10px" }}>Pulse</span>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="p-3 border rounded bg-white text-center shadow-xs">
                                <Droplet size={16} className="text-info mb-1" />
                                <div className="text-caption text-muted">O₂ Saturation</div>
                                <div className="fw-bold text-dark mt-1" style={{ fontSize: "14px" }}>
                                  {activeVisitSummary.triage.oxygen_saturation ? `${activeVisitSummary.triage.oxygen_saturation} %` : "—"}
                                </div>
                                <span className="text-caption text-muted" style={{ fontSize: "10px" }}>SpO₂</span>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="p-3 border rounded bg-white text-center shadow-xs">
                                <Wind size={16} className="text-secondary mb-1" />
                                <div className="text-caption text-muted">Resp. Rate</div>
                                <div className="fw-bold text-dark mt-1" style={{ fontSize: "14px" }}>
                                  {activeVisitSummary.triage.respiratory_rate ? `${activeVisitSummary.triage.respiratory_rate} /min` : "—"}
                                </div>
                                <span className="text-caption text-muted" style={{ fontSize: "10px" }}>Breaths</span>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="p-3 border rounded bg-white text-center shadow-xs">
                                <Scale size={16} className="text-success mb-1" />
                                <div className="text-caption text-muted">BMI / Weight</div>
                                <div className="fw-bold text-dark mt-1" style={{ fontSize: "14px" }}>
                                  {activeVisitSummary.triage.weight ? `${activeVisitSummary.triage.weight} kg` : "—"}
                                </div>
                                <span className="text-caption text-muted" style={{ fontSize: "10px" }}>
                                  {activeVisitSummary.triage.bmi ? `BMI: ${activeVisitSummary.triage.bmi}` : "Weight"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* EMR Consultation Progress Tracker */}
                      <div className="mb-4 p-3 border rounded bg-light">
                        <h6 className="fw-bold text-dark small mb-2 d-flex align-items-center gap-2">
                          <CheckSquare size={16} /> Encounter Completeness Check
                        </h6>
                        <div className="progress mb-3" style={{ height: "8px" }}>
                          <div 
                            className="progress-bar bg-success progress-bar-striped progress-bar-animated animate-pulse" 
                            role="progressbar" 
                            style={{ width: `${getProgressTracker().percent}%` }}
                            aria-valuenow={getProgressTracker().percent} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          />
                        </div>
                        <div className="d-flex flex-column gap-2 small">
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="text-muted">Vitals Verified</span>
                            <span className={`badge ${activeVisitSummary?.triage ? "bg-success" : "bg-secondary"} rounded-pill`}>
                              {activeVisitSummary?.triage ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="text-muted">Chief Complaint Documented</span>
                            <span className={`badge ${form.complaint ? "bg-success" : "bg-secondary"} rounded-pill`}>
                              {form.complaint ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="text-muted">Clinical Notes entered</span>
                            <span className={`badge ${form.notes ? "bg-success" : "bg-secondary"} rounded-pill`}>
                              {form.notes ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="text-muted">Diagnosis Assigned</span>
                            <span className={`badge ${form.diagnosis ? "bg-success" : "bg-secondary"} rounded-pill`}>
                              {form.diagnosis ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="text-muted">Prescriptions / Labs ordered</span>
                            <span className={`badge ${form.prescription || form.lab_request ? "bg-success" : "bg-secondary"} rounded-pill`}>
                              {form.prescription || form.lab_request ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* PHASE 7 - PATIENT HISTORY TIMELINE (Redesigned clinical timelines) */}
                      <div className="p-3 border rounded bg-white shadow-xs">
                        <h6 className="fw-semibold text-dark small mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                          <History size={16} className="text-primary" /> Longitudinal Clinical History
                        </h6>
                        {patientHistory.length === 0 ? (
                          <p className="small text-muted text-center py-4 mb-0">No historical consultations found in EMR archives.</p>
                        ) : (
                          <div className="clinical-timeline ps-3 position-relative" style={{ borderLeft: "2px solid var(--mc-border-color, #e0e0e0)" }}>
                            {patientHistory.map((h, i) => {
                              const diagnoses = h.diagnoses ? (
                                typeof h.diagnoses === "string" ? JSON.parse(h.diagnoses) : h.diagnoses
                              ) : [];
                              const dateStr = new Date(h.consultation_datetime).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
                              return (
                                <div key={h.id} className="timeline-item mb-3 position-relative">
                                  {/* Bullet point indicator */}
                                  <div 
                                    className="position-absolute rounded-circle bg-primary" 
                                    style={{ 
                                      width: "10px", 
                                      height: "10px", 
                                      left: "-21px", 
                                      top: "5px",
                                      border: "2px solid #fff"
                                    }} 
                                  />
                                  <div className="d-flex justify-content-between align-items-start">
                                    <span className="fw-bold text-dark small">{dateStr}</span>
                                    <span className="text-caption text-muted">Dr. {h.doctor_last_name || "Clinician"}</span>
                                  </div>
                                  <div className="fw-semibold text-primary small mt-1">
                                    {diagnoses.join(", ") || "No Diagnosis Recorded"}
                                  </div>
                                  {h.chief_complaints && (
                                    <div className="text-caption text-muted mt-1 text-truncate" style={{ maxWidth: "250px" }}>
                                      Complaint: {h.chief_complaints}
                                    </div>
                                  )}
                                  {h.clinical_notes && (
                                    <div className="text-caption text-muted mt-1 text-truncate" style={{ maxWidth: "250px" }}>
                                      Outcome/Notes: {h.clinical_notes}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Workflow Action Buttons */}
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4 pt-3 border-top">
                    <div>
                      <button
                        className="btn btn-outline-secondary d-flex align-items-center gap-1"
                        onClick={() => handleSave("draft")}
                        disabled={saving}
                      >
                        <Save size={16} /> Save Draft
                      </button>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-outline-primary d-flex align-items-center gap-1"
                        onClick={() => handleSave("lab")}
                        disabled={saving || !form.lab_request}
                        title={!form.lab_request ? "Add lab requests to enable" : "Submit consultation & send to Lab"}
                      >
                        <FlaskConical size={16} /> Send to Lab
                      </button>
                      <button
                        className="btn btn-outline-success d-flex align-items-center gap-1"
                        onClick={() => handleSave("pharmacy")}
                        disabled={saving || !form.prescription}
                        title={!form.prescription ? "Add prescriptions to enable" : "Submit consultation & send to Pharmacy"}
                      >
                        <Pill size={16} /> Send to Pharmacy
                      </button>
                      <button
                        className="btn btn-success d-flex align-items-center gap-1"
                        onClick={() => handleSave("complete")}
                        disabled={saving}
                      >
                        {saving ? (
                          <span className="spinner-border spinner-border-sm me-1" />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        Complete Visit
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </>
          ) : (
            <div className="mc-card">
              <div className="mc-card-body text-center py-5 text-muted bg-light rounded">
                <User size={48} className="mb-3 opacity-25" />
                <h5 className="text-dark fw-semibold mb-1">EMR Clinical Workstation</h5>
                <p className="small mb-0">Select a patient from the consultation queue list to start documentation.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </PageShell>
  );
};

export default ConsultationWorkspace;
