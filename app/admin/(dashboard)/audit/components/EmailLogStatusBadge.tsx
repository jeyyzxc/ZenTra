'use client';

import React from 'react';

const STATUS_STYLES: Record<string, { badge: string; dot: string; pulse?: boolean }> = {
  QUEUED: {
    badge: 'border-gray-200 bg-gray-50 text-gray-700 dark:border-white/20 dark:bg-white/10 dark:text-gray-300',
    dot: 'bg-gray-400',
  },
  PENDING: {
    badge: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    dot: 'bg-amber-400',
  },
  SENT: {
    badge: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  DELIVERED: {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  FAILED: {
    badge: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
    dot: 'bg-red-500',
    pulse: true,
  },
  BOUNCED: {
    badge: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300',
    dot: 'bg-orange-500',
    pulse: true,
  },
  RETRIED: {
    badge: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
};

function formatEnum(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\bN8n\b/g, 'n8n').replace(/\bAi\b/g, 'AI');
}

export default function EmailLogStatusBadge({ status }: { status: string }) {
  const styles = STATUS_STYLES[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider ${styles.badge}`}>
      <span className={`h-2 w-2 rounded-full ${styles.dot} ${styles.pulse ? 'animate-pulse' : ''}`} />
      {formatEnum(status)}
    </span>
  );
}
