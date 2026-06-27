'use client';

import React from 'react';
import { ArrowDown, ArrowUp, Eye, FileSearch } from 'lucide-react';
import type { BookingListItem, BookingSort } from '../types';
import BookingStatusBadge from './BookingStatusBadge';

const COLUMNS = [
  { key: 'bookingReference', label: 'Booking Ref' },
  { key: 'clientName', label: 'Client' },
  { key: 'eventTitle', label: 'Event' },
  { key: 'eventDate', label: 'Event Date' },
  { key: 'status', label: 'Status' },
  { key: 'paymentSummaryStatus', label: 'Payment' },
  { key: 'bookingSource', label: 'Source' },
  { key: 'syncStatus', label: 'Sync' },
  { key: 'automationStatus', label: 'Automation' },
  { key: 'assignedCoordinator', label: 'Coordinator' },
  { key: 'updatedAt', label: 'Last Updated' },
] as const;

function formatDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat('en', includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(new Date(value));
}

function SortButton({
  column,
  onSort,
  sort,
}: {
  column: (typeof COLUMNS)[number];
  onSort: (key: string) => void;
  sort: BookingSort;
}) {
  const active = sort.sortBy === column.key;

  return (
    <button
      type="button"
      onClick={() => onSort(column.key)}
      className="inline-flex items-center gap-1 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500 hover:text-[#8E7722] dark:text-[#A3B19B] dark:hover:text-[#D6B53B]"
    >
      {column.label}
      {active && (sort.sortOrder === 'asc'
        ? <ArrowUp className="h-3.5 w-3.5" />
        : <ArrowDown className="h-3.5 w-3.5" />)}
    </button>
  );
}

export default function BookingTable({
  bookings,
  isLoading,
  onSelect,
  onSort,
  sort,
}: {
  bookings: BookingListItem[];
  isLoading: boolean;
  onSelect: (booking: BookingListItem) => void;
  onSort: (key: string) => void;
  sort: BookingSort;
}) {
  if (!isLoading && bookings.length === 0) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-14 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-[#FDF5CC] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
          <FileSearch className="h-9 w-9" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No bookings found</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-[#A3B19B]">Try clearing or widening the current filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1680px] w-full border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur dark:bg-[#1C1D21]/95">
          <tr className="border-b border-gray-100 dark:border-white/10">
            {COLUMNS.map((column) => (
              <th key={column.key} className="px-4 py-4">
                <SortButton column={column} onSort={onSort} sort={sort} />
              </th>
            ))}
            <th className="px-4 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-[#A3B19B]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/10">
          {isLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  {Array.from({ length: 12 }).map((__, cell) => (
                    <td key={cell} className="px-4 py-4">
                      <div className="h-4 rounded-full bg-gray-100 dark:bg-white/10" />
                    </td>
                  ))}
                </tr>
              ))
            : bookings.map((booking) => (
                <tr
                  key={booking.id}
                  onClick={() => onSelect(booking)}
                  className="group cursor-pointer bg-white transition hover:bg-[#FDF5CC]/45 dark:bg-[#1C1D21] dark:hover:bg-white/5"
                >
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-black text-[#8E7722] dark:text-[#D6B53B]">{booking.bookingReference}</td>
                  <td className="max-w-56 px-4 py-4">
                    <div className="truncate text-sm font-bold text-gray-900 dark:text-white">{booking.clientName}</div>
                    <div className="truncate text-xs text-gray-400">{booking.clientEmail ?? 'No email'}</div>
                  </td>
                  <td className="max-w-60 px-4 py-4">
                    <div className="truncate text-sm font-bold text-gray-900 dark:text-white">{booking.eventTitle}</div>
                    <div className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/10 dark:text-gray-300">{booking.eventType}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">{formatDate(booking.eventDate)}</td>
                  <td className="px-4 py-4"><BookingStatusBadge kind="booking" value={booking.status} /></td>
                  <td className="px-4 py-4"><BookingStatusBadge kind="payment" value={booking.paymentSummaryStatus} /></td>
                  <td className="px-4 py-4"><BookingStatusBadge kind="source" value={booking.bookingSource} /></td>
                  <td className="px-4 py-4"><BookingStatusBadge kind="sync" value={booking.syncStatus} /></td>
                  <td className="px-4 py-4"><BookingStatusBadge kind="automation" value={booking.automationStatus} /></td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{booking.assignedCoordinator ?? 'Unassigned'}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-[#A3B19B]">{formatDate(booking.updatedAt, true)}</td>
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(booking);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition group-hover:bg-white group-hover:text-[#8E7722] dark:group-hover:bg-white/10 dark:group-hover:text-[#D6B53B]"
                      aria-label={`View ${booking.bookingReference}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
