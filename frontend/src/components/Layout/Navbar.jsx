import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getRoleDisplayName, ROLE_IDS } from "../../constants/roles";
import {
  Bell,
  Menu,
  MessageSquare,
  Search,
  LogOut,
  User,
  Eye,
} from "lucide-react";
import SearchInput from "../Common/SearchInput";

const DEMO_ROLES = [
  { id: ROLE_IDS.DOCTOR, name: "Doctor" },
  { id: ROLE_IDS.RECEPTIONIST, name: "Receptionist" },
];

const Navbar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const { user, logout, viewAsRole, switchViewRole, resetViewRole } = useAuth();
  const [search, setSearch] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const isAdmin =
    user?.role?.id === ROLE_IDS.ADMIN || user?.role_id === ROLE_IDS.ADMIN;
  const displayRole = viewAsRole
    ? `${viewAsRole.roleName} (View As)`
    : getRoleDisplayName(user);

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
    : "AD";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchRole = (roleId, roleName) => {
    switchViewRole(roleId, roleName);
    setShowUserMenu(false);
  };

  const handleResetRole = () => {
    resetViewRole();
  };

  return (
    <header className="top-navbar">
      <div className="d-flex align-items-center justify-content-between gap-3 gap-md-4">
        <div className="d-flex align-items-center gap-3 gap-md-4 flex-grow-1">
          <button
            type="button"
            className="btn btn-light border d-flex align-items-center justify-content-center btn-icon-md"
            onClick={onMenuToggle}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="d-none d-md-block mc-navbar-search">
            <SearchInput
              placeholder="Search anything..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 gap-md-3">
          <button
            type="button"
            className="btn btn-light border position-relative btn-icon-md"
          >
            <Bell size={18} />
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger p-1">
              <span className="visually-hidden">Notifications</span>
            </span>
          </button>
          <button
            type="button"
            className="btn btn-light border btn-icon-md d-none d-sm-flex"
          >
            <MessageSquare size={18} />
          </button>

          <div
            className="d-flex align-items-center gap-2 gap-md-3 border-start ps-4 ms-2"
            ref={userMenuRef}
          >
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold avatar-sm"
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ cursor: "pointer" }}
            >
              {initials}
            </div>
            <div
              className="d-none d-sm-block text-start"
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ cursor: "pointer" }}
            >
              <p className="mb-0 fw-semibold small">
                {user ? `${user.first_name} ${user.last_name}` : "Admin"}
              </p>
              <span className="mc-user-role">{displayRole}</span>
            </div>

            {showUserMenu && (
              <div className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2 rounded-3 w-200 animate-fade-in">
                <div className="dropdown-header px-3 py-2 bg-light border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold avatar-sm">
                      {initials}
                    </div>
                    <div>
                      <p className="mb-0 fw-semibold small">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <small className="text-muted">{displayRole}</small>
                    </div>
                  </div>
                </div>

                {/* Admin-only: Role switching */}
                {isAdmin && (
                  <>
                    <div className="dropdown-divider my-2"></div>
                    <div className="px-3 py-2">
                      <small className="text-muted d-block mb-2">
                        <Eye
                          size={12}
                          className="me-1"
                          style={{ display: "inline" }}
                        />
                        View As Role (Admin Only)
                      </small>
                      {DEMO_ROLES.map((role) => (
                        <button
                          key={role.id}
                          onClick={() => {
                            if (viewAsRole?.roleId === role.id) {
                              handleResetRole();
                            } else {
                              handleSwitchRole(role.id, role.name);
                            }
                          }}
                          className={`btn btn-sm d-block w-100 text-start mb-1 ${
                            viewAsRole?.roleId === role.id
                              ? "btn-primary"
                              : role.id === user?.role?.id
                                ? "btn-outline-primary"
                                : "btn-outline-secondary"
                          }`}
                        >
                          <small>
                            {role.name}
                            {viewAsRole?.roleId === role.id && " ✓"}
                          </small>
                        </button>
                      ))}
                    </div>
                    <div className="dropdown-divider my-2"></div>
                  </>
                )}

                <a
                  className="dropdown-item d-flex align-items-center gap-2 small"
                  href="#"
                >
                  <User size={14} />
                  Profile
                </a>
                <div className="dropdown-divider"></div>
                <button
                  onClick={async () => {
                    await logout();
                    setShowUserMenu(false);
                    navigate("/login", { replace: true });
                  }}
                  className="dropdown-item d-flex align-items-center gap-2 small text-danger"
                  type="button"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
