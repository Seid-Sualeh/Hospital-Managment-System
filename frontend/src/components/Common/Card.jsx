import React from 'react';

const Card = ({ children, className = '', bodyClassName = '', noPadding = false }) => {
  if (noPadding) {
    return <div className={`mc-card ${className}`.trim()}>{children}</div>;
  }
  return (
    <div className={`mc-card ${className}`.trim()}>
      <div className={`mc-card-body ${bodyClassName}`.trim()}>{children}</div>
    </div>
  );
};

export default Card;
