'use client';

import React from 'react';
import { ArrowDown, ArrowUp, ClipboardList, Eye, FileSearch } from 'lucide-react';
import type { AuditLogListItem, AuditSort } from '../types';

const STATUS_STYLES: Record<string, string> = {
  SUCCESS: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  FAILED: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
  WARNING: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  INFO: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
};

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  LOGIN: 'bg-[#FDF5CC] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]',
  LOGOUT: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
  LOGIN_FAILED: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  PASSWORD_CHANGE: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
  PROFILE_UPDATE: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  ROLE_ASSIGNMENT: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
  EXPORT: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  ERROR: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
};

const COLUMNS = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'userName', label: 'User', superadminOnly: true },
  { key: 'userRole', label: 'Role', superadminOnly: true },
  { key: 'action', label: 'Action' },
  { key: 'module', label: 'Module' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'ipAddress', label: 'IP Address', superadminOnly: true },
] as const;

type AuditColumn = (typeof COLUMNS)[number];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatEnum(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\bN8n\b/g, 'n8n').replace(/\bAi\b/g, 'AI');
}

function formatRole(value: string) {
  return value === 'SUPERADMIN' ? 'Super Admin' : formatEnum(value);
}

function SortButton({
  column,
  onSort,
  sort,
}: {
  column: AuditColumn;
  onSort: (field: string) => void;
  sort: AuditSort;
}) {
  const isActive = sort.sortBy === column.key;

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

function SkeletonRows({ columns }: { columns: AuditColumn[] }) {
  return (
    <>
      {Array.from({ length: 7 }).map((_, index) => (
        <tr key={index} className="animate-pulse border-b border-gray-100 dark:border-white/10">
          {columns.map((column) => (
            <td key={column.key} className="px-4 py-4">
              <div className="h-4 rounded-full bg-gray-100 dark:bg-white/10" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function AuditLogTable({
  isLoading,
  isSuperAdmin,
  logs,
  onSelectLog,
  onSort,
  sort,
}: {
  isLoading: boolean;
  isSuperAdmin: boolean;
  logs: AuditLogListItem[];
  onSelectLog: (log: AuditLogListItem) => void;
  onSort: (field: string) => void;
  sort: AuditSort;
}) {
  const columns = COLUMNS.filter((column) => (
    isSuperAdmin || !('superadminOnly' in column && column.superadminOnly)
  ));

  if (!isLoading && logs.length === 0) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-14 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-[#FDF5CC] text-[#8E7722] shadow-inner dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
          <FileSearch className="h-9 w-9" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No audit logs found</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
          Nothing matches the current filters yet. Try widening the date range or clearing filters.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className={`${isSuperAdmin ? 'min-w-[1120px]' : 'min-w-[820px]'} w-full border-collapse text-left`}>
          <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur dark:bg-[#1C1D21]/90 shadow-sm">
            <tr className="border-b border-gray-100 dark:border-white/10">
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-4">
                  <SortButton column={column} onSort={onSort} sort={sort} />
                </th>
              ))}
              <th className="px-4 py-4 text-right text-[11px] font-bold uppercase tracking-[0.13em] text-gray-500 dark:text-[#A3B19B]">
                Detail
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/10">
            {isLoading ? (
              <SkeletonRows columns={columns} />
            ) : logs.map((log) => (
              <tr
                key={log.id}
                onClick={() => onSelectLog(log)}
                className="group cursor-pointer transition hover:bg-[#FDF5CC]/60 dark:hover:bg-white/5 bg-white dark:bg-[#1C1D21]"
              >
                <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {formatDate(log.timestamp)}
                </td>
                {isSuperAdmin && (
                  <>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FDF5CC] text-sm font-bold text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
                          {log.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-gray-900 dark:text-white">{log.userName}</div>
                          <div className="truncate text-xs text-gray-500 dark:text-gray-400">{log.userId ?? 'system'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {formatRole(log.userRole)}
                    </td>
                  </>
                )}
                <td className="whitespace-nowrap px-4 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${ACTION_STYLES[log.action] ?? 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300'}`}>
                    {formatEnum(log.action)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {log.module}
                </td>
                <td className="max-w-[360px] px-4 py-4 text-sm text-gray-700 dark:text-gray-200">
                  <span className="line-clamp-2">{log.description}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[log.status]}`}>
                    {formatEnum(log.status)}
                  </span>
                </td>
                {isSuperAdmin && (
                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-[#A3B19B]">
                  {log.ipAddress ?? '—'}
                </td>
                )}
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

      {!isLoading && logs.length > 0 && (
        <div className="flex shrink-0 items-center gap-2 border-t border-gray-100 bg-gray-50/60 px-4 py-3 text-xs font-semibold text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]">
          <ClipboardList className="h-4 w-4 text-[#D6B53B]" />
          {isSuperAdmin
            ? 'Click any row to inspect request metadata and value changes.'
            : 'Click any row to inspect activity details and value changes.'}
        </div>
      )}
    </div>
  );
}
