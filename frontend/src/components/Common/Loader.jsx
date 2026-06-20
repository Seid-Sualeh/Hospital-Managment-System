import React from 'react';

const Loader = ({ message = 'Loading...', fullPage = false }) => {
  const shimmerContent = (
    <div className="container py-4" style={{ opacity: 0.85 }}>
      {/* Header Skeleton */}
      <div className="skeleton-box mb-4" style={{ height: "34px", width: "280px" }}></div>
      
      {/* Cards Row Skeleton */}
      <div className="row g-3 mb-4">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="col-md-4">
            <div className="card border-0 p-4 shadow-sm rounded-4 bg-white" style={{ height: "130px" }}>
              <div className="skeleton-box mb-3" style={{ height: "16px", width: "120px" }}></div>
              <div className="skeleton-box mb-2" style={{ height: "32px", width: "80px" }}></div>
              <div className="skeleton-box" style={{ height: "12px", width: "150px" }}></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Table/Content Card Skeleton */}
      <div className="card border-0 p-4 shadow-sm rounded-4 bg-white" style={{ height: "240px" }}>
        <div className="skeleton-box mb-4" style={{ height: "20px", width: "200px" }}></div>
        <div className="skeleton-box mb-2.5" style={{ height: "14px", width: "100%" }}></div>
        <div className="skeleton-box mb-2.5" style={{ height: "14px", width: "100%" }}></div>
        <div className="skeleton-box mb-2.5" style={{ height: "14px", width: "100%" }}></div>
        <div className="skeleton-box mb-2.5" style={{ height: "14px", width: "100%" }}></div>
        <div className="skeleton-box" style={{ height: "14px", width: "80%" }}></div>
      </div>
      <p className="text-center text-muted small mt-3 fw-semibold animate-pulse-slow">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: "#f8fafc" }}>
        {shimmerContent}
      </div>
    );
  }

  return shimmerContent;
};

export default Loader;

