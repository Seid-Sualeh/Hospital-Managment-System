import React from "react";
import { Link } from "react-router-dom";
import { HeartPulse, Mail, Phone, MapPin, ArrowRight } from "lucide-react";

const PublicFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="pub-dark-section pb-4 pt-5 footer-bg"
      style={{
        backgroundColor: "#070b13",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="container">
        <div className="row g-4 mb-5">
          {/* Column 1: Branding & Intro */}
          <div className="col-lg-4 col-md-6">
            <Link
              to="/"
              className="d-flex align-items-center gap-2 mb-3 text-decoration-none"
            >
              <div
                className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
                style={{ width: "32px", height: "32px" }}
              >
                 <HeartPulse size={18} color="#fff" />
              </div>
              <span
                style={{
                  fontFamily: "Outfit, sans-serif",
                  fontWeight: 800,
                  fontSize: "1.2rem",
                  background: "linear-gradient(90deg, #ffffff, #93c5fd)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.03em",
                }}
              >
                MediCare
                <span
                  style={{ color: "#06b6d4", WebkitTextFillColor: "#06b6d4" }}
                >
                  AI
                </span>
              </span>
            </Link>
            <p
              className="text-secondary small mb-4"
              style={{ lineHeight: "1.6" }}
            >
              Next-generation, AI-driven clinic management system tailored for
              private clinics in Ethiopia. Unifying patient clinical journeys,
              intelligent diagnoses assistance, and cashier ledgers in one
              secure cloud.
            </p>
            <div className="d-flex gap-2">
              <span className="badge bg-secondary-soft text-light p-2 px-3 border border-secondary border-opacity-10 rounded-pill">
                v1.2.0 (Active Release)
              </span>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="text-white fw-bold mb-3 public-display-font">
              Explore
            </h6>
            <ul className="list-unstyled d-flex flex-column gap-2 text-secondary small">
              <li>
                <Link
                  to="/"
                  className="text-secondary text-decoration-none hover-primary transition"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-secondary text-decoration-none hover-primary transition"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/features"
                  className="text-secondary text-decoration-none hover-primary transition"
                >
                  Platform Features
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="text-secondary text-decoration-none hover-primary transition"
                >
                  Clinical Services
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-secondary text-decoration-none hover-primary transition"
                >
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform Modules */}
          <div className="col-lg-3 col-md-6 col-6">
            <h6 className="text-white fw-bold mb-3 public-display-font">
              Key Modules
            </h6>
            <ul className="list-unstyled d-flex flex-column gap-2 text-secondary small">
              <li>
                <span className="text-secondary">
                  Patient Queue & Registration
                </span>
              </li>
              <li>
                <span className="text-secondary">Consultation Workspace</span>
              </li>
              <li>
                <span className="text-secondary">
                  Laboratory Information (LIS)
                </span>
              </li>
              <li>
                <span className="text-secondary">e-Pharmacy & Inventory</span>
              </li>
              <li>
                <span className="text-secondary">Unified Cashier Billing</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Information */}
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3 public-display-font">
              Contact Details
            </h6>
            <ul className="list-unstyled d-flex flex-column gap-3 text-secondary small">
              <li className="d-flex align-items-start gap-2">
                <MapPin size={16} className="text-primary mt-1 flex-shrink-0" />
                <span>
                  Bole District, Behind Friendship Mall, Addis Ababa, Ethiopia
                </span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <Phone size={16} className="text-primary flex-shrink-0" />
                <span>+251 116 673 892</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <Mail size={16} className="text-primary flex-shrink-0" />
                <span>support@medicare-ai.com</span>
              </li>
            </ul>
            <div className="mt-4">
              <Link
                to="/login"
                className="btn btn-outline-light btn-sm d-inline-flex align-items-center gap-2 border-opacity-20 px-3 py-2"
              >
                <span>CMS Staff Portal</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        <hr className="border-secondary border-opacity-10 my-4" />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <span className="text-secondary small">
            &copy; {currentYear} MediCare AI Inc. All rights reserved. Addis
            Ababa, Ethiopia.
          </span>
          <div className="d-flex gap-3 text-secondary small">
            <a
              href="#!"
              className="text-secondary text-decoration-none hover-primary"
            >
              Privacy Policy
            </a>
            <span>&middot;</span>
            <a
              href="#!"
              className="text-secondary text-decoration-none hover-primary"
            >
              Terms of Use
            </a>
            <span>&middot;</span>
            <Link
              to="/login"
              className="text-primary text-decoration-none fw-semibold"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
