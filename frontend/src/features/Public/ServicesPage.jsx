import React from "react";
import { Link } from "react-router-dom";
import { Stethoscope, FlaskConical, Pill, HeartPulse, ShieldAlert, CalendarRange, Check, ArrowRight } from "lucide-react";

const ServicesPage = () => {
  const services = [
    {
      icon: <Stethoscope size={28} />,
      title: "General OPD",
      bgClass: "bg-primary-soft",
      description: "Supports walk-in triage, vital signs capture (blood pressure, temperature, heart rate), history taking, physical examination notes, and quick diagnoses coding.",
      details: ["Triage Vital Logs", "Symptom & History Tracking", "ICD-10 Diagnosis Search", "Immediate Care Referrals"]
    },
    {
      icon: <FlaskConical size={28} />,
      title: "Laboratory Services (LIS)",
      bgClass: "bg-purple-soft",
      description: "Direct connection between doctor orders and technician desks. Manages sample collection lists, biochemistry, hematology, urinalysis input, and digital approval signatures.",
      details: ["Technician Queue Workspace", "Sample Collection Alerts", "Multi-parameter Test Entry", "Digital Sign-off & PDF Export"]
    },
    {
      icon: <Pill size={28} />,
      title: "e-Pharmacy & Inventory",
      bgClass: "bg-teal-soft",
      description: "Real-time stock depletion logs that trigger when prescriptions are dispensed. Includes low-stock threshold alerts, batch expiry tracking, and pricing calculations.",
      details: ["e-Prescription Dispense Queue", "Multi-batch Expiry Control", "Low Stock Dashboard Alerts", "Dynamic Pricing Integration"]
    },
    {
      icon: <HeartPulse size={28} />,
      title: "Maternal Health & Midwifery",
      bgClass: "bg-danger-soft",
      description: "Prenatal and postnatal progress logs. Tracks gestational age, fetal heartbeat, mother's check-ups, and integrates directly with labor and midwife consultation desk summaries.",
      details: ["ANC Checkup Schedules", "Fetal Development Logs", "Postnatal Care Milestones", "Midwife Consultation Interface"]
    },
    {
      icon: <ShieldAlert size={28} />,
      title: "Chronic Care Management",
      bgClass: "bg-warning-soft",
      description: "Custom dashboards for patients with long-term conditions like diabetes, hypertension, or cardiac diseases. Tracks lab progress histories to plot long-term trends.",
      details: ["Condition Trend Plots", "Long-term Medication Plans", "Routine Check-in Reminders", "Co-morbidity Health Summaries"]
    },
    {
      icon: <CalendarRange size={28} />,
      title: "Vaccination & Immunizations",
      bgClass: "bg-info-soft",
      description: "Standardized vaccination calendars for infants and school children. Tracks batch numbers of administered vaccines to manage patient recall lists.",
      details: ["Child Immunization Logs", "Dose Interval Calendars", "Batch & Lot Recall Support", "Vaccine Stock Tracking"]
    }
  ];

  return (
    <div style={{ paddingTop: "6rem" }}>
      {/* Page Header */}
      <section className="bg-light py-5 border-bottom border-light">
        <div className="container text-center">
          <span className="badge bg-primary-soft text-primary mb-2 px-3 py-2 rounded-pill fw-semibold">WHAT WE MANAGE</span>
          <h1 className="fw-bold display-5 public-display-font text-dark mb-3">Clinical Services</h1>
          <p className="text-secondary mx-auto mb-0 lead" style={{ maxWidth: "700px" }}>
            Explore how MediCare AI automates and secures core clinical service pipelines, ensuring patient data flows cleanly from admission to exit.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {services.map((service, index) => (
              <div key={index} className="col-lg-4 col-md-6">
                <div className="card h-100 p-4 border-0 shadow-sm rounded-4 glass-card-light">
                  <div className={`feature-icon-wrapper ${service.bgClass} mb-3`}>
                    {service.icon}
                  </div>
                  <h4 className="fw-bold public-display-font text-dark mb-2">{service.title}</h4>
                  <p className="text-secondary small mb-4">{service.description}</p>
                  <ul className="list-unstyled d-flex flex-column gap-2 mb-0 mt-auto">
                    {service.details.map((detail, idx) => (
                      <li key={idx} className="d-flex align-items-center gap-2 small text-dark fw-semibold">
                        <div className="text-success d-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle" style={{ width: "18px", height: "18px" }}>
                          <Check size={12} />
                        </div>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow CTA */}
      <section className="py-5 bg-dark text-white text-center position-relative">
        <div className="container py-4">
          <h3 className="fw-bold public-display-font mb-3">Looking for a comprehensive breakdown?</h3>
          <p className="text-secondary mx-auto mb-4" style={{ maxWidth: "600px" }}>
            See exactly how these services coordinate in our interactive clinical workflow map.
          </p>
          <Link to="/features" className="btn btn-primary btn-lg px-4 d-inline-flex align-items-center gap-2">
            <span>Explore Clinical Workflows</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
