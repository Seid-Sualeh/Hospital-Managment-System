import React from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldAlert } from "lucide-react";
import Loader from "./Loader";
import { canAccessRoute, getRoleDisplayName } from "../../constants/roles";

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, effectiveUser, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const displayUser = effectiveUser || user;

  if (loading) {
    return <Loader message="Restoring clinic session..." fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !canAccessRoute(displayUser, allowedRoles)) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 p-3">
        <div className="mc-card mc-card-body text-center w-480">
          <div className="d-inline-flex p-3 bg-danger bg-opacity-10 text-danger rounded-circle mb-3">
            <ShieldAlert size={36} />
          </div>
          <h3 className="fw-bold">Access Denied</h3>
          <p className="text-muted mb-4">
            Your role (<strong>{getRoleDisplayName(displayUser)}</strong>)
            cannot access this module.
          </p>
          <Link to="/dashboard" className="btn btn-primary px-4 fw-semibold">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
