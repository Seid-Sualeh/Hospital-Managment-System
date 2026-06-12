import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.innerWidth < 992) {
      setMobileOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="dashboard-layout">
      <div
        className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={closeMobile}
        role="presentation"
      />
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onNavigate={closeMobile}
      />
      <div className="main-wrapper">
        <Navbar
          onMenuToggle={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="main-content animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
