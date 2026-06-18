import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Heart, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch {
      // error is set via AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left Panel - Login Form */}
      <div className="login-form-panel">
        <div className="login-form-inner">
          <div className="d-flex align-items-center gap-2 mb-4">
            <div className="sidebar-brand-icon">
              <Heart size={22} color="#fff" />
            </div>
            <span className="fw-bold fs-5">MediCare</span>
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
              <label className="mc-form-label">Email or Username</label>
              <input
                className="form-control"
                placeholder="Enter email or username"
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
                  type={showPw ? 'text' : 'password'}
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
                <label className="form-check-label small" htmlFor="remember">
                  Remember me
                </label>
              </div>
              <a href="#!" className="small text-primary text-decoration-none fw-semibold">
                Forgot Password?
              </a>
            </div>

            <button className="btn btn-primary w-100 py-2 fw-bold" type="submit" disabled={submitting}>
              {submitting ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : null}
              Sign In
            </button>
          </form>

          <p className="text-center text-muted small mt-4 mb-0">
            © 2024 MediCare CMS. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Hero */}
      <div className="login-hero-panel">
        <div className="login-hero-content text-center">
          <h2 className="fw-bold mb-3">Smart Hospital Management System</h2>
          <p className="opacity-75 mb-0">
            Manage your clinic operations efficiently and provide better care for your patients.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
