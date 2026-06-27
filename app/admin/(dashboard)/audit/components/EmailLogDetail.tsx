'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarClock,
  DatabaseZap,
  Mail,
  RefreshCw,
  Send,
  UserRound,
  Workflow,
  X,
} from 'lucide-react';
import type { EmailLogListItem } from '../types';
import EmailLogStatusBadge from './EmailLogStatusBadge';

const RESENDABLE_STATUSES = new Set(['FAILED', 'BOUNCED', 'PENDING']);

function formatEnum(value: string | null) {
  return value ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : '-';
}

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date(value));
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

export default function EmailLogDetail({
  isLoading,
  isOpen,
  isResending,
  isSuperAdmin,
  log,
  onClose,
  onResend,
}: {
  isLoading: boolean;
  isOpen: boolean;
  isResending: boolean;
  isSuperAdmin: boolean;
  log: EmailLogListItem | null;
  onClose: () => void;
  onResend: (log: EmailLogListItem) => void;
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

  const canResend = Boolean(log && RESENDABLE_STATUSES.has(log.status));

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
                <Mail className="h-3 w-3" />
                Email Delivery Record
              </p>
              <h2 className="mt-2 font-sahitya text-3xl font-bold uppercase tracking-[0.05em] text-gray-900 dark:text-white">
                {log ? formatEnum(log.emailType) : 'Loading Email'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="group rounded-full border border-gray-200 bg-white p-2.5 text-gray-400 shadow-sm transition-all hover:scale-105 hover:border-[#D6B53B]/50 hover:bg-[#FDF5CC] hover:text-[#8E7722] dark:border-white/10 dark:bg-[#1C1D21] dark:hover:border-[#D6B53B]/30 dark:hover:bg-[#D6B53B]/10 dark:hover:text-[#D6B53B]"
              aria-label="Close email detail"
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
                      {formatEnum(log.emailType)}
                    </span>
                    <EmailLogStatusBadge status={log.status} />
                  </div>
                  <p className="text-xl font-medium leading-relaxed text-[#1a1f18] dark:text-[#F4F4F0]">{log.subject}</p>
                  <p className="mt-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#8E7722]/80 dark:text-[#D6B53B]/80">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Generated {formatDate(log.createdAt)}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-[#A3B19B]">
                  <span className="h-px w-6 bg-gray-200 dark:bg-white/10" />
                  Recipient Profile
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SummaryItem icon={<Mail className="h-4 w-4" />} label="Recipient Email" value={log.recipientEmail} />
                  <SummaryItem icon={<UserRound className="h-4 w-4" />} label="Recipient Name" value={log.recipientName ?? '-'} />
                </div>
              </section>

              <section>
                <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-[#A3B19B]">
                  <span className="h-px w-6 bg-gray-200 dark:bg-white/10" />
                  Contextual Link
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SummaryItem icon={<DatabaseZap className="h-4 w-4" />} label="Related Module" value={formatEnum(log.relatedModule)} />
                  <SummaryItem icon={<DatabaseZap className="h-4 w-4" />} label="Related Record ID" monospace value={log.relatedRecordId ?? '-'} />
                </div>
              </section>

              <section>
                <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-[#A3B19B]">
                  <span className="h-px w-6 bg-gray-200 dark:bg-white/10" />
                  Transmission Path
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <SummaryItem icon={<Send className="h-4 w-4" />} label="Trigger Source" value={formatEnum(log.triggerSource)} />
                  <SummaryItem icon={<Workflow className="h-4 w-4" />} label="Workflow Name" value={log.workflowName ?? '-'} />
                  <SummaryItem icon={<Workflow className="h-4 w-4" />} label="Execution ID" monospace value={log.workflowExecutionId ?? '-'} />
                  <div className="sm:col-span-2 lg:col-span-3">
                    <SummaryItem icon={<Mail className="h-4 w-4" />} label="Provider Message ID" monospace value={log.providerMessageId ?? '-'} />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-[#A3B19B]">
                  <span className="h-px w-6 bg-gray-200 dark:bg-white/10" />
                  Event Timeline
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <SummaryItem icon={<CalendarClock className="h-4 w-4" />} label="Queued" value={formatDate(log.createdAt)} />
                  <SummaryItem icon={<CalendarClock className="h-4 w-4" />} label="Sent" value={formatDate(log.sentAt)} />
                  <SummaryItem icon={<CalendarClock className="h-4 w-4" />} label="Delivered" value={formatDate(log.deliveredAt)} />
                  <SummaryItem icon={<RefreshCw className="h-4 w-4" />} label="Retry Count" value={log.retryCount} />
                  <div className="sm:col-span-2 lg:col-span-2">
                    <SummaryItem icon={<CalendarClock className="h-4 w-4" />} label="Failed At" value={formatDate(log.failedAt)} />
                  </div>
                </div>
              </section>

              {(log.status === 'FAILED' || log.status === 'BOUNCED') && (
                <section>
                  <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-red-500">
                    <span className="h-px w-6 bg-red-200 dark:bg-red-500/20" />
                    Diagnostic Failure
                  </h3>
                  <div className="space-y-4">
                    <SummaryItem icon={<Mail className="h-4 w-4 text-red-500" />} label="Reason code" value={formatEnum(log.failureReason ?? 'UNKNOWN')} />
                    {log.errorMessage && (
                      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 dark:border-red-500/20 dark:bg-red-500/5">
                        <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-red-600 dark:text-red-400">Stack Trace / Message</h4>
                        <pre className="audit-scrollbar max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-4 font-mono text-[11px] leading-5 text-red-900 shadow-inner dark:bg-black/40 dark:text-red-300">
                          {log.errorMessage}
                        </pre>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {log.emailPreview && (
                <section>
                  <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-[#A3B19B]">
                    <span className="h-px w-6 bg-gray-200 dark:bg-white/10" />
                    Content Preview
                  </h3>
                  <div className="audit-scrollbar max-h-[500px] overflow-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141A13]/80 sm:p-8">
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-a:text-[#D6B53B] prose-a:no-underline hover:prose-a:underline"
                      dangerouslySetInnerHTML={{ __html: log.emailPreview }} 
                    />
                  </div>
                </section>
              )}

              {isSuperAdmin && (
                <section>
                  <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-[#A3B19B]">
                    <span className="h-px w-6 bg-gray-200 dark:bg-white/10" />
                    Developer Data
                  </h3>
                  <JsonBlock title="Full Payload Signature" value={log.payloadSummary} />
                </section>
              )}
            </div>
          )}
        </div>

        {canResend && (
          <div className="shrink-0 border-t border-[#D6B53B]/10 bg-white/95 px-6 py-5 backdrop-blur-xl dark:bg-[#1C1D21]/95 sm:px-8">
            <button
              type="button"
              onClick={() => log && onResend(log)}
              disabled={isResending}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a1f18] to-[#2c3529] px-6 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-[#D6B53B]/20 disabled:scale-100 disabled:cursor-wait disabled:opacity-70 dark:from-[#D6B53B] dark:to-[#E8D579] dark:text-[#1a1f18]"
            >
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
              <RefreshCw className={`h-5 w-5 ${isResending ? 'animate-spin' : 'transition-transform group-hover:rotate-180'}`} />
              {isResending ? 'Initiating Resend Protocol...' : 'Resend Email Payload'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
