'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, Plus, RefreshCw } from 'lucide-react';
import BookingCreateModal from './BookingCreateModal';
import BookingDetail from './BookingDetail';
import BookingFilters from './BookingFilters';
import BookingPagination from './BookingPagination';
import BookingTable from './BookingTable';
import type {
  BookingDetailItem,
  BookingFilters as BookingFiltersType,
  BookingListItem,
  BookingListResponse,
  BookingPagination as Pagination,
  BookingSort,
} from '../types';

const EMPTY_FILTERS: BookingFiltersType = {
  search: '',
  startDate: '',
  endDate: '',
  status: '',
  paymentStatus: '',
  source: '',
  syncStatus: '',
  automationStatus: '',
  coordinator: '',
  eventType: '',
};

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  limit: 10,
  totalRecords: 0,
  totalPages: 1,
};

function dateToIso(value: string, boundary: 'start' | 'end') {
  if (!value) return '';
  return new Date(`${value}${boundary === 'start' ? 'T00:00:00.000' : 'T23:59:59.999'}`).toISOString();
}

export default function BookingsClient({
  automationOptions,
  coordinatorOptions,
  currentUserRole,
  eventTypeOptions,
  paymentOptions,
  sourceOptions,
  statusOptions,
  syncOptions,
}: {
  automationOptions: string[];
  coordinatorOptions: string[];
  currentUserRole: 'SUPERADMIN' | 'ADMIN';
  eventTypeOptions: string[];
  paymentOptions: string[];
  sourceOptions: string[];
  statusOptions: string[];
  syncOptions: string[];
}) {
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [filters, setFilters] = useState<BookingFiltersType>(() => ({
    ...EMPTY_FILTERS,
    search: searchParams.get('search') ?? '',
    status: searchParams.get('status') ?? '',
    paymentStatus: searchParams.get('paymentStatus') ?? '',
    source: searchParams.get('source') ?? '',
    syncStatus: searchParams.get('syncStatus') ?? '',
    automationStatus: searchParams.get('automationStatus') ?? '',
    coordinator: searchParams.get('coordinator') ?? '',
    eventType: searchParams.get('eventType') ?? '',
  }));
  const [sort, setSort] = useState<BookingSort>({ sortBy: 'updatedAt', sortOrder: 'desc' });
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetailItem | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const isSuperAdmin = currentUserRole === 'SUPERADMIN';

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: String(pagination.limit),
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    });

    if (filters.search.trim()) params.set('search', filters.search.trim());
    if (filters.startDate) params.set('startDate', dateToIso(filters.startDate, 'start'));
    if (filters.endDate) params.set('endDate', dateToIso(filters.endDate, 'end'));
    if (filters.status) params.set('status', filters.status);
    if (filters.paymentStatus) params.set('paymentStatus', filters.paymentStatus);
    if (filters.source) params.set('source', filters.source);
    if (filters.syncStatus) params.set('syncStatus', filters.syncStatus);
    if (filters.automationStatus) params.set('automationStatus', filters.automationStatus);
    if (filters.coordinator) params.set('coordinator', filters.coordinator);
    if (filters.eventType) params.set('eventType', filters.eventType);
    return params;
  }, [filters, pagination.limit, pagination.page, sort.sortBy, sort.sortOrder]);

  const loadBookings = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/bookings?${buildQuery().toString()}`, { cache: 'no-store' });
      const payload = await response.json() as BookingListResponse | { error?: string };

      if (!response.ok || !('bookings' in payload)) {
        throw new Error('error' in payload && payload.error ? payload.error : 'Unable to load bookings.');
      }

      setBookings(payload.bookings);
      setPagination(payload.pagination);
      setLastUpdated(new Date());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load bookings.');
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [buildQuery]);

  const loadBookingDetail = useCallback(async (id: string) => {
    setIsDetailLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/bookings/${id}`, { cache: 'no-store' });
      const payload = await response.json() as { booking?: BookingDetailItem; error?: string };

      if (!response.ok || !payload.booking) {
        throw new Error(payload.error || 'Unable to load this booking.');
      }

      setSelectedBooking(payload.booking);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load this booking.');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadBookings();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [loadBookings]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadBookings(true);
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [loadBookings]);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters],
  );

  const changeFilter = (key: keyof BookingFiltersType, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const changeSort = (sortBy: string) => {
    setSort((current) => ({
      sortBy,
      sortOrder: current.sortBy === sortBy && current.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const selectBooking = (booking: BookingListItem) => {
    setSelectedId(booking.id);
    setSelectedBooking(null);
    void loadBookingDetail(booking.id);
  };

  const reloadSelected = async () => {
    await loadBookings(true);
    if (selectedId) await loadBookingDetail(selectedId);
  };

  return (
    <div className="mx-auto flex w-full flex-col font-sans text-[#1a1f18] dark:text-[#F4F4F0]">
      <div className="flex flex-col justify-between gap-5 px-4 pt-4 sm:px-6 xl:flex-row xl:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D6B53B]/30 bg-[#FDF5CC] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Central Operations Hub
          </div>
          <h1 className="font-sahitya text-3xl font-bold uppercase tracking-[0.08em]">Booking Management</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
            Monitor reservations, schedules, payments, contracts, and automation from one operational view.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white px-4 py-2 text-xs font-semibold text-gray-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]">
            <CalendarDays className="h-4 w-4 text-[#D6B53B]" />
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Syncing...'}
          </div>
          <button
            type="button"
            onClick={() => void loadBookings()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6B53B]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#8E7722] hover:bg-[#FDF5CC] dark:bg-white/5 dark:text-[#D6B53B]"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a1f18] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#D6B53B]"
          >
            <Plus className="h-4 w-4" />
            New Booking
          </button>
        </div>
      </div>

      <section className="mt-6 border-t border-[#D6B53B]/20 bg-[#FDF5CC]/70 px-4 py-4 shadow-[0_18px_60px_rgba(142,119,34,0.08)] dark:border-white/10 dark:bg-[#141A13] sm:px-6">
        <BookingFilters
          activeFilterCount={activeFilterCount}
          automationOptions={automationOptions}
          coordinatorOptions={coordinatorOptions}
          eventTypeOptions={eventTypeOptions}
          filters={filters}
          onChange={changeFilter}
          onClear={() => {
            setFilters(EMPTY_FILTERS);
            setPagination((current) => ({ ...current, page: 1 }));
          }}
          paymentOptions={paymentOptions}
          sourceOptions={sourceOptions}
          statusOptions={statusOptions}
          syncOptions={syncOptions}
        />

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#1C1D21]">
          <BookingTable
            bookings={bookings}
            isLoading={isLoading}
            onSelect={selectBooking}
            onSort={changeSort}
            sort={sort}
          />
          <BookingPagination
            pagination={pagination}
            onPageChange={(page) => setPagination((current) => ({ ...current, page }))}
            onPageSizeChange={(limit) => setPagination((current) => ({ ...current, page: 1, limit }))}
          />
        </div>
      </section>

      <BookingCreateModal
        coordinatorOptions={coordinatorOptions}
        eventTypeOptions={eventTypeOptions}
        isOpen={isCreateOpen}
        isSuperAdmin={isSuperAdmin}
        onClose={() => setIsCreateOpen(false)}
        onCreated={async (bookingId) => {
          await loadBookings(true);
          setSelectedId(bookingId);
          setSelectedBooking(null);
          await loadBookingDetail(bookingId);
        }}
      />

      <BookingDetail
        key={`${selectedId ?? 'none'}-${selectedBooking?.updatedAt ?? 'loading'}`}
        booking={selectedBooking}
        coordinatorOptions={coordinatorOptions}
        eventTypeOptions={eventTypeOptions}
        isLoading={isDetailLoading}
        isOpen={Boolean(selectedId)}
        isSuperAdmin={isSuperAdmin}
        onClose={() => {
          setSelectedId(null);
          setSelectedBooking(null);
        }}
        onReload={reloadSelected}
        paymentOptions={paymentOptions}
        statusOptions={statusOptions}
      />
    </div>
  );
}
