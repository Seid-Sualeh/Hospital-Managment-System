import React from 'react';

/**
 * Standard page wrapper — spacing comes from MainLayout .main-content
 */
const PageShell = ({ children, className = '' }) => {
  return <div className={`page-shell ${className}`.trim()}>{children}</div>;
};

export default PageShell;
