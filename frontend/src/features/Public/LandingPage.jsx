import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users, Calendar, Stethoscope, FlaskConical, Pill, Banknote,
  Clipboard, Sparkles, HeartPulse, ShieldAlert, CalendarRange,
  Check, ArrowRight, Activity, Brain, Shield, Star, HelpCircle,
  CheckCircle2, Laptop, ChevronRight, FileText, TrendingUp, AlertTriangle, Send,
  Cpu, Lock, Server, CheckSquare, Zap, BarChart4, MapPin, Phone, Mail,
  Target, Eye, Lightbulb, Globe, Award, Users2
} from "lucide-react";
import WorkflowTimeline from "./WorkflowTimeline";

/* ─── Animated Counter ─────────────────────────────────────────────────────── */
const Counter = ({ target, suffix = "", duration = 1500 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(target.replace(/[^0-9]/g, ""), 10);
    if (isNaN(end)) return;
    const totalSteps = 50;
    const increment = Math.ceil(end / totalSteps);
    const stepTime = Math.floor(duration / totalSteps);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { clearInterval(timer); setCount(end); }
      else { setCount(start); }
    }, stepTime);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count.toLocaleString()}{suffix}</span>;
};

/* ─── Wave SVG Divider ─────────────────────────────────────────────────────── */
const WaveDivider = ({ topColor = "#ffffff", bottomColor = "#f0f4f8", flip = false }) => (
  <div style={{ lineHeight: 0, overflow: "hidden", background: topColor, marginBottom: "-2px" }}>
    <svg
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      style={{ display: "block", width: "100%", height: "60px", transform: flip ? "scaleY(-1)" : "none" }}
    >
      <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill={bottomColor} />
    </svg>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════════ */

const LandingPage = () => {
  const [activeAITab, setActiveAITab] = useState("summary");
  const [activeDashboardTab, setActiveDashboardTab] = useState("doctor");

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSuccess(false), 5000);
    }, 1200);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleScrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="public-body">

      {/* ════════════════════════════════════════════════════════════════════════
          1. HERO — Dark Aurora Gradient
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="pub-hero-section">
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <div className="d-flex align-items-center gap-2 mb-4">
                <span className="hipaa-badge-container"><Shield size={11} /> HIPAA Compliant</span>
                <span className="secure-badge-container"><Lock size={11} /> 256-bit SSL</span>
              </div>

              <h1
                className="public-display-font mb-4"
                style={{ fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.04em", color: "#f1f5f9" }}
              >
                Transforming Healthcare Through{" "}
                <span className="pub-gradient-text">Artificial Intelligence</span>
              </h1>

              <p style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "#94a3b8", marginBottom: "2rem", maxWidth: "520px" }}>
                One platform for patient care, laboratory management, pharmacy operations, billing, reporting, and clinical intelligence. Built for modern private practices in Ethiopia.
              </p>

              <div className="d-flex flex-column flex-sm-row gap-3 mb-5">
                <button
                  onClick={() => handleScrollToSection("contact")}
                  className="btn btn-primary btn-lg px-5 d-inline-flex align-items-center gap-2"
                  style={{ boxShadow: "0 12px 30px rgba(37,99,235,0.35)", fontWeight: 700, borderRadius: "10px" }}
                >
                  Request Demo <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => handleScrollToSection("features")}
                  className="btn btn-lg d-inline-flex align-items-center gap-2"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0", fontWeight: 600, borderRadius: "10px", backdropFilter: "blur(8px)" }}
                >
                  Explore Platform <Activity size={18} />
                </button>
                <Link
                  to="/login"
                  className="btn btn-lg d-inline-flex align-items-center gap-2"
                  style={{ background: "TEAL", border: "1px solid rgba(255,255,255,0.08)", color: "#FFF", fontWeight: 600, borderRadius: "10px" }}
                >
                  Staff Login <Laptop size={18} />
                </Link>
              </div>

              <div className="row g-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                {[
                  { label: "Guaranteed Uptime", value: "99.99% Verified" },
                  { label: "API Response Latency", value: "<45 ms average" },
                  { label: "Active Deployments", value: "12 Live Clinics" },
                ].map((stat, i) => (
                  <div key={i} className="col-4">
                    <span style={{ display: "block", fontSize: "0.72rem", color: "TEAL", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</span>
                    <strong style={{ fontSize: "0.95rem", color: "#e2e8f0", fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>{stat.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Mockup */}
            <div className="col-lg-6">
              <div className="device-mockup animate-float" style={{ boxShadow: "0 25px 60px -15px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="device-header" style={{ background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", padding: "10px 16px" }}>
                  <div className="device-dot red" /><div className="device-dot yellow" /><div className="device-dot green" />
                  <span style={{ color: "#94a3b8", fontSize: "11px", marginLeft: "8px", fontWeight: 600, fontFamily: "Outfit, sans-serif" }}>Clinic Operations Dashboard</span>
                </div>
                <div className="device-screen p-0" style={{ overflow: "hidden", background: "#0b0f19" }}>
                  <img
                    src="/clinic_dashboard_hero.png"
                    alt="Enterprise Clinic Management System EMR Dashboard"
                    style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          2. ABOUT — Light Premium Gradient with Mission/Vision
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="about" style={{
        padding: "7rem 0",
        background: "linear-gradient(160deg, #f0f7ff 0%, #faf5ff 50%, #f0fdff 100%)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Floating shapes */}
        <div style={{ position: "absolute", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)", top: "-150px", right: "-100px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)", bottom: "-100px", left: "-100px", pointerEvents: "none" }} />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center mb-5">
            <span className="pub-label-pill light"><Sparkles size={12} /> Our Story</span>
            <h2 className="pub-section-title" style={{ fontSize: "clamp(2rem,4vw,2.8rem)", color: "#0f172a", marginBottom: "1rem" }}>
              Built for Healthcare.<br />
              <span className="pub-gradient-text-dark">Powered by Intelligence.</span>
            </h2>
            <p className="pub-section-subtitle text-secondary">
              MediCare AI was born from the frustration of watching Ethiopian clinics manage patient records on paper, lose revenue to billing gaps, and struggle with fragmented departmental workflows.
            </p>
          </div>

          {/* Mission / Vision / Why cards */}
          <div className="row g-4 mb-5">
            {[
              {
                icon: <Target size={24} />, label: "Our Mission",
                color: "rgba(37,99,235,0.09)", iconColor: "#2563eb",
                title: "Digitize Every Clinic in Ethiopia",
                body: "We believe that every patient in Africa deserves the same quality of digitally-coordinated care as patients in world-class hospitals. Our mission is to make that possible through intelligent, affordable software."
              },
              {
                icon: <Eye size={24} />, label: "Our Vision",
                color: "rgba(139,92,246,0.09)", iconColor: "#8b5cf6",
                title: "AI-First Healthcare Ecosystem",
                body: "A future where clinical decisions are supported by real-time intelligence — where drug interactions are caught before dispensing, diagnoses are guided by evidence, and operations are optimized automatically."
              },
              {
                icon: <Lightbulb size={24} />, label: "Why We Built This",
                color: "rgba(6,182,212,0.09)", iconColor: "#06b6d4",
                title: "Closing the Healthcare Gap",
                body: "We saw clinics losing 20–35% of potential revenue to billing errors, lab bottlenecks and untracked prescriptions. MediCare AI was engineered to close that gap with automation, transparency and data."
              },
            ].map((card, i) => (
              <div key={i} className="col-lg-4 col-md-6">
                <div style={{ background: "#ffffff", borderRadius: "20px", padding: "2rem", height: "100%", border: "1px solid #e8edf4", boxShadow: "0 4px 20px rgba(15,23,42,0.05)", transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)", cursor: "default" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 20px 48px rgba(15,23,42,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(15,23,42,0.05)"; }}
                >
                  <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: card.color, display: "flex", alignItems: "center", justifyContent: "center", color: card.iconColor, marginBottom: "1.25rem" }}>
                    {card.icon}
                  </div>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: card.iconColor, marginBottom: "0.5rem", display: "block" }}>{card.label}</span>
                  <h5 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>{card.title}</h5>
                  <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.7, marginBottom: 0 }}>{card.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Animated Stats Row */}
          <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", borderRadius: "24px", padding: "3rem 2rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
            <div className="row g-4 text-center" style={{ position: "relative", zIndex: 1 }}>
              {[
                { value: "15000", suffix: "+", label: "Patients Served", color: "#60a5fa" },
                { value: "50", suffix: "+", label: "Medical Staff Supported", color: "#a78bfa" },
                { value: "99", suffix: "%", label: "Cloud Uptime Guaranteed", color: "#34d399" },
                { value: "35", suffix: "%", label: "Wait Time Reduction", color: "#f59e0b" },
              ].map((s, i) => (
                <div key={i} className="col-6 col-md-3">
                  <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "2.8rem", fontWeight: 800, letterSpacing: "-0.04em", color: s.color, lineHeight: 1, marginBottom: "0.5rem" }}>
                    <Counter target={s.value} suffix={s.suffix} />
                  </div>
                  <p style={{ color: "#64748b", fontSize: "0.82rem", fontWeight: 500, marginBottom: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          3. FEATURES — White + Premium Glass Cards
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="pub-features-section">
        <div className="container">
          <div className="text-center mb-5">
            <span className="pub-label-pill light"><Cpu size={12} /> Enterprise SaaS Workspaces</span>
            <h2 className="pub-section-title" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", color: "#0f172a", marginBottom: "1rem" }}>
              Complete CMS Platform Modules
            </h2>
            <p className="pub-section-subtitle text-secondary">
              Explore the key business modules integrated within our healthcare software suite — each designed for clinical precision.
            </p>
          </div>

          <div className="row g-4">
            {[
              { icon: <Users size={22} />, title: "Patient Registry & Queue", desc: "Digital registration, active triage queues, patient profile timelines, and electronic health record indexing.", color: "#2563eb", bg: "rgba(37,99,235,0.09)" },
              { icon: <Calendar size={22} />, title: "Appointments Scheduler", desc: "Automate scheduling, allocate doctor slots, track cancellation statistics, and manage walk-in check-ins.", color: "#8b5cf6", bg: "rgba(139,92,246,0.09)" },
              { icon: <Stethoscope size={22} />, title: "Physician Consultations", desc: "Dedicated physician portals with vital trending, diagnoses entry, e-prescribing, and direct lab ordering.", color: "#06b6d4", bg: "rgba(6,182,212,0.09)" },
              { icon: <FlaskConical size={22} />, title: "Laboratory Workspace (LIS)", desc: "Queue laboratory orders, input numeric test results, check normal thresholds, and sign digital approvals.", color: "#10b981", bg: "rgba(16,185,129,0.09)" },
              { icon: <Pill size={22} />, title: "Pharmacy & Inventory", desc: "Dispense medication securely, track batch expiration warnings, and manage supplier purchase log files.", color: "#f59e0b", bg: "rgba(245,158,11,0.09)" },
              { icon: <Banknote size={22} />, title: "Cashier Ledger & Billing", desc: "Create consultation and test invoices, print receipt slips, track patient debt, and balance registers.", color: "#ef4444", bg: "rgba(239,68,68,0.09)" },
              { icon: <Clipboard size={22} />, title: "Attendance & Workforce", desc: "Roster staff duties, coordinate work shifts, track clock-in/out timestamps, and record lateness logs.", color: "#8b5cf6", bg: "rgba(139,92,246,0.09)" },
              { icon: <FileText size={22} />, title: "Advanced Analytical Reports", desc: "Synthesize operational revenue trends, daily patient throughput rates, and pharmacy inventory metrics.", color: "#2563eb", bg: "rgba(37,99,235,0.09)" },
              { icon: <Sparkles size={22} />, title: "AI Clinical Support Engine", desc: "Automate summary drafting, flag potential drug interactions, and explain laboratory test abnormalities.", color: "#6366f1", bg: "rgba(99,102,241,0.09)" },
            ].map((f, i) => (
              <div key={i} className="col-lg-4 col-md-6">
                <div className="feature-spotlight-card" style={{ "--card-accent": `linear-gradient(90deg, ${f.color}, transparent)` }}>
                  <div className="feature-icon-wrapper" style={{ background: f.bg, color: f.color }}>
                    {f.icon}
                  </div>
                  <h5 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "#0f172a", marginBottom: "0.6rem", letterSpacing: "-0.01em" }}>{f.title}</h5>
                  <p style={{ color: "#64748b", fontSize: "0.855rem", lineHeight: 1.65, marginBottom: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          4. AI FEATURES — Dark with Neon Glow
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="ai" className="pub-ai-section">
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="row g-5 align-items-center">
            {/* Left: tabs */}
            <div className="col-lg-5">
              <span className="pub-label-pill purple"><Brain size={12} /> Clinical AI Engine</span>
              <h2 className="pub-section-title" style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)", color: "#f1f5f9", marginBottom: "1rem" }}>
                Intelligence That{" "}
                <span className="pub-gradient-text-ai">Works While You Work</span>
              </h2>
              <p style={{ color: "#64748b", marginBottom: "2rem", lineHeight: 1.7, fontSize: "0.95rem" }}>
                Our AI runs as a background clinical analysis pipeline — automatically flagging risks, translating data, and drafting summaries so your team can focus on patients.
              </p>

              <div className="d-flex flex-column gap-2">
                {[
                  { id: "summary",   label: "AI Clinical Summary Card",         icon: <FileText size={15} /> },
                  { id: "diagnosis", label: "AI Differential Diagnosis Support", icon: <Brain size={15} /> },
                  { id: "medication",label: "AI Medication Safety Checks",       icon: <Shield size={15} /> },
                  { id: "lab",       label: "AI Lab Result Interpretation",      icon: <FlaskConical size={15} /> },
                  { id: "revenue",   label: "AI Revenue Integrity Insights",     icon: <TrendingUp size={15} /> },
                  { id: "operation", label: "AI Operational Recommendations",    icon: <Activity size={15} /> },
                ].map((tab) => (
                  <div
                    key={tab.id}
                    className={`ai-feature-tab ${activeAITab === tab.id ? "active" : ""}`}
                    onClick={() => setActiveAITab(tab.id)}
                  >
                    <div className="ai-tab-dot" />
                    <span style={{ color: "#64748b", flexShrink: 0 }}>{tab.icon}</span>
                    <h6 className="ai-tab-title mb-0">{tab.label}</h6>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: mockup */}
            <div className="col-lg-7">
              <div className="device-mockup">
                <div className="device-header">
                  <div className="device-dot red" /><div className="device-dot yellow" /><div className="device-dot green" />
                  <span style={{ color: "#475569", fontSize: "10px", marginLeft: "8px" }}>Clinical Advisory Dashboard</span>
                </div>
                <div className="device-screen p-4" style={{ minHeight: "380px" }}>
                  {/* AI Tab Content — unchanged from original */}
                  {activeAITab === "summary" && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="text-white fw-bold mb-0 d-flex align-items-center gap-2"><Sparkles size={16} style={{ color: "#a78bfa" }} className="animate-pulse-slow" /> Clinical Summary Card</h6>
                        <span style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", borderRadius: "99px", fontSize: "8px", padding: "2px 8px", fontWeight: 700 }}>CONFIDENCE: 98%</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "12px" }}>
                        <span style={{ color: "#475569", display: "block", fontSize: "8px", fontFamily: "monospace", marginBottom: "8px" }}>PATIENT PROFILE: MRN-YR-1002</span>
                        <p style={{ color: "#e2e8f0", fontSize: "12px", lineHeight: 1.6, marginBottom: "10px" }}>54-year-old male presenting with chest tightness, Stage 2 Hypertension history (4 years), and active asthma flare-ups.</p>
                        <hr style={{ borderColor: "rgba(255,255,255,0.06)" }} />
                        <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: "9px", display: "block", marginBottom: "8px" }}>INTELLIGENCE SUMMARY SUGGESTIONS</span>
                        <ul style={{ color: "#64748b", fontSize: "11px", lineHeight: 1.7, paddingLeft: "16px", marginBottom: 0 }}>
                          <li>Patient vitals verify Stage 2 Hypertension (BP 162/95 mmHg) and tachycardia (HR 92 bpm).</li>
                          <li>Allergy records flag severe sensitivity to ACE-inhibitors.</li>
                          <li>Warning: Avoid prescribing Lisinopril. Valsartan or Amlodipine recommended.</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {activeAITab === "diagnosis" && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="text-white fw-bold mb-0 d-flex align-items-center gap-2"><Brain size={16} style={{ color: "#a78bfa" }} /> Differential Diagnosis Support</h6>
                        <span style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", borderRadius: "99px", fontSize: "8px", padding: "2px 8px", fontWeight: 700 }}>CLINICAL ASSIST L1</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "12px" }}>
                        <span style={{ color: "#475569", display: "block", fontSize: "8px", fontFamily: "monospace", marginBottom: "8px" }}>SYMPTOM DESCRIPTIONS</span>
                        <p style={{ color: "#e2e8f0", fontSize: "12px", lineHeight: 1.6, marginBottom: "10px" }}>Productive cough (yellow sputum), high fever (39.1°C), dullness to percussion on right lung base.</p>
                        <hr style={{ borderColor: "rgba(255,255,255,0.06)" }} />
                        <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "9px", display: "block", marginBottom: "8px" }}>MATCHED DIFFERENTIAL DIAGNOSES</span>
                        <ol style={{ color: "#64748b", fontSize: "11px", lineHeight: 1.7, paddingLeft: "16px", marginBottom: 0 }}>
                          <li className="mb-2"><strong style={{ color: "#e2e8f0" }}>Lobar Pneumonia, Right Lung</strong> (Confidence: 87%) — Chest X-ray recommended.</li>
                          <li><strong style={{ color: "#e2e8f0" }}>Acute Bronchitis</strong> (Confidence: 45%) — Lacks focal percussion dullness.</li>
                        </ol>
                      </div>
                    </div>
                  )}
                  {activeAITab === "medication" && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="text-white fw-bold mb-0 d-flex align-items-center gap-2"><Lock size={16} style={{ color: "#f87171" }} /> Medication Safety Check</h6>
                        <span style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", borderRadius: "99px", fontSize: "8px", padding: "2px 8px", fontWeight: 700 }}>CRITICAL RISK</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "12px" }}>
                        <span style={{ color: "#475569", display: "block", fontSize: "8px", fontFamily: "monospace", marginBottom: "8px" }}>DRAFTED MEDICATIONS</span>
                        <div className="d-flex justify-content-between mb-2" style={{ color: "#e2e8f0", fontSize: "11px" }}>
                          <span>1. Erythromycin 500mg</span><span>2. Theophylline 200mg</span>
                        </div>
                        <hr style={{ borderColor: "rgba(255,255,255,0.06)" }} />
                        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "8px", marginBottom: "8px" }}>
                          <span style={{ color: "#f87171", fontWeight: 700, fontSize: "9px", display: "block", marginBottom: "4px" }}>INTERACTION RISK VERIFIED</span>
                          <p style={{ color: "#64748b", fontSize: "10px", lineHeight: 1.5, marginBottom: 0 }}>Erythromycin inhibits hepatic metabolism of Theophylline. Risk of toxicity (nausea, arrhythmia, seizure).</p>
                        </div>
                        <span style={{ color: "#10b981", fontWeight: 700, fontSize: "9px", display: "block", marginBottom: "4px" }}>RECOMMENDED ALTERNATIVE</span>
                        <p style={{ color: "#64748b", fontSize: "10px", marginBottom: 0 }}>Replace with Azithromycin to reduce theophylline interaction risk.</p>
                      </div>
                    </div>
                  )}
                  {activeAITab === "lab" && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="text-white fw-bold mb-0 d-flex align-items-center gap-2"><FlaskConical size={16} style={{ color: "#a78bfa" }} /> Lab Results Interpretation</h6>
                        <span style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", borderRadius: "99px", fontSize: "8px", padding: "2px 8px", fontWeight: 700 }}>ABNORMAL FLAGS</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "12px" }}>
                        <span style={{ color: "#475569", display: "block", fontSize: "8px", fontFamily: "monospace", marginBottom: "8px" }}>HEMATOLOGY CBC PANEL</span>
                        <div className="row g-2 mb-2 text-center">
                          {[{ label: "WBC COUNT", value: "14.8 K/uL", danger: true }, { label: "HEMOGLOBIN", value: "13.5 g/dL", danger: false }, { label: "NEUTROPHILS", value: "82%", danger: true }].map((t, i) => (
                            <div key={i} className="col-4">
                              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "6px" }}>
                                <span style={{ display: "block", fontSize: "7px", color: "#475569", marginBottom: "3px" }}>{t.label}</span>
                                <strong style={{ fontSize: "11px", color: t.danger ? "#f87171" : "#e2e8f0" }}>{t.value}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                        <hr style={{ borderColor: "rgba(255,255,255,0.06)" }} />
                        <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: "9px", display: "block", marginBottom: "4px" }}>INTERPRETATION</span>
                        <p style={{ color: "#64748b", fontSize: "10px", lineHeight: 1.6, marginBottom: 0 }}>Leukocytosis + neutrophilia (82%) indicates active bacterial infection. Clinical antibiotic management recommended.</p>
                      </div>
                    </div>
                  )}
                  {activeAITab === "revenue" && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="text-white fw-bold mb-0 d-flex align-items-center gap-2"><TrendingUp size={16} style={{ color: "#10b981" }} /> Revenue Integrity Advisory</h6>
                        <span style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", borderRadius: "99px", fontSize: "8px", padding: "2px 8px", fontWeight: 700 }}>FINANCIAL AUDIT</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "12px" }}>
                        <p style={{ color: "#e2e8f0", fontSize: "12px", lineHeight: 1.6, marginBottom: "10px" }}>Unbilled consultation orders detected: 14 visits locked in DoctorConsult queues without cashier invoices.</p>
                        <hr style={{ borderColor: "rgba(255,255,255,0.06)" }} />
                        <span style={{ color: "#10b981", fontWeight: 700, fontSize: "9px", display: "block", marginBottom: "8px" }}>REVENUE OPTIMIZATION IDEAS</span>
                        <ul style={{ color: "#64748b", fontSize: "11px", lineHeight: 1.7, paddingLeft: "16px", marginBottom: 0 }}>
                          <li>Enforce prepayment gate for lab processing to reduce unpaid collection slips.</li>
                          <li>8% drop in prescription checkout — check Amoxicillin, Cetirizine stock.</li>
                          <li>Projection: resolving stock-outs can lift pharmacy revenue by 12% this month.</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {activeAITab === "operation" && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="text-white fw-bold mb-0 d-flex align-items-center gap-2"><Activity size={16} style={{ color: "#a78bfa" }} /> Operational Recommendations</h6>
                        <span style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", borderRadius: "99px", fontSize: "8px", padding: "2px 8px", fontWeight: 700 }}>OPERATIONAL</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "12px" }}>
                        <p style={{ color: "#e2e8f0", fontSize: "12px", lineHeight: 1.6, marginBottom: "10px" }}>Average patient journey: 64 minutes. Lab reports bottlenecked at collection points.</p>
                        <hr style={{ borderColor: "rgba(255,255,255,0.06)" }} />
                        <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: "9px", display: "block", marginBottom: "8px" }}>SYSTEM CORRECTIONS</span>
                        <ul style={{ color: "#64748b", fontSize: "11px", lineHeight: 1.7, paddingLeft: "16px", marginBottom: 0 }}>
                          <li>Reallocate 1 triage nurse to lab reception between 10 AM – 1 PM (peak hours).</li>
                          <li>Reduce consult write time using Gemini Voice-to-Text note summaries.</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          5. WORKFLOW TIMELINE — Light mesh gradient
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="workflow" className="pub-workflow-section">
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center mb-5">
            <span className="pub-label-pill light"><Activity size={12} /> Patient Lifecycle</span>
            <h2 className="pub-section-title" style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)", color: "#0f172a", marginBottom: "1rem" }}>
              Interactive Clinical Timeline
            </h2>
            <p className="pub-section-subtitle text-secondary">
              Click through the steps of the patient journey to see how departments coordinate in real time.
            </p>
          </div>
          <WorkflowTimeline />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          6. DASHBOARD SHOWCASE — Dark SaaS
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="dashboards" className="pub-dashboard-section">
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center mb-5">
            <span className="pub-label-pill dark"><Laptop size={12} /> Workspace Demos</span>
            <h2 className="pub-section-title" style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)", color: "#f1f5f9", marginBottom: "1rem" }}>
              Role-Based Dashboard Showcase
            </h2>
            <p style={{ color: "#F1F2F9", maxWidth: "580px", margin: "0 auto", fontSize: "1rem", lineHeight: 1.7 }}>
              Explore simulated workspace portals tailored to each operational role in the clinic.
            </p>
          </div>

          <div className="row justify-content-center mb-4">
            <div className="col-lg-10">
              <div className="demo-tabs">
                {["admin", "doctor", "lab", "pharmacy", "cashier"].map((tab) => (
                  <button
                    key={tab}
                    className={`demo-tab-btn ${activeDashboardTab === tab ? "active" : ""}`}
                    onClick={() => setActiveDashboardTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} {tab === "lab" ? "Dashboard" : tab === "admin" ? "Dashboard" : "Dashboard"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="device-mockup">
                <div className="device-header">
                  <div className="device-dot red" /><div className="device-dot yellow" /><div className="device-dot green" />
                  <span style={{ color: "#475569", fontSize: "10px", marginLeft: "8px", textTransform: "capitalize" }}>
                    {activeDashboardTab} Workspace — Live View
                  </span>
                </div>
                <div className="device-screen" style={{ minHeight: "400px" }}>
                  {activeDashboardTab === "admin" && (
                    <div className="mock-dashboard-wrapper h-100">
                      <div className="mock-topbar"><span className="fw-bold text-white">System Admin Control</span><div className="d-flex gap-2"><span className="badge bg-success py-1 px-2">SYS ONLINE</span></div></div>
                      <div className="d-flex flex-row flex-grow-1">
                        <div className="mock-sidebar"><div className="mock-nav-item active"><Laptop size={14} /></div><div className="mock-nav-item"><Users size={14} /></div><div className="mock-nav-item"><FileText size={14} /></div></div>
                        <div className="mock-content-body">
                          <div className="mock-stat-grid">
                            {[{ l: "Tenant Clinics", v: "12 active" }, { l: "Logged Staff", v: "54 online" }, { l: "DB Operations", v: "99.98% OK" }].map((s, i) => (
                              <div key={i} className="mock-stat-card"><span style={{ color: "#475569", fontSize: "8px" }}>{s.l}</span><strong style={{ color: "#e2e8f0", fontSize: "14px", marginTop: "4px" }}>{s.v}</strong></div>
                            ))}
                          </div>
                          <div className="mock-chart-container mt-2">
                            <span style={{ color: "#e2e8f0", fontSize: "9px", fontWeight: 700, display: "block", marginBottom: "8px" }}>Clinic Volume Metrics (Last 6 Months)</span>
                            <div className="d-flex align-items-end justify-content-between px-3" style={{ flex: 1, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              {[35, 60, 45, 90, 80, 110].map((h, i) => (
                                <div key={i} style={{ width: "35px", height: `${h * 0.7}px`, background: "linear-gradient(to top, #2563eb, #60a5fa)", borderRadius: "3px 3px 0 0" }}>
                                  <span style={{ color: "#475569", display: "block", textAlign: "center", fontSize: "7px", transform: "translateY(-12px)" }}>{h * 10}</span>
                                </div>
                              ))}
                            </div>
                            <div className="d-flex justify-content-between pt-1" style={{ color: "#374151", fontSize: "8px" }}>
                              {["Jan","Feb","Mar","Apr","May","Jun"].map(m => <span key={m}>{m}</span>)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeDashboardTab === "doctor" && (
                    <div className="mock-dashboard-wrapper h-100">
                      <div className="mock-topbar"><span className="fw-bold text-white">Physician Consultation Workspace</span><span style={{ color: "#475569" }}>Dr. Samuel Alene (Internal Med)</span></div>
                      <div className="d-flex flex-row flex-grow-1">
                        <div className="mock-sidebar"><div className="mock-nav-item active"><Stethoscope size={14} /></div><div className="mock-nav-item"><Users size={14} /></div><div className="mock-nav-item"><Calendar size={14} /></div></div>
                        <div className="mock-content-body">
                          <div className="row g-2 flex-grow-1">
                            <div className="col-4" style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                              <span style={{ color: "#e2e8f0", fontSize: "9px", fontWeight: 700, display: "block", marginBottom: "8px" }}>Consultation Queue</span>
                              {[{ n: "Abebe Kebede", d: "Male, 43yr - BP High", s: "WAITING", c: "#f59e0b" }, { n: "Tigist Chala", d: "Female, 28yr", s: "WAITING", c: "#f59e0b" }, { n: "Meron Selam", d: "Female, 31yr", s: "DONE", c: "#10b981" }].map((p, i) => (
                                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "6px", marginBottom: "4px", opacity: p.s === "DONE" ? 0.5 : 1 }}>
                                  <strong style={{ display: "block", color: "#e2e8f0", fontSize: "8px" }}>{p.n}</strong>
                                  <span style={{ color: "#475569", fontSize: "7px" }}>{p.d}</span>
                                  <span style={{ display: "block", marginTop: "3px", fontSize: "6px", color: p.c, fontWeight: 700 }}>{p.s}</span>
                                </div>
                              ))}
                            </div>
                            <div className="col-8 d-flex flex-column gap-2">
                              <span style={{ color: "#e2e8f0", fontSize: "9px", fontWeight: 700 }}>Active Patient: Abebe Kebede</span>
                              {[{ l: "VITAL SIGNS", v: "BP: 148/92 mmHg · Temp: 37.2°C · Weight: 78kg" }, { l: "CLINICAL NOTES", v: "Chest heaviness for 3 days. Occasional headaches. Family history of CAD." }].map((r, i) => (
                                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "8px" }}>
                                  <strong style={{ display: "block", color: "#475569", fontSize: "7px", marginBottom: "4px" }}>{r.l}</strong>
                                  <p style={{ color: "#e2e8f0", fontSize: "8px", lineHeight: 1.5, marginBottom: 0 }}>{r.v}</p>
                                </div>
                              ))}
                              <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "6px", padding: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                                <div className="d-flex align-items-center gap-2">
                                  <Brain size={12} style={{ color: "#a78bfa" }} className="animate-pulse-slow" />
                                  <span style={{ color: "#e2e8f0", fontSize: "8px" }}>Gemini Diagnostic support available</span>
                                </div>
                                <span style={{ background: "#8b5cf6", color: "#fff", borderRadius: "4px", fontSize: "6px", padding: "2px 6px", cursor: "pointer" }}>VIEW SUMMARY</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeDashboardTab === "lab" && (
                    <div className="mock-dashboard-wrapper h-100">
                      <div className="mock-topbar"><span className="fw-bold text-white">Laboratory Information Desk (LIS)</span><span style={{ color: "#475569" }}>Bole Lab Workstation</span></div>
                      <div className="d-flex flex-row flex-grow-1">
                        <div className="mock-sidebar"><div className="mock-nav-item active"><FlaskConical size={14} /></div><div className="mock-nav-item"><Users size={14} /></div></div>
                        <div className="mock-content-body">
                          <span style={{ color: "#e2e8f0", fontSize: "9px", fontWeight: 700, display: "block", marginBottom: "8px" }}>Pending Laboratory Tests Queue</span>
                          <table className="table table-dark table-sm border-0" style={{ fontSize: "8px" }}>
                            <thead><tr style={{ color: "#475569", borderBottom: "1px solid rgba(255,255,255,0.05)" }}><th>MRN</th><th>Patient</th><th>Test</th><th>Payment</th><th>Action</th></tr></thead>
                            <tbody>
                              {[{ mrn: "MRN-2026-081", name: "Abebe Kebede", test: "Lipid Profile", status: "PAID", btn: "COLLECT", btnColor: "#2563eb" }, { mrn: "MRN-2026-094", name: "Tigist Chala", test: "Urinalysis", status: "PAID", btn: "ENTER RESULTS", btnColor: "#f59e0b" }].map((r, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", color: "#e2e8f0" }}>
                                  <td>{r.mrn}</td><td>{r.name}</td><td>{r.test}</td>
                                  <td><span style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", borderRadius: "99px", fontSize: "6px", padding: "1px 6px", fontWeight: 700 }}>{r.status}</span></td>
                                  <td><button style={{ background: r.btnColor, color: "#fff", border: "none", borderRadius: "4px", fontSize: "7px", padding: "2px 6px", fontWeight: 700 }}>{r.btn}</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeDashboardTab === "pharmacy" && (
                    <div className="mock-dashboard-wrapper h-100">
                      <div className="mock-topbar">
                        <span className="fw-bold text-white">Pharmacy Dispensing & Inventory</span>
                        <div className="d-flex align-items-center gap-2"><AlertTriangle size={12} style={{ color: "#f59e0b" }} /><span style={{ color: "#f59e0b", fontSize: "8px" }}>2 LOW STOCK WARNINGS</span></div>
                      </div>
                      <div className="d-flex flex-row flex-grow-1">
                        <div className="mock-sidebar"><div className="mock-nav-item active"><Pill size={14} /></div><div className="mock-nav-item"><Users size={14} /></div></div>
                        <div className="mock-content-body">
                          <div className="row g-2 flex-grow-1">
                            <div className="col-7" style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                              <span style={{ color: "#e2e8f0", fontSize: "9px", fontWeight: 700, display: "block", marginBottom: "8px" }}>Pending Prescriptions</span>
                              {[{ name: "Abebe Kebede", med: "Amlodipine 5mg - Daily · 30 caps", s: "PAID · DISPENSE", sc: "#10b981", op: 1 }, { name: "Tigist Chala", med: "Amoxicillin 500mg - 3x daily · 21 caps", s: "WAITING BILLING", sc: "#f59e0b", op: 0.5 }].map((p, i) => (
                                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "8px", marginBottom: "6px", opacity: p.op, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div><strong style={{ display: "block", color: "#e2e8f0", fontSize: "8px" }}>{p.name}</strong><span style={{ color: "#475569", fontSize: "7px" }}>{p.med}</span></div>
                                  <span style={{ color: p.sc, fontSize: "6px", fontWeight: 700 }}>{p.s}</span>
                                </div>
                              ))}
                            </div>
                            <div className="col-5">
                              <span style={{ color: "#e2e8f0", fontSize: "9px", fontWeight: 700, display: "block", marginBottom: "8px" }}>Low Stock Alerts</span>
                              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", padding: "8px", marginBottom: "6px" }}>
                                <div style={{ color: "#f87171", fontSize: "8px", fontWeight: 700, display: "flex", justifyContent: "space-between" }}><span>Salbutamol Inhaler</span><span>Qty: 4</span></div>
                                <span style={{ color: "#475569", fontSize: "7px" }}>Restock threshold reached (Min: 10)</span>
                              </div>
                              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "6px", padding: "8px" }}>
                                <div style={{ color: "#f59e0b", fontSize: "8px", fontWeight: 700, display: "flex", justifyContent: "space-between" }}><span>Amlodipine 5mg</span><span>Qty: 180</span></div>
                                <span style={{ color: "#475569", fontSize: "7px" }}>Expiry batch warnings on Lot #B2026</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeDashboardTab === "cashier" && (
                    <div className="mock-dashboard-wrapper h-100">
                      <div className="mock-topbar"><span className="fw-bold text-white">Cashier Receipting Desk</span><span style={{ color: "#10b981" }}>Register #01 Balance: 18,450 ETB</span></div>
                      <div className="d-flex flex-row flex-grow-1">
                        <div className="mock-sidebar"><div className="mock-nav-item active"><Banknote size={14} /></div><div className="mock-nav-item"><FileText size={14} /></div></div>
                        <div className="mock-content-body">
                          <span style={{ color: "#e2e8f0", fontSize: "9px", fontWeight: 700, display: "block", marginBottom: "8px" }}>Active Invoices Ledger</span>
                          <table className="table table-dark table-sm border-0" style={{ fontSize: "8px" }}>
                            <thead><tr style={{ color: "#475569", borderBottom: "1px solid rgba(255,255,255,0.05)" }}><th>Invoice ID</th><th>Patient</th><th>Item</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody>
                              {[{ id: "INV-2026-102", name: "Abebe Kebede", item: "OPD + Amlodipine", total: "380 ETB", s: "PAID", sc: "#10b981", btn: "PRINT SLIP", bc: "transparent", btc: "#e2e8f0" }, { id: "INV-2026-103", name: "Tigist Chala", item: "Urinalysis Test", total: "150 ETB", s: "UNPAID", sc: "#f87171", btn: "RECEIVE CASH", bc: "#10b981", btc: "#fff" }].map((r, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", color: "#e2e8f0" }}>
                                  <td>{r.id}</td><td>{r.name}</td><td>{r.item}</td><td>{r.total}</td>
                                  <td><span style={{ color: r.sc, fontSize: "6px", fontWeight: 700 }}>{r.s}</span></td>
                                  <td><button style={{ background: r.bc, border: `1px solid rgba(255,255,255,0.15)`, color: r.btc, borderRadius: "4px", fontSize: "7px", padding: "2px 6px", fontWeight: 700, cursor: "pointer" }}>{r.btn}</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          7. SERVICES — Soft gradient background
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="services" className="pub-services-section">
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center mb-5">
            <span className="pub-label-pill light"><HeartPulse size={12} /> Clinic Departments</span>
            <h2 className="pub-section-title" style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)", color: "#0f172a", marginBottom: "1rem" }}>
              Enterprise Healthcare Services
            </h2>
            <p className="pub-section-subtitle text-secondary">
              Our platform coordinates the entire patient journey across every service sector with precision and transparency.
            </p>
          </div>
          <div className="row g-4">
            {[
              { icon: <Stethoscope size={28} />, title: "General OPD", desc: "Triage vitals registry, symptom logging, diagnostic codes, and referral forms.", color: "#2563eb", bg: "linear-gradient(135deg, rgba(37,99,235,0.1), rgba(37,99,235,0.05))" },
              { icon: <FlaskConical size={28} />, title: "Laboratory Services", desc: "Hematology, urinalysis, biochemistry test grids, and signed digital reports.", color: "#8b5cf6", bg: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))" },
              { icon: <Pill size={28} />, title: "Pharmacy & Inventory", desc: "Prescription dispensing, batch expiry logs, and automated inventory depletion.", color: "#06b6d4", bg: "linear-gradient(135deg, rgba(6,182,212,0.1), rgba(6,182,212,0.05))" },
              { icon: <HeartPulse size={28} />, title: "Maternal Health ANC", desc: "Antenatal checkup schedules, fetal heart logs, and midwifery consultation records.", color: "#ec4899", bg: "linear-gradient(135deg, rgba(236,72,153,0.1), rgba(236,72,153,0.05))" },
              { icon: <CalendarRange size={28} />, title: "Vaccination Logs", desc: "Standard immunization calendars, dose calculations, and batch lot tracking.", color: "#10b981", bg: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))" },
              { icon: <ShieldAlert size={28} />, title: "Chronic Disease Tracking", desc: "Condition tracking files, diabetic vitals graphs, and cardiac follow-up records.", color: "#f59e0b", bg: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))" },
            ].map((s, i) => (
              <div key={i} className="col-lg-4 col-md-6">
                <div className="service-premium-card">
                  <div className="service-icon-wrap" style={{ background: s.bg, color: s.color }}>
                    {s.icon}
                  </div>
                  <h5 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "#0f172a", marginBottom: "0.65rem", letterSpacing: "-0.01em" }}>{s.title}</h5>
                  <p style={{ color: "#64748b", fontSize: "0.865rem", lineHeight: 1.65, marginBottom: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          8. TECHNOLOGY STACK — Glassmorphism on gradient
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="pub-tech-section">
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center mb-5">
            <span className="pub-label-pill light"><Cpu size={12} /> Specifications</span>
            <h2 className="pub-section-title" style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)", color: "#0f172a", marginBottom: "1rem" }}>
              Technology Stack
            </h2>
            <p className="pub-section-subtitle text-secondary">
              Engineered for clinical-grade security, sub-50ms response latency, and predictive decision intelligence.
            </p>
          </div>
          <div className="row g-4 justify-content-center">
            {[
              { icon: <Cpu size={30} />, title: "React + Vite SPA", desc: "High-speed frontend rendering with optimized bundles and code splitting.", color: "#2563eb", bg: "rgba(37,99,235,0.09)" },
              { icon: <Server size={30} />, title: "Node.js Express", desc: "Async backend executing REST requests in a non-blocking event loop.", color: "#10b981", bg: "rgba(16,185,129,0.09)" },
              { icon: <Zap size={30} />, title: "Gemini AI Engine", desc: "LLM clinical assistant generating diagnoses, differentials, and safety checks.", color: "#f59e0b", bg: "rgba(245,158,11,0.09)" },
              { icon: <Lock size={30} />, title: "JWT + RBAC Auth", desc: "Encrypted token keys governing role access across all clinical departments.", color: "#ef4444", bg: "rgba(239,68,68,0.09)" },
              { icon: <BarChart4 size={30} />, title: "MySQL Relational DB", desc: "Strict schema tracking patient records, invoices, and inventory lifecycle.", color: "#06b6d4", bg: "rgba(6,182,212,0.09)" },
            ].map((t, i) => (
              <div key={i} className="col-lg col-md-4 col-sm-6">
                <div className="tech-glass-card">
                  <div className="tech-icon-ring" style={{ background: t.bg, color: t.color }}>
                    {t.icon}
                  </div>
                  <h6 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>{t.title}</h6>
                  <p style={{ color: "#64748b", fontSize: "0.78rem", lineHeight: 1.55, marginBottom: 0 }}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          9. PORTFOLIO / ARCHITECTURE — Premium gradient + stats
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="pub-portfolio-section">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <span className="pub-label-pill purple"><Award size={12} /> Technical Design</span>
              <h2 className="pub-section-title" style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)", color: "#0f172a", marginBottom: "1.25rem" }}>
                Architecture Built for{" "}
                <span className="pub-gradient-text-dark">Enterprise Scale</span>
              </h2>
              <p style={{ color: "#64748b", lineHeight: 1.75, marginBottom: "2rem" }}>
                The MediCare AI architecture resolves multi-tenant isolation and clinical latency bottlenecks by segregating the SPA presentation layer from the Express transaction API.
              </p>
              <div className="d-flex flex-column gap-4">
                {[
                  { icon: <Server size={20} />, title: "Shared-Schema Multi-Tenancy", body: "Enforces clinical data isolation globally using custom middleware Tenant Resolvers linked to schema namespaces.", color: "#2563eb" },
                  { icon: <CheckSquare size={20} />, title: "Queue-Based Event Lifecycle", body: "Patient visits shift between states (Triage → Consult → Lab → Dispense) in atomic transactions, eliminating queue drifts.", color: "#8b5cf6" },
                  { icon: <Globe size={20} />, title: "Real-Time Sync Architecture", body: "Clinical data propagates across roles instantly — the pharmacist sees the prescription the moment the doctor saves it.", color: "#06b6d4" },
                ].map((item, i) => (
                  <div key={i} className="d-flex gap-3">
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `rgba(${item.color === "#2563eb" ? "37,99,235" : item.color === "#8b5cf6" ? "139,92,246" : "6,182,212"},0.1)`, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <h6 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "#0f172a", marginBottom: "0.3rem" }}>{item.title}</h6>
                      <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.65, marginBottom: 0 }}>{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-6">
              <div className="pub-stats-card">
                <h4 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, color: "#0f172a", marginBottom: "1.75rem", textAlign: "center", letterSpacing: "-0.03em" }}>Platform Performance</h4>
                <div className="row g-4">
                  {[
                    { value: "15000", suffix: "+", label: "Patients Served", border: "border-end border-bottom" },
                    { value: "50", suffix: "+", label: "Staff Personnel", border: "border-bottom" },
                    { value: "99", suffix: "%", label: "Cloud Uptime", border: "border-end" },
                    { value: "1000000", suffix: "+", label: "Records Audited", border: "" },
                  ].map((s, i) => (
                    <div key={i} className={`col-6`}>
                      <div className={`stat-box py-3 ${s.border} border-light`}>
                        <div className="stat-number"><Counter target={s.value} suffix={s.suffix} /></div>
                        <span style={{ color: "#64748b", fontSize: "0.82rem", fontWeight: 500 }}>{s.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          10. TESTIMONIALS — Light floating cards
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="pub-testimonials-section">
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center mb-5">
            <span className="pub-label-pill purple"><Star size={12} /> User Stories</span>
            <h2 className="pub-section-title" style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)", color: "#0f172a", marginBottom: "1rem" }}>
              Clinical Testimonials
            </h2>
            <p className="pub-section-subtitle text-secondary">
              Read what doctors and clinic directors say about the impact of MediCare AI on their practice.
            </p>
          </div>
          <div className="row g-4">
            {[
              {
                stars: 5,
                text: "MediCare AI has completely streamlined our clinic's patient journey. Patients no longer walk to the doctor with paper forms, and lab reports populate inside the consultation interface in minutes. The Gemini summary saves me valuable time during busy shifts.",
                name: "Dr. Dawit Alene",
                role: "Lead General Practitioner, Bole Health Clinic",
                initials: "DA",
                color: "#2563eb",
              },
              {
                stars: 5,
                text: "As a clinic admin, billing and drug inventory were a constant headache. Now, medication quantities automatically deplete upon cashier checkout. The system is extremely secure, and we've observed a 35% reduction in patient waiting room times.",
                name: "Marta Selam",
                role: "Clinic Operations Director, Selam Specialty Center",
                initials: "MS",
                color: "#8b5cf6",
              },
            ].map((t, i) => (
              <div key={i} className="col-md-6">
                <div className="testimonial-float-card">
                  <div className="d-flex gap-1 mb-4">
                    {[...Array(t.stars)].map((_, j) => (
                      <Star key={j} size={16} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>
                  <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.75, marginBottom: "1.5rem", fontStyle: "italic" }}>
                    "{t.text}"
                  </p>
                  <div className="d-flex align-items-center gap-3 mt-auto">
                    <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: `linear-gradient(135deg, ${t.color}, ${t.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>
                      {t.initials}
                    </div>
                    <div>
                      <h6 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>{t.name}</h6>
                      <span style={{ color: "#64748b", fontSize: "0.78rem" }}>{t.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          11. CONTACT — Dark elegant glassmorphism
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="contact" className="pub-contact-section">
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="row g-5 align-items-start">
            {/* Left: info */}
            <div className="col-lg-5">
              <span className="pub-label-pill dark"><Send size={12} /> Connect</span>
              <h2 className="pub-section-title" style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)", color: "#f1f5f9", marginBottom: "1rem" }}>
                Request a{" "}
                <span className="pub-gradient-text">Live Demo</span>
              </h2>
              <p style={{ color: "#475569", lineHeight: 1.75, marginBottom: "2.5rem", fontSize: "0.95rem" }}>
                Want to see the system in action or set up a trial account for your clinic? Our team will walk you through a personalized demo tailored to your practice size.
              </p>

              {/* Info cards */}
              <div className="d-flex flex-column gap-3 mb-4">
                {[
                  { icon: <MapPin size={20} />, label: "Office Location", value: "Bole District, Behind Friendship Mall, Addis Ababa, Ethiopia", color: "#2563eb" },
                  { icon: <Phone size={20} />, label: "Phone", value: "+251 116 673 892 · Mon–Sat: 8 AM – 8 PM", color: "#8b5cf6" },
                  { icon: <Mail size={20} />, label: "Email", value: "support@medicare-ai.et", color: "#06b6d4" },
                ].map((item, i) => (
                  <div key={i} className="pub-contact-info-card">
                    <div className="pub-contact-icon" style={{ background: `rgba(${item.color === "#2563eb" ? "37,99,235" : item.color === "#8b5cf6" ? "139,92,246" : "6,182,212"},0.12)`, color: item.color }}>
                      {item.icon}
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#475569", marginBottom: "2px" }}>{item.label}</span>
                      <span style={{ color: "#94a3b8", fontSize: "0.855rem" }}>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust badges */}
              <div className="d-flex gap-3 flex-wrap">
                <span className="hipaa-badge-container"><Shield size={11} /> HIPAA Compliant</span>
                <span className="secure-badge-container"><Lock size={11} /> 256-bit Encryption</span>
              </div>
            </div>

            {/* Right: form */}
            <div className="col-lg-7">
              <div className="pub-contact-form-card">
                <h4 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.4rem", letterSpacing: "-0.03em" }}>
                  Request Consultation
                </h4>
                <p style={{ color: "#475569", fontSize: "0.875rem", marginBottom: "1.75rem" }}>
                  Provide details about your healthcare practice and we'll follow up within 24 hours.
                </p>

                {success && (
                  <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "10px", padding: "12px 16px", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "10px" }}>
                    <CheckCircle2 size={18} style={{ color: "#10b981" }} />
                    <span style={{ color: "#10b981", fontSize: "0.875rem", fontWeight: 600 }}>Request received! Our team will follow up shortly.</span>
                  </div>
                )}

                <form onSubmit={handleContactSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <input type="text" name="name" value={form.name} onChange={handleInputChange} className="form-control" placeholder="Your Full Name" required />
                    </div>
                    <div className="col-md-6">
                      <input type="email" name="email" value={form.email} onChange={handleInputChange} className="form-control" placeholder="Your Email Address" required />
                    </div>
                    <div className="col-12">
                      <input type="text" name="subject" value={form.subject} onChange={handleInputChange} className="form-control" placeholder="Clinic Name / Department" required />
                    </div>
                    <div className="col-12">
                      <textarea name="message" value={form.message} onChange={handleInputChange} className="form-control" rows="4" placeholder="Tell us about your clinic size, departments, and specific challenges..." required />
                    </div>
                    <div className="col-12">
                      <button
                        
                        
                        type="submit"
                        disabled={submitting}
                        className="btn  d-inline-flex align-items-center justify-content-center gap-2 w-100"
                        style={{
                                background:
                            "linear-gradient(135deg, TEAL, #06b6d4)",
                          color: 'white',
                          padding: "0.8rem 2rem", fontWeight: 700, fontSize: "0.95rem", borderRadius: "10px", boxShadow: "0 8px 24px rgba(37,99,235,0.3)"
                        }}
                      >
                        {submitting ? (
                          <span className="spinner-border spinner-border-sm" role="status" />
                        ) : (
                          <><span>Submit Request</span><ChevronRight size={18} /></>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          FOOTER — Deep Navy / Black Gradient
      ════════════════════════════════════════════════════════════════════════ */}
      <footer className="pub-footer">
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="row g-4 mb-4 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #2563eb, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(37,99,235,0.4)" }}>
                  <HeartPulse size={18} color="#fff" />
                </div>
                <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "1.15rem", background: "linear-gradient(90deg, #fff, #93c5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>MediCare AI</span>
              </div>
              <p style={{ color: "#334155", fontSize: "0.855rem", lineHeight: 1.7, maxWidth: "300px" }}>
                The intelligent clinic management platform built for modern Ethiopian healthcare practices.
              </p>
              <div className="d-flex gap-2 mt-3">
                <span className="hipaa-badge-container"><Shield size={10} /> HIPAA</span>
                <span className="secure-badge-container"><Lock size={10} /> SSL</span>
              </div>
            </div>

            <div className="col-lg-2 col-6">
              <h6 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Platform</h6>
              {["Features", "AI Engine", "Services", "Dashboard", "Workflow"].map(l => (
                <button key={l} onClick={() => handleScrollToSection(l.toLowerCase())} style={{ display: "block", background: "none", border: "none", color: "#334155", fontSize: "0.855rem", padding: "3px 0", cursor: "pointer", transition: "color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = "#93c5fd"}
                  onMouseLeave={e => e.target.style.color = "#334155"}
                >{l}</button>
              ))}
            </div>

            <div className="col-lg-2 col-6">
              <h6 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Company</h6>
              {["About", "Contact", "Staff Login", "Request Demo"].map(l => (
                <div key={l} style={{ display: "block", color: "#334155", fontSize: "0.855rem", padding: "3px 0" }}>{l}</div>
              ))}
            </div>

            <div className="col-lg-4">
              <h6 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Stay Updated</h6>
              <p style={{ color: "#334155", fontSize: "0.82rem", marginBottom: "1rem" }}>Get product updates and healthcare insights delivered monthly.</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="email" placeholder="your@email.com" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "8px 14px", color: "#e2e8f0", fontSize: "0.855rem", outline: "none" }} />
                <button style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)", border: "none", borderRadius: "8px", padding: "8px 16px", color: "#fff", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>Subscribe</button>
              </div>
            </div>
          </div>

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <p style={{ color: "#1e293b", fontSize: "0.78rem", margin: 0 }}>
              © {new Date().getFullYear()} MediCare AI Inc. — Bole District, Addis Ababa, Ethiopia.
            </p>
            <div className="d-flex gap-4">
              {["Privacy Policy", "Terms of Service", "Security"].map(l => (
                <span key={l} style={{ color: "#1e293b", fontSize: "0.78rem", cursor: "pointer" }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
