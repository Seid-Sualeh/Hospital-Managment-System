import React from 'react';

const Loader = ({ message = 'Loading...', fullPage = false }) => {
  const content = (
    <div className="d-flex flex-column align-items-center justify-content-center gap-3">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">{message}</span>
      </div>
      <p className="text-muted fw-semibold small mb-0">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        {content}
      </div>
    );
  }

  return <div className="py-5">{content}</div>;
};

export default Loader;
