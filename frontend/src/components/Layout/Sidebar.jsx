import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { HeartPulse } from "lucide-react";
import { NAV_ITEMS } from "../../constants/navigation";
import { canAccessRoute } from "../../constants/roles";

const Sidebar = ({ collapsed, mobileOpen, onNavigate }) => {
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) =>
    canAccessRoute(user, item.roles),
  );

  return (
    <aside
      className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
    >
      <div className="sidebar-brand d-flex align-items-center gap-3">
        <div className="sidebar-brand-icon">
          <HeartPulse size={22} className="text-white" />
        </div>
        <div className="sidebar-brand-text">
          <h5 className="fw-bold mb-0 text-white">MediCare</h5>
          <span className="text-secondary small">Clinic Management</span>
        </div>
      </div>

      <nav className="nav flex-column flex-grow-1 py-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer-text px-3 py-3 border-top border-secondary border-opacity-25">
        <span className="text-secondary small">
          {user ? `${user.first_name} ${user.last_name}` : ""}
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;
