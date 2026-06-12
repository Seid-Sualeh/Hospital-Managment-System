import React from 'react';

const SectionTitle = ({ children, icon: Icon, className = '' }) => {
  return (
    <h5 className={`text-section-title d-flex align-items-center gap-2 ${className}`.trim()}>
      {Icon && <Icon size={18} className="text-primary" />}
      <span>{children}</span>
    </h5>
  );
};

export default SectionTitle;
