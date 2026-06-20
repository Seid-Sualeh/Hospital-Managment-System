import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ icon: Icon = Inbox, title, message, description, action }) => {
  const displayTitle = title || message || 'No data found';

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center text-center py-5 px-4"
      style={{ minHeight: '200px' }}
    >
      {/* Icon container with gradient ring */}
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(139,92,246,0.08))',
          border: '1px solid rgba(37,99,235,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          color: '#6366f1',
        }}
      >
        <Icon size={24} />
      </div>

      <h6
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '0.4rem',
          fontSize: '0.95rem',
          letterSpacing: '-0.01em',
        }}
      >
        {displayTitle}
      </h6>

      {description && (
        <p
          style={{
            color: '#64748b',
            fontSize: '0.82rem',
            maxWidth: '280px',
            lineHeight: 1.6,
            marginBottom: action ? '1rem' : '0',
          }}
        >
          {description}
        </p>
      )}

      {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
    </div>
  );
};

export default EmptyState;
