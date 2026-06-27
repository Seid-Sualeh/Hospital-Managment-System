import React from 'react';
import { CheckCircle, ShieldAlert } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  danger: ShieldAlert,
  warning: ShieldAlert,
};

const AlertBanner = ({ type = 'success', message, onDismiss, onClose }) => {
  if (!message) return null;
  const Icon = ICONS[type] || ShieldAlert;
  const dismiss = onDismiss || onClose;

  return (
    <div className={`mc-alert-banner alert-${type}`} role="alert">
      <div className="d-flex align-items-center gap-2">
        <Icon size={16} />
        <span>{message}</span>
      </div>
      {dismiss && (
        <button type="button" className="btn-close btn-close-sm" onClick={dismiss} aria-label="Dismiss" />
      )}
    </div>
  );
};

export default AlertBanner;
