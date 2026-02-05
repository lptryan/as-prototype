import React from 'react';
import { cn } from '@/lib/utils';

const statusStyles = {
  // Campaign statuses
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  designing: 'bg-purple-100 text-purple-700 border-purple-200',
  pending_hygiene: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  ready: 'bg-blue-100 text-blue-700 border-blue-200',
  processing: 'bg-orange-100 text-orange-700 border-orange-200',
  printed: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  shipped: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  
  // Order statuses
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  composing: 'bg-purple-100 text-purple-700 border-purple-200',
  printing: 'bg-blue-100 text-blue-700 border-blue-200',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  refunded: 'bg-red-100 text-red-700 border-red-200',
  
  // Lead validation statuses
  valid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  invalid: 'bg-red-100 text-red-700 border-red-200',
  moved: 'bg-orange-100 text-orange-700 border-orange-200',
  vacant: 'bg-slate-100 text-slate-700 border-slate-200',
  
  // Subscription tiers
  free: 'bg-slate-100 text-slate-700 border-slate-200',
  pro: 'bg-blue-100 text-blue-700 border-blue-200',
  agency: 'bg-purple-100 text-purple-700 border-purple-200',
};

const statusLabels = {
  draft: 'Draft',
  designing: 'Designing',
  pending_hygiene: 'Validating',
  ready: 'Ready',
  processing: 'Processing',
  printed: 'Printed',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
  pending: 'Pending',
  composing: 'Composing',
  printing: 'Printing',
  delivered: 'Delivered',
  refunded: 'Refunded',
  valid: 'Valid',
  invalid: 'Invalid',
  moved: 'Moved',
  vacant: 'Vacant',
  free: 'Free',
  pro: 'Pro',
  agency: 'Agency',
};

export default function StatusBadge({ status, size = 'default', className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border rounded-full",
        size === 'sm' && "px-2 py-0.5 text-xs",
        size === 'default' && "px-2.5 py-1 text-xs",
        size === 'lg' && "px-3 py-1.5 text-sm",
        statusStyles[status] || 'bg-slate-100 text-slate-700 border-slate-200',
        className
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}