import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { HeartPulse, Menu, X, ArrowRight } from "lucide-react";

const PublicNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleNavbar = () => setIsOpen(!isOpen);
  const closeNavbar = () => setIsOpen(false);

  return (
    <nav
      className={`navbar navbar-expand-lg fixed-top glass-navbar ${scrolled ? "scrolled" : ""}`}
    >
      <div className="container">
        {/* Brand */}
        <Link
          to="/"
          className="navbar-brand d-flex align-items-center gap-2"
          onClick={closeNavbar}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #2563eb, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(37,99,235,0.4)",
              flexShrink: 0,
            }}
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
            <span style={{ color: "#06b6d4", WebkitTextFillColor: "#06b6d4" }}>
              AI
            </span>
          </span>
        </Link>

        {/* Mobile toggle */}
        <button
          className="navbar-toggler border-0 p-1"
          type="button"
          onClick={toggleNavbar}
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
          style={{ color: "#94a3b8" }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Links */}
        <div
          className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}
          id="publicNavbar"
        >
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-1 text-center mt-3 mt-lg-0">
            {[
              { to: "/", label: "Home", end: true },
              { to: "/about", label: "About" },
              { to: "/features", label: "Features" },
              { to: "/services", label: "Services" },
              { to: "/contact", label: "Contact" },
            ].map((link) => (
              <li key={link.to} className="nav-item">
                <NavLink
                  to={link.to}
                  end={link.end}
                  onClick={closeNavbar}
                  className={({ isActive }) =>
                    `nav-link fw-semibold px-3 py-2 rounded-2 ${isActive ? "text-white" : ""}`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? "#ffffff" : "#64748b",
                    background: isActive
                      ? "rgba(37,99,235,0.15)"
                      : "transparent",
                    fontSize: "0.875rem",
                    transition: "all 0.2s ease",
                  })}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.classList.contains("active"))
                      e.currentTarget.style.color = "#e2e8f0";
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.classList.contains("active"))
                      e.currentTarget.style.color = "#64748b";
                  }}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="d-flex flex-column flex-lg-row align-items-center gap-2 mt-3 mt-lg-0">
            <Link
              to="/login"
              onClick={closeNavbar}
              className="btn d-inline-flex align-items-center gap-2 px-4 py-2  "
              style={{
                background: "linear-gradient(135deg, TEAL, #06b6d4)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.875rem",
                boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
              }}
            >
              <span>Staff Login</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;
