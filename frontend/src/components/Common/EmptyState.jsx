import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ icon: Icon = Inbox, title = 'No data found', description, action }) => {
  return (
    <div className="text-center py-5 px-3">
      <div className="d-inline-flex p-3 rounded-circle bg-light text-muted mb-3">
        <Icon size={32} />
      </div>
      <h6 className="fw-bold text-dark mb-2">{title}</h6>
      {description && <p className="text-muted small mb-3">{description}</p>}
      {action}
    </div>
  );
};

export default EmptyState;
