'use client';

import React from 'react';
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AuditPagination } from '../types';

export default function AuditLogPagination({
  onPageChange,
  onPageSizeChange,
  pagination,
  recordCountLabel,
}: {
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  pagination: AuditPagination;
  recordCountLabel: string;
}) {
  const canGoBack = pagination.page > 1;
  const canGoForward = pagination.page < pagination.totalPages;
  const startRecord = pagination.totalRecords === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.totalRecords);

  return (
    <div className="flex flex-col justify-between gap-4 border-t border-gray-100 px-4 py-4 dark:border-white/10 lg:flex-row lg:items-center">
      <div className="text-sm text-gray-500 dark:text-[#A3B19B]">
        <span className="font-bold text-gray-900 dark:text-white">{recordCountLabel}: {pagination.totalRecords}</span>
        <span className="mx-2">|</span>
        Showing <span className="font-bold text-gray-900 dark:text-white">{startRecord}</span>-
        <span className="font-bold text-gray-900 dark:text-white">{endRecord}</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-[#A3B19B]">
          Page size
          <select
            value={pagination.limit}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            {[5, 10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={!canGoBack}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-[#FDF5CC] hover:text-[#8E7722] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!canGoBack}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-[#FDF5CC] hover:text-[#8E7722] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-3 text-sm font-bold text-gray-700 dark:text-white">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!canGoForward}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-[#FDF5CC] hover:text-[#8E7722] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(pagination.totalPages)}
            disabled={!canGoForward}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-[#FDF5CC] hover:text-[#8E7722] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
