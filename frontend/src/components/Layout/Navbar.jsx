import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getRoleDisplayName } from "../../constants/roles";
import {
  Bell,
  Menu,
  MessageSquare,
  Search,
  LogOut,
  User,
} from "lucide-react";
import SearchInput from "../Common/SearchInput";

const Navbar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const displayRole = getRoleDisplayName(user);

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

  const handleLogout = async (event) => {
    event.preventDefault();
    setShowUserMenu(false);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate to login even if logout fails
      navigate('/login', { replace: true });
    }
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

                <a
                  className="dropdown-item d-flex align-items-center gap-2 small"
                  href="#"
                >
                  <User size={14} />
                  Profile
                </a>
                <div className="dropdown-divider"></div>
                <button
                  onClick={handleLogout}
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
