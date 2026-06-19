import React from 'react';

const STATUS_MAP = {
  active: 'active',
  completed: 'completed',
  paid: 'paid',
  in_stock: 'in_stock',
  scheduled: 'pending',
  pending: 'pending',
  unpaid: 'unpaid',
  low_stock: 'low_stock',
  in_progress: 'in_progress',
  checked_in: 'checked_in',
  partially_paid: 'pending',
  partial: 'pending',
  cancelled: 'cancelled',
  void: 'void',
  out_of_stock: 'out_of_stock',
  inactive: 'inactive',
  ordered: 'pending',
  samples_collected: 'in_progress',
};

const StatusBadge = ({ status, label }) => {
  const normalized = STATUS_MAP[status] || status || 'inactive';
  const display = label || (status ? String(status).replace(/_/g, ' ') : 'Unknown');

  return <span className={`badge-status ${normalized}`}>{display}</span>;
};

export default StatusBadge;
