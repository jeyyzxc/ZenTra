'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BookingPagination as Pagination } from '../types';

export default function BookingPagination({
  onPageChange,
  onPageSizeChange,
  pagination,
}: {
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  pagination: Pagination;
}) {
  const first = pagination.totalRecords === 0
    ? 0
    : (pagination.page - 1) * pagination.limit + 1;
  const last = Math.min(pagination.page * pagination.limit, pagination.totalRecords);

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/70 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-medium text-gray-500 dark:text-[#A3B19B]">
        Showing {first}-{last} of {pagination.totalRecords} bookings
      </span>
      <div className="flex items-center gap-2">
        <select
          value={pagination.limit}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs font-semibold dark:border-white/10 dark:bg-[#1C1D21]"
        >
          {[10, 20, 50].map((size) => <option key={size} value={size}>{size} / page</option>)}
        </select>
        <button
          type="button"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white disabled:opacity-40 dark:border-white/10 dark:bg-[#1C1D21]"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-20 text-center text-xs font-bold text-gray-600 dark:text-gray-300">
          {pagination.page} / {pagination.totalPages}
        </span>
        <button
          type="button"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white disabled:opacity-40 dark:border-white/10 dark:bg-[#1C1D21]"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
