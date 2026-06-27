import React from 'react';

type BadgeKind = 'booking' | 'payment' | 'source' | 'sync' | 'automation';

const LABELS: Record<string, string> = {
  ONLINE_FORM: 'Online Form',
  ADMIN_MANUAL: 'Manual',
  N8N_WORKFLOW: 'n8n Workflow',
  PAYMENT_SYNC: 'Payment Sync',
  CONTRACT_SYNC: 'Contract Sync',
  SYNCED: 'Synced',
  PENDING_SYNC: 'Pending Sync',
  FAILED_SYNC: 'Failed Sync',
  MANUAL_UPDATE: 'Manual Update',
  CONFLICT_DETECTED: 'Conflict',
  NOT_STARTED: 'Not Started',
  TRIGGERED: 'Triggered',
  PROCESSING: 'Processing',
  RESERVATION_PAID: 'Reservation Paid',
  DOWN_PAYMENT_PAID: 'Down Payment Paid',
  PARTIALLY_PAID: 'Partially Paid',
  FULLY_PAID: 'Fully Paid',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
};

const STYLES: Record<BadgeKind, Record<string, string>> = {
  booking: {
    PENDING: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    CONFIRMED: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    IN_PROGRESS: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
    COMPLETED: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300',
    DECLINED: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
    CANCELLED: 'border-gray-300 bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-gray-300',
    RESCHEDULED: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300',
    EXPIRED: 'border-red-300 bg-red-100 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-200',
    ON_HOLD: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300',
  },
  payment: {
    UNPAID: 'border-gray-200 bg-gray-50 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300',
    RESERVATION_PAID: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
    DOWN_PAYMENT_PAID: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300',
    PARTIALLY_PAID: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    FULLY_PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    OVERDUE: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
    FAILED: 'border-red-300 bg-red-100 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-200',
    REFUNDED: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300',
  },
  source: {
    ONLINE_FORM: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
    ADMIN_MANUAL: 'border-gray-200 bg-gray-50 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300',
    N8N_WORKFLOW: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300',
    PAYMENT_SYNC: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    CONTRACT_SYNC: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300',
  },
  sync: {
    SYNCED: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    PENDING_SYNC: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    FAILED_SYNC: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
    MANUAL_UPDATE: 'border-gray-200 bg-gray-50 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300',
    CONFLICT_DETECTED: 'animate-pulse border-red-300 bg-red-100 font-black text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-200',
  },
  automation: {
    NOT_STARTED: 'border-gray-200 bg-gray-50 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300',
    TRIGGERED: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
    PROCESSING: 'animate-pulse border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    FAILED: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
  },
};

function formatLabel(value: string) {
  return LABELS[value] ??
    value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function BookingStatusBadge({
  kind,
  value,
}: {
  kind: BadgeKind;
  value: string;
}) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${STYLES[kind][value] ?? 'border-gray-200 bg-gray-50 text-gray-600'}`}>
      {formatLabel(value)}
    </span>
  );
}
