import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { HeartPulse, Eye, EyeOff, Shield, Lock, Sparkles } from "lucide-react";
import { getBaseURL, getTenant, setTenant } from "../../services/api";
import "./Login.css"; // Import the CSS file for styling

const Login = () => {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const storedTenant = getTenant();
    if (storedTenant) {
      setTenantId(storedTenant);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const tenant = tenantId.trim() || (await resolveTenantByEmail(email));
    if (tenant) {
      setTenant(tenant);
    }

    try {
      await login(email, password, tenant);
      navigate("/dashboard", { replace: true });
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const resolveTenantByEmail = async (emailInput) => {
    try {
      const response = await fetch(
        `${getBaseURL()}/tenants/resolve?email=${encodeURIComponent(emailInput)}`,
      );
      if (response.ok) {
        const data = await response.json();
        return data.subdomain;
      }
    } catch (e) {
      console.warn("[Login] Could not resolve tenant by email:", e.message);
    }
    return null;
  };

  return (
    <div className="login-page">
      <div className="login-form-panel">
        <div className="login-form-inner">
          <div className="d-flex align-items-center gap-2 mb-4">
            <div className="sidebar-brand-icon">
              <HeartPulse size={18} color="#fff" />
            </div>
            <span className="fw-bold fs-5">MediCare AI</span>
          </div>

          <h4 className="fw-bold mb-1">Clinic Management System</h4>
          <p className="text-muted mb-4">Sign in to your account</p>

          {error && (
            <div className="mc-alert-banner alert-danger mb-3">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="mc-form-label">Tenant / Clinic ID</label>
              <input
                className="form-control"
                placeholder="Enter clinic subdomain (e.g., yared)"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
              />
              <small className="text-muted">
                Your clinic subdomain identifier
              </small>
            </div>

            <div className="mb-3">
              <label className="mc-form-label">Email</label>
              <input
                className="form-control"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="mc-form-label">Password</label>
              <div className="input-group">
                <input
                  className="form-control"
                  type={showPw ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0"
                  onClick={() => setShowPw(!showPw)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <label
                  className="form-check-label small text-secondary"
                  htmlFor="remember"
                >
                  Remember me
                </label>
              </div>
              <a
                href="/forgot-password"
                className="small text-primary text-decoration-none fw-semibold"
              >
                Forgot Password?
              </a>
            </div>

            <button
              className="btn btn-primary w-100 py-2.5 fw-bold"
              type="submit"
              disabled={submitting}
              style={{ boxShadow: "0 4px 15px rgba(37, 99, 235, 0.25)" }}
            >
              {submitting ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : null}
              Sign In to Workspace
            </button>
          </form>

          {/* Secure Trust indicators in form */}
          <div className="d-flex justify-content-center gap-3 mt-4 pt-3 border-top border-light">
            <span className="hipaa-badge-container" style={{ fontSize: "9px" }}>
              <Shield size={10} /> HIPAA SECURE
            </span>
            <span
              className="secure-badge-container"
              style={{ fontSize: "9px" }}
            >
              <Lock size={10} /> 256-BIT ENCRYPTION
            </span>
          </div>

          <p
            className="text-center text-muted small mt-4 mb-0"
            style={{ fontSize: "10px" }}
          >
            © {new Date().getFullYear()} MediCare AI Inc. Bole District, Addis
            Ababa, Ethiopia.
          </p>
        </div>
      </div>

      {/* Right Panel - Hero */}
      <div
        className="login-hero-panel d-none d-lg-flex"
        style={{
          background: "linear-gradient(135deg, #090d1a 0%, #1e1b4b 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow decoration */}
        <div
          className="position-absolute bg-primary rounded-circle opacity-10"
          style={{
            width: "400px",
            height: "400px",
            top: "-100px",
            right: "-100px",
            filter: "blur(50px)",
          }}
        ></div>
        <div
          className="position-absolute bg-purple rounded-circle opacity-10"
          style={{
            width: "400px",
            height: "400px",
            bottom: "-100px",
            left: "-100px",
            filter: "blur(50px)",
          }}
        ></div>

        <div className="login-hero-content text-center position-relative z-2">
          <div
            className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle mx-auto mb-4"
            style={{
              width: "54px",
              height: "54px",
              boxShadow: "0 0 30px rgba(37, 99, 235, 0.5)",
            }}
          >
            <HeartPulse size={22} color="#fff" />
          </div>
          <h2
            className="fw-bold display-6 public-display-font text-white mb-3"
            style={{ letterSpacing: "-1px" }}
          >
            MediCare<span className="text-primary">AI</span> Portal
          </h2>
          <p
            className="opacity-75 mb-4 lead small"
            style={{ fontSize: "1rem", lineHeight: "1.6" }}
          >
            Connecting consultations, LIS laboratories, drug inventories, and
            cashier billings in one secure, unified workflow database.
          </p>

          <div
            className="p-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-4 shadow-sm text-start"
            style={{ backdropFilter: "blur(8px)" }}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <Sparkles size={14} className="text-warning" />
              <span
                className="fw-bold text-white small"
                style={{ fontSize: "11px" }}
              >
                Clinical Intelligence Active
              </span>
            </div>
            <p
              className="text-secondary small mb-0"
              style={{ fontSize: "10px", lineHeight: "1.5" }}
            >
              Gemini LLM integrations continuously monitor for potential
              prescription drug interactions, diagnose differentials, and
              translate lab result structures.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
