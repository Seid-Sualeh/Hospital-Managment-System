import React from 'react';
import { CheckCircle, ShieldAlert } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  danger: ShieldAlert,
  warning: ShieldAlert,
};

const AlertBanner = ({ type = 'success', message, onDismiss }) => {
  if (!message) return null;
  const Icon = ICONS[type] || ShieldAlert;

  return (
    <div className={`mc-alert-banner alert-${type}`} role="alert">
      <div className="d-flex align-items-center gap-2">
        <Icon size={16} />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button type="button" className="btn-close btn-close-sm" onClick={onDismiss} aria-label="Dismiss" />
      )}
    </div>
  );
};

export default AlertBanner;
