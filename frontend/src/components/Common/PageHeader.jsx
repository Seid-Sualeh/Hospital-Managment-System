import React from 'react';

const PageHeader = ({ title, subtitle, actions, children }) => {
  return (
    <div
      className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4"
    >
      <div>
        <h1 className="page-header-title">{title}</h1>
        {subtitle && (
          <p
            className="page-header-subtitle"
            style={{ marginTop: '0.2rem' }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {actions && (
        <div className="d-flex flex-wrap gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
};

export default PageHeader;
