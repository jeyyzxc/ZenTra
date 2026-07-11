'use client';

import React from 'react';
import { ArrowDown, ArrowUp, Eye, Inbox, MailX } from 'lucide-react';
import type { EmailLogListItem, EmailLogSort } from '../types';
import EmailLogStatusBadge from './EmailLogStatusBadge';

const COLUMNS = [
  { key: 'createdAt', label: 'Time / Date' },
  { key: 'recipientEmail', label: 'Recipient' },
  { key: 'emailType', label: 'Email Type' },
  { key: 'relatedRecord', label: 'Related Record', sortable: false },
  { key: 'subject', label: 'Subject' },
  { key: 'triggerSource', label: 'Trigger Source' },
  { key: 'workflowName', label: 'Workflow', sortable: false },
  { key: 'status', label: 'Status' },
  { key: 'retryCount', label: 'Retry Count' },
  { key: 'lastAttemptAt', label: 'Last Attempt' },
] as const;

type EmailColumn = (typeof COLUMNS)[number];

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatEnum(value: string | null) {
  return value ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\bN8n\b/g, 'n8n').replace(/\bAi\b/g, 'AI') : '-';
}

function relatedRecord(log: EmailLogListItem) {
  if (!log.relatedModule && !log.relatedRecordId) {
    return '-';
  }

  return `${formatEnum(log.relatedModule)} - ${log.relatedRecordId ?? 'unlinked'}`;
}

function SortButton({
  column,
  onSort,
  sort,
}: {
  column: EmailColumn;
  onSort: (field: string) => void;
  sort: EmailLogSort;
}) {
  const isSortable = !('sortable' in column && column.sortable === false);
  const isActive = sort.sortBy === column.key;

  if (!isSortable) {
    return (
      <span className="text-left text-[11px] font-bold uppercase tracking-[0.13em] text-gray-500 dark:text-[#A3B19B]">
        {column.label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSort(column.key)}
      className="inline-flex items-center gap-1 text-left text-[11px] font-bold uppercase tracking-[0.13em] text-gray-500 transition hover:text-[#8E7722] dark:text-[#A3B19B] dark:hover:text-[#D6B53B]"
    >
      {column.label}
      {isActive && (
        sort.sortOrder === 'asc'
          ? <ArrowUp className="h-3.5 w-3.5" />
          : <ArrowDown className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 7 }).map((_, index) => (
        <tr key={index} className="animate-pulse border-b border-gray-100 dark:border-white/10">
          {COLUMNS.map((column) => (
            <td key={column.key} className="px-4 py-4">
              <div className="h-4 rounded-full bg-gray-100 dark:bg-white/10" />
            </td>
          ))}
          <td className="px-4 py-4">
            <div className="ml-auto h-9 w-9 rounded-full bg-gray-100 dark:bg-white/10" />
          </td>
        </tr>
      ))}
    </>
  );
}

export default function EmailLogTable({
  isLoading,
  logs,
  onSelectLog,
  onSort,
  sort,
}: {
  isLoading: boolean;
  logs: EmailLogListItem[];
  onSelectLog: (log: EmailLogListItem) => void;
  onSort: (field: string) => void;
  sort: EmailLogSort;
}) {
  if (!isLoading && logs.length === 0) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-14 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-[#FDF5CC] text-[#8E7722] shadow-inner dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
          <MailX className="h-9 w-9" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No email logs yet</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
          Automated email activity will appear here once the system sends booking confirmations,
          contract links, payment reminders, inquiry replies, or workflow-triggered messages.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="min-w-[1500px] w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-gray-50/90 shadow-sm backdrop-blur dark:bg-[#1C1D21]/90">
            <tr className="border-b border-gray-100 dark:border-white/10">
              {COLUMNS.map((column) => (
                <th key={column.key} className="px-4 py-4">
                  <SortButton column={column} onSort={onSort} sort={sort} />
                </th>
              ))}
              <th className="px-4 py-4 text-right text-[11px] font-bold uppercase tracking-[0.13em] text-gray-500 dark:text-[#A3B19B]">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/10">
            {isLoading ? (
              <SkeletonRows />
            ) : logs.map((log) => (
              <tr
                key={log.id}
                onClick={() => onSelectLog(log)}
                className="group cursor-pointer bg-white transition hover:bg-[#FDF5CC]/60 dark:bg-[#1C1D21] dark:hover:bg-white/5"
              >
                <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {formatDate(log.createdAt)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FDF5CC] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
                      <Inbox className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-gray-900 dark:text-white">{log.recipientEmail}</div>
                      <div className="truncate text-xs text-gray-500 dark:text-gray-400">{log.recipientName ?? '-'}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {formatEnum(log.emailType)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700 dark:text-gray-200">
                  {relatedRecord(log)}
                </td>
                <td className="max-w-[340px] px-4 py-4 text-sm text-gray-700 dark:text-gray-200">
                  <span className="line-clamp-2">{log.subject}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {formatEnum(log.triggerSource)}
                </td>
                <td className="max-w-[220px] px-4 py-4 text-sm text-gray-500 dark:text-[#A3B19B]">
                  <span className="line-clamp-1">{log.workflowName ?? '-'}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <EmailLogStatusBadge status={log.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-gray-700 dark:text-gray-200">
                  {log.retryCount}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-[#A3B19B]">
                  {formatDate(log.lastAttemptAt)}
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition group-hover:bg-gray-100 group-hover:text-[#8E7722] dark:group-hover:bg-white/10 dark:group-hover:text-[#D6B53B]">
                    <Eye className="h-4 w-4" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
