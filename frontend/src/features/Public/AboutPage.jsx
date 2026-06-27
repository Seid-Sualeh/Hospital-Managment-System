import React from "react";
import { Link } from "react-router-dom";
import { Shield, Sparkles, Heart, Users, Activity, CheckCircle2, ArrowRight } from "lucide-react";

const AboutPage = () => {
  return (
    <div style={{ paddingTop: "6rem" }}>
      {/* Page Header */}
      <section className="bg-light py-5 border-bottom border-light">
        <div className="container text-center">
          <span className="badge bg-primary-soft text-primary mb-2 px-3 py-2 rounded-pill fw-semibold">
            WHO WE ARE
          </span>
          <h1 className="fw-bold display-5 public-display-font text-dark mb-3">
            About MediCare AI
          </h1>
          <p
            className="text-secondary mx-auto mb-0 lead"
            style={{ maxWidth: "700px" }}
          >
            Pioneering digital health integration, clinical assistant
            intelligence, and financial transparency across private healthcare
            facilities in Ethiopia.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-5">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <span className="badge bg-purple-soft text-purple mb-2 px-3 py-2 rounded-pill fw-semibold">
                OUR MISSION
              </span>
              <h2 className="fw-bold public-display-font text-dark mb-4">
                Transforming Care with Intelligent Automation
              </h2>
              <p className="text-secondary mb-4" style={{ lineHeight: "1.7" }}>
                MediCare AI was founded with a singular focus: to solve the
                operational bottlenecks and communication gaps in private
                clinics. Private clinics in Ethiopia process thousands of
                patient visits daily, but paper-based tracking, lack of
                integration between consultations and labs, and pharmacy stock
                outs delay vital care.
              </p>
              <p className="text-secondary mb-4" style={{ lineHeight: "1.7" }}>
                Our unified dashboard solves this by creating a real-time,
                role-based pipeline. When a receptionist registers a patient,
                the consultation files update instantly. When lab results are
                approved, the doctor receives a notification with Gemini AI
                summaries. We build technology that saves time, saves money, and
                ultimately, saves lives.
              </p>
            </div>
            <div className="col-lg-6">
              <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.05)" }}>
                <img
                  src="/clinic_team_about.png"
                  alt="Modern Healthcare Team"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Philosophy Section */}
      <section className="py-5 bg-white border-top border-light">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-5">
              <span className="badge bg-teal-soft text-teal mb-2 px-3 py-2 rounded-pill fw-semibold">
                CORE PHILOSOPHY
              </span>
              <h3 className="fw-bold public-display-font text-dark mb-3">
                How We Approach Medical Software
              </h3>
              <p className="text-secondary mb-0" style={{ lineHeight: "1.7" }}>
                We believe healthcare systems should serve clinicians, not the other way around. Every screen, state transition, and API endpoint in Medicare AI is designed to match actual clinical movements.
              </p>
            </div>
            <div className="col-lg-7">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="p-4 rounded-4" style={{ background: "#f8fafc", borderLeft: "4px solid var(--pub-primary)" }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="text-primary"><CheckCircle2 size={16} /></span>
                      <h6 className="fw-bold text-dark mb-0">Integrity & Confidentiality</h6>
                    </div>
                    <p className="text-secondary small mb-0">Patient health records are encrypted and protected with enterprise-grade authorization layers.</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-4 rounded-4" style={{ background: "#f8fafc", borderLeft: "4px solid #8b5cf6" }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="text-purple"><Sparkles size={16} /></span>
                      <h6 className="fw-bold text-dark mb-0">AI-Assisted Precision</h6>
                    </div>
                    <p className="text-secondary small mb-0">Using LLMs (Gemini) not to replace doctors, but to enrich their decision-making with diagnostic insights.</p>
                  </div>
                </div>
                <div className="col-12">
                  <div className="p-4 rounded-4" style={{ background: "#f8fafc", borderLeft: "4px solid #0d9488" }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="text-teal"><Activity size={16} /></span>
                      <h6 className="fw-bold text-dark mb-0">Workflow-First Design</h6>
                    </div>
                    <p className="text-secondary small mb-0">Built around the natural movement of patients through triage, billing, consults, testing, and pharmacy dispensing.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Card Grid */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold display-6 public-display-font text-dark">
              Our Values
            </h2>
            <p className="text-secondary">
              The principles that drive our product development and client
              relations.
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 p-4 border-0 shadow-sm rounded-4">
                <div className="feature-icon-wrapper bg-primary-soft mb-3">
                  <Shield size={24} />
                </div>
                <h5 className="fw-bold public-display-font text-dark">
                  Trustworthy Systems
                </h5>
                <p className="text-secondary small mb-0">
                  99% system uptime coupled with robust JWT security. We
                  guarantee that patient clinical files remain secure and
                  available to authorized clinicians at all times.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 p-4 border-0 shadow-sm rounded-4">
                <div className="feature-icon-wrapper bg-purple-soft mb-3">
                  <Sparkles size={24} />
                </div>
                <h5 className="fw-bold public-display-font text-dark">
                  Local Optimization
                </h5>
                <p className="text-secondary small mb-0">
                  Engineered specifically for private practices in Ethiopia. We
                  support local tax invoicing setups, attendance monitoring, and
                  customized queue boards.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 p-4 border-0 shadow-sm rounded-4">
                <div className="feature-icon-wrapper bg-teal-soft mb-3">
                  <Heart size={24} />
                </div>
                <h5 className="fw-bold public-display-font text-dark">
                  Patient-Centricity
                </h5>
                <p className="text-secondary small mb-0">
                  Reducing patient wait times in clinic waiting rooms is our
                  priority. Streamlined workflows ensure patient transactions
                  occur in minutes, not hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Callout */}
      <section
        className="py-5 ready text-white text-center position-relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, TEAL, #06b6d4)",
         
        }}
      >
        <div className="container py-4 position-relative z-2">
          <h2 className="fw-bold display-5 public-display-font mb-3">
            Ready to transform your practice?
          </h2>
          <p
            className="text-light opacity-90 mx-auto mb-4 lead"
            style={{ maxWidth: "600px" }}
          >
            Deploy a dedicated cloud instance of MediCare AI for your clinic in
            under 24 hours.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link
              to="/contact"
              className="btn btn-light btn-lg fw-semibold px-4 text-primary"
            >
              Book a Demo
            </Link>
            <Link to="/login" className="btn btn-outline-light btn-lg px-4">
              Portal Access
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
