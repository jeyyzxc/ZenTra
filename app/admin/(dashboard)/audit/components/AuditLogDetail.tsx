'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { CalendarClock, DatabaseZap, Fingerprint, MonitorSmartphone, UserRound, X } from 'lucide-react';
import type { AuditLogListItem } from '../types';

const STATUS_STYLES: Record<string, string> = {
  SUCCESS: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  FAILED: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
  WARNING: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  INFO: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
};

function formatEnum(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatRole(value: string) {
  return value === 'SUPERADMIN' ? 'Super Admin' : formatEnum(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date(value));
}

function JsonBlock({
  emptyLabel = 'No data captured.',
  title,
  value,
}: {
  emptyLabel?: string;
  title: string;
  value: unknown;
}) {
  const hasValue = value !== null && value !== undefined;

  return (
    <div className="group rounded-2xl border border-gray-100 bg-white/50 p-5 shadow-sm transition-all duration-300 hover:border-[#D6B53B]/30 hover:bg-white dark:border-white/5 dark:bg-[#141A13]/50 dark:hover:border-[#D6B53B]/20 dark:hover:bg-[#141A13]">
      <h4 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8E7722] dark:text-[#D6B53B]">
        <div className="h-1.5 w-1.5 rounded-full bg-[#D6B53B]" />
        {title}
      </h4>
      {hasValue ? (
        <pre className="audit-scrollbar max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-gray-100/50 bg-[#1A1F18] p-4 font-mono text-[11px] leading-5 text-emerald-50 shadow-inner dark:border-black/50 dark:bg-[#0C100B]">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : (
        <p className="text-sm italic text-gray-400 dark:text-white/40">{emptyLabel}</p>
      )}
    </div>
  );
}

function SummaryItem({
  icon,
  label,
  monospace = false,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  monospace?: boolean;
  value: React.ReactNode;
}) {
  return (
    <div className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#D6B53B]/30 hover:shadow-md dark:border-white/5 dark:bg-[#141A13]/80 dark:hover:border-[#D6B53B]/20 dark:hover:shadow-[#D6B53B]/5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FDF5CC] text-[#8E7722] transition-colors group-hover:bg-[#D6B53B] group-hover:text-white dark:bg-[#D6B53B]/10 dark:text-[#D6B53B] dark:group-hover:bg-[#D6B53B]/20">
        {icon}
      </div>
      <div>
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-white/40">
          {label}
        </div>
        <div className={`break-words text-[13px] font-semibold leading-relaxed text-gray-900 dark:text-white ${monospace ? 'font-mono' : ''}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function AuditLogDetail({
  isLoading,
  isOpen,
  isSuperAdmin,
  log,
  onClose,
}: {
  isLoading: boolean;
  isOpen: boolean;
  isSuperAdmin: boolean;
  log: AuditLogListItem | null;
  onClose: () => void;
}) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-opacity duration-300 sm:p-6" 
      role="dialog" 
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-[#D6B53B]/20 bg-[#F9F8F1] shadow-[0_30px_100px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/10 dark:bg-[#1C1D21] animate-in zoom-in-95 duration-200">
        <div className="shrink-0 border-b border-[#D6B53B]/10 bg-white/80 px-6 py-5 backdrop-blur-xl dark:bg-[#141A13]/80 sm:px-8 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#8E7722] dark:text-[#D6B53B]">
                <DatabaseZap className="h-3 w-3" />
                Audit Detail Record
              </p>
              <h2 className="mt-2 font-sahitya text-3xl font-bold uppercase tracking-[0.05em] text-gray-900 dark:text-white">
                {log ? formatEnum(log.action) : 'Loading Activity'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="group rounded-full border border-gray-200 bg-white p-2.5 text-gray-400 shadow-sm transition-all hover:scale-105 hover:border-[#D6B53B]/50 hover:bg-[#FDF5CC] hover:text-[#8E7722] dark:border-white/10 dark:bg-[#1C1D21] dark:hover:border-[#D6B53B]/30 dark:hover:bg-[#D6B53B]/10 dark:hover:text-[#D6B53B]"
              aria-label="Close audit detail"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="audit-scrollbar flex-1 overflow-y-auto bg-gray-50/50 p-6 dark:bg-transparent sm:p-8">
          {isLoading || !log ? (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-3xl bg-white dark:bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-8">
              <section className="relative overflow-hidden rounded-3xl border border-[#D6B53B]/30 bg-gradient-to-br from-[#FDF5CC] to-white p-6 shadow-sm dark:from-[#D6B53B]/10 dark:to-transparent sm:p-8">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#D6B53B]/10 blur-3xl dark:bg-[#D6B53B]/20" />
                <div className="relative">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B53B]/20 bg-white/60 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8E7722] backdrop-blur-md dark:bg-black/20 dark:text-[#D6B53B]">
                      {log.module}
                    </span>
                    <span className={`inline-flex items-center px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full border ${STATUS_STYLES[log.status]}`}>
                      {formatEnum(log.status)}
                    </span>
                  </div>
                  <p className="text-xl font-medium leading-relaxed text-[#1a1f18] dark:text-[#F4F4F0]">{log.description}</p>
                </div>
              </section>

              <section>
                <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-[#A3B19B]">
                  <span className="h-px w-6 bg-gray-200 dark:bg-white/10" />
                  Primary Details
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SummaryItem
                    icon={<Fingerprint className="h-4 w-4" />}
                    label="Log ID"
                    value={log.id}
                  />
                  <SummaryItem
                    icon={<CalendarClock className="h-4 w-4" />}
                    label="Timestamp"
                    value={formatDate(log.timestamp)}
                  />
                  <SummaryItem
                    icon={<DatabaseZap className="h-4 w-4" />}
                    label="Activity"
                    value={`${formatEnum(log.action)} · ${log.module}`}
                  />
                  <SummaryItem
                    icon={<UserRound className="h-4 w-4" />}
                    label="User Name"
                    value={log.userName}
                  />
                </div>
              </section>

              {isSuperAdmin && (
                <section>
                  <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-[#A3B19B]">
                    <span className="h-px w-6 bg-gray-200 dark:bg-white/10" />
                    System Context
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SummaryItem
                      icon={<UserRound className="h-4 w-4" />}
                      label="User Role"
                      value={formatRole(log.userRole)}
                    />
                    <SummaryItem
                      icon={<Fingerprint className="h-4 w-4" />}
                      label="User ID"
                      value={log.userId ?? 'System event'}
                    />
                    <SummaryItem
                      icon={<MonitorSmartphone className="h-4 w-4" />}
                      label="IP Address"
                      value={log.ipAddress ?? 'Not captured'}
                    />
                    <SummaryItem
                      icon={<MonitorSmartphone className="h-4 w-4" />}
                      label="User Agent"
                      value={log.userAgent ?? 'Not captured'}
                    />
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-[#A3B19B]">
                  <span className="h-px w-6 bg-gray-200 dark:bg-white/10" />
                  Data Transformation
                </h3>
                <div className="grid gap-5 lg:grid-cols-2">
                  <JsonBlock title="Previous State" value={log.previousValues} />
                  <JsonBlock title="New State" value={log.newValues} />
                </div>
              </section>

              <section>
                <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-[#A3B19B]">
                  <span className="h-px w-6 bg-gray-200 dark:bg-white/10" />
                  Extended Meta
                </h3>
                <JsonBlock title="Execution Metadata" value={log.metadata} />
              </section>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
