'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Flag,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';

type TestimonyStatus = 'pending_review' | 'approved' | 'hidden' | 'flagged' | 'deleted';

type AdminTestimony = {
  id: string;
  clientName: string;
  fullName: string;
  nickname: string | null;
  email: string | null;
  eventType: string;
  eventDate: string;
  packageName: string | null;
  bookingReference: string | null;
  bookingId: string | null;
  overallRating: number;
  approachRating: number;
  foodRating: number;
  serviceRating: number;
  venueRating: number | null;
  communicationRating: number | null;
  comment: string;
  photoUrl: string | null;
  status: TestimonyStatus;
  isPublic: boolean;
  isFeatured: boolean;
  submittedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  hiddenBy: string | null;
  hiddenAt: string | null;
  deletedBy: string | null;
  deletedAt: string | null;
  updatedAt: string;
};

type Analytics = {
  total: number;
  pending: number;
  approved: number;
  averages: {
    overall: number;
    approach: number;
    food: number;
    service: number;
  };
  distribution: Array<{ rating: number; count: number }>;
  highestRatedEventType: {
    eventType: string;
    average: number;
    count: number;
  } | null;
};

type Filters = {
  search: string;
  submittedStart: string;
  submittedEnd: string;
  eventStart: string;
  eventEnd: string;
  eventType: string;
  overallRating: string;
  approachRating: string;
  foodRating: string;
  serviceRating: string;
  status: string;
  visibility: string;
  withPhoto: string;
};

const EMPTY_FILTERS: Filters = {
  search: '',
  submittedStart: '',
  submittedEnd: '',
  eventStart: '',
  eventEnd: '',
  eventType: '',
  overallRating: '',
  approachRating: '',
  foodRating: '',
  serviceRating: '',
  status: '',
  visibility: '',
  withPhoto: '',
};

const EMPTY_ANALYTICS: Analytics = {
  total: 0,
  pending: 0,
  approved: 0,
  averages: { overall: 0, approach: 0, food: 0, service: 0 },
  distribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: 0 })),
  highestRatedEventType: null,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function Stars({ value, compact = false }: { value: number; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${value} out of 5 stars`}>
      <Star className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} fill-[#D6B53B] text-[#D6B53B]`} />
      <span className="font-bold text-[#1a1f18] dark:text-[#F4F4F0]">{value.toFixed(1)}</span>
    </span>
  );
}

function StatusBadge({ status }: { status: TestimonyStatus }) {
  const classes: Record<TestimonyStatus, string> = {
    pending_review: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    approved: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    hidden: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300',
    flagged: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300',
    deleted: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${classes[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-[#A3B19B]">{label}</span>
        <span className="font-bold text-[#8E7722] dark:text-[#D6B53B]">{value.toFixed(1)} / 5</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#1a1f18]/8 dark:bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-[#8E7722] to-[#E8D579]" style={{ width: `${Math.max(0, Math.min(100, value * 20))}%` }} />
      </div>
    </div>
  );
}

function RatingSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-[#A3B19B]">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[#1a1f18] outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#141A13] dark:text-[#F4F4F0]">
        <option value="">Any rating</option>
        {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
      </select>
    </label>
  );
}

export default function TestimonyManagementClient({ currentUserRole }: { currentUserRole: 'SUPERADMIN' | 'ADMIN' }) {
  const searchParams = useSearchParams();
  const [testimonies, setTestimonies] = useState<AdminTestimony[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>(EMPTY_ANALYTICS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalRecords: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<AdminTestimony | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters, limit, page]);

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    setError('');

    try {
      const [listResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/admin/testimonies?${query}`, { cache: 'no-store' }),
        fetch('/api/admin/testimonies/analytics', { cache: 'no-store' }),
      ]);
      const listPayload = await listResponse.json() as {
        testimonies?: AdminTestimony[];
        pagination?: typeof pagination;
        filterOptions?: { eventTypes: string[] };
        error?: string;
      };
      const analyticsPayload = await analyticsResponse.json() as { analytics?: Analytics; error?: string };

      if (!listResponse.ok) throw new Error(listPayload.error || 'Unable to load testimonies.');
      if (!analyticsResponse.ok) throw new Error(analyticsPayload.error || 'Unable to load analytics.');

      setTestimonies(listPayload.testimonies ?? []);
      setPagination(listPayload.pagination ?? { page: 1, totalPages: 1, totalRecords: 0 });
      setEventTypes(listPayload.filterOptions?.eventTypes ?? []);
      setAnalytics(analyticsPayload.analytics ?? EMPTY_ANALYTICS);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load testimony management.');
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [query]);

  const loadDetail = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/testimonies/${encodeURIComponent(id)}`, { cache: 'no-store' });
      const payload = await response.json() as { testimony?: AdminTestimony; error?: string };
      if (!response.ok || !payload.testimony) throw new Error(payload.error || 'Unable to load testimony details.');
      setSelected(payload.testimony);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load testimony details.');
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadData(), 180);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  useEffect(() => {
    const selectedId = searchParams.get('selected');
    if (!selectedId) return;
    const timeout = window.setTimeout(() => void loadDetail(selectedId), 0);
    return () => window.clearTimeout(timeout);
  }, [loadDetail, searchParams]);

  useEffect(() => {
    const interval = window.setInterval(() => void loadData(true), 30_000);
    return () => window.clearInterval(interval);
  }, [loadData]);

  const changeFilter = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const mutate = async (
    testimony: AdminTestimony,
    action: 'approve' | 'hide' | 'flag' | 'delete' | 'restore' | 'feature',
    featured?: boolean,
  ) => {
    if (action === 'delete' && !window.confirm('Soft delete this testimony? The record will remain available to administrators.')) return;

    setIsMutating(`${testimony.id}:${action}`);
    setError('');
    try {
      const endpoint = action === 'delete'
        ? `/api/admin/testimonies/${encodeURIComponent(testimony.id)}`
        : `/api/admin/testimonies/${encodeURIComponent(testimony.id)}/${action}`;
      const response = await fetch(endpoint, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: action === 'feature' ? { 'content-type': 'application/json' } : undefined,
        body: action === 'feature' ? JSON.stringify({ featured }) : undefined,
      });
      const payload = await response.json() as { testimony?: AdminTestimony; error?: string };
      if (!response.ok) throw new Error(payload.error || `Unable to ${action} testimony.`);

      if (selected?.id === testimony.id && payload.testimony) setSelected(payload.testimony);
      await loadData(true);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : `Unable to ${action} testimony.`);
    } finally {
      setIsMutating('');
    }
  };

  const activeFilters = Object.values(filters).filter(Boolean).length;
  const maxDistribution = Math.max(...analytics.distribution.map((item) => item.count), 1);
  const summaryCards = [
    { label: 'Total Testimonies', value: analytics.total, note: 'All submitted feedback' },
    { label: 'Pending Review', value: analytics.pending, note: 'Awaiting moderation' },
    { label: 'Approved', value: analytics.approved, note: 'Publicly visible' },
    { label: 'Average Overall', value: analytics.averages.overall.toFixed(1), note: 'Approved testimonies' },
    { label: 'Average Food', value: analytics.averages.food.toFixed(1), note: 'Food satisfaction' },
    { label: 'Average Service', value: analytics.averages.service.toFixed(1), note: 'Service execution' },
    { label: 'Average Approach', value: analytics.averages.approach.toFixed(1), note: 'Staff professionalism' },
    {
      label: 'Highest Rated Event',
      value: analytics.highestRatedEventType?.eventType ?? '—',
      note: analytics.highestRatedEventType ? `${analytics.highestRatedEventType.average.toFixed(1)} average` : 'No approved data yet',
    },
  ];

  return (
    <div className="mx-auto flex w-full flex-col gap-6 font-sans text-[#1a1f18] dark:text-[#F4F4F0]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D6B53B]/30 bg-[#FDF5CC] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
            <MessageSquareQuote className="h-3.5 w-3.5" />
            Customer Voice
          </div>
          <h1 className="font-sahitya text-3xl font-bold uppercase tracking-[0.08em]">Testimony Management</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
            Review client feedback, manage public testimonies, and track customer satisfaction ratings.
          </p>
        </div>
        <button type="button" onClick={() => void loadData()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6B53B]/30 bg-white px-5 py-2.5 text-sm font-bold text-[#8E7722] shadow-sm hover:bg-[#FDF5CC] dark:bg-white/5 dark:text-[#D6B53B]">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 2xl:grid-cols-8">
        {summaryCards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-[#D6B53B]/20 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8E7722] dark:text-[#D6B53B]">{card.label}</p>
            <p className={`mt-2 font-sahitya font-bold ${typeof card.value === 'string' && card.value.length > 8 ? 'text-lg' : 'text-3xl'}`}>{card.value}</p>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-[#A3B19B]">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#D6B53B]/20 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="font-sahitya text-xl font-bold">Rating progress</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Progress label="Overall" value={analytics.averages.overall} />
            <Progress label="Approach" value={analytics.averages.approach} />
            <Progress label="Food" value={analytics.averages.food} />
            <Progress label="Service" value={analytics.averages.service} />
          </div>
        </div>
        <div className="rounded-2xl border border-[#D6B53B]/20 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="font-sahitya text-xl font-bold">Overall rating distribution</h2>
          <div className="mt-4 space-y-2.5">
            {analytics.distribution.map((item) => (
              <div key={item.rating} className="flex items-center gap-3">
                <span className="flex w-10 items-center gap-1 text-xs font-bold">{item.rating}<Star className="h-3 w-3 fill-[#D6B53B] text-[#D6B53B]" /></span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#1a1f18]/8 dark:bg-white/10">
                  <div className="h-full rounded-full bg-[#D6B53B]" style={{ width: `${(item.count / maxDistribution) * 100}%` }} />
                </div>
                <span className="w-7 text-right text-xs font-bold text-gray-500">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#D6B53B]/20 bg-[#FDF5CC]/55 p-4 shadow-[0_18px_60px_rgba(142,119,34,0.08)] dark:border-white/10 dark:bg-[#141A13]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <input value={filters.search} onChange={(event) => changeFilter('search', event.target.value)} placeholder="Search name, comment, event type, or booking reference" className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1C1D21]" />
          </label>
          <select value={filters.eventType} onChange={(event) => changeFilter('eventType', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1C1D21]">
            <option value="">All event types</option>
            {eventTypes.map((eventType) => <option key={eventType}>{eventType}</option>)}
          </select>
          <select value={filters.status} onChange={(event) => changeFilter('status', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1C1D21]">
            <option value="">All statuses</option>
            <option value="pending_review">Pending review</option>
            <option value="approved">Approved</option>
            <option value="hidden">Hidden</option>
            <option value="flagged">Flagged</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-[#A3B19B]">
            Submitted from
            <input type="date" value={filters.submittedStart} onChange={(event) => changeFilter('submittedStart', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-[#1C1D21]" />
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-[#A3B19B]">
            Submitted to
            <input type="date" value={filters.submittedEnd} onChange={(event) => changeFilter('submittedEnd', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-[#1C1D21]" />
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-[#A3B19B]">
            Event from
            <input type="date" value={filters.eventStart} onChange={(event) => changeFilter('eventStart', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-[#1C1D21]" />
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-[#A3B19B]">
            Event to
            <input type="date" value={filters.eventEnd} onChange={(event) => changeFilter('eventEnd', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-[#1C1D21]" />
          </label>
          <select value={filters.visibility} onChange={(event) => changeFilter('visibility', event.target.value)} className="self-end rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#1C1D21]">
            <option value="">Any visibility</option>
            <option value="public">Public</option>
            <option value="hidden">Not public</option>
          </select>
          <select value={filters.withPhoto} onChange={(event) => changeFilter('withPhoto', event.target.value)} className="self-end rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#1C1D21]">
            <option value="">Photo or no photo</option>
            <option value="true">With photo</option>
            <option value="false">Without photo</option>
          </select>
          <button type="button" onClick={() => { setFilters(EMPTY_FILTERS); setPage(1); }} className="self-end rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]">
            Clear {activeFilters ? `(${activeFilters})` : ''}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <RatingSelect label="Overall rating" value={filters.overallRating} onChange={(value) => changeFilter('overallRating', value)} />
          <RatingSelect label="Approach rating" value={filters.approachRating} onChange={(value) => changeFilter('approachRating', value)} />
          <RatingSelect label="Food rating" value={filters.foodRating} onChange={(value) => changeFilter('foodRating', value)} />
          <RatingSelect label="Service rating" value={filters.serviceRating} onChange={(value) => changeFilter('serviceRating', value)} />
        </div>

        {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>}

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#1C1D21]">
          <div className="overflow-x-auto">
            <table className="min-w-[1380px] w-full text-left">
              <thead className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]">
                <tr>
                  {['Submitted Date', 'Client', 'Event Type', 'Event Date', 'Overall Rating', 'Approach', 'Food', 'Service', 'Status', 'Visibility', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {isLoading ? (
                  <tr><td colSpan={11} className="h-64 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#D6B53B]" /></td></tr>
                ) : testimonies.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-20 text-center">
                      <MessageSquareQuote className="mx-auto h-10 w-10 text-[#D6B53B]/60" />
                      <p className="mt-4 font-sahitya text-xl font-bold">No testimonies submitted yet.</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-[#A3B19B]">Client feedback will appear here once users submit their experience.</p>
                    </td>
                  </tr>
                ) : testimonies.map((testimony) => (
                  <tr key={testimony.id} className="text-sm transition hover:bg-[#FDF5CC]/20 dark:hover:bg-white/[0.03]">
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-500">{formatDate(testimony.submittedAt)}</td>
                    <td className="px-4 py-4">
                      <p className="font-bold">{testimony.clientName}</p>
                      {testimony.email && <p className="mt-0.5 max-w-40 truncate text-xs text-gray-400">{testimony.email}</p>}
                    </td>
                    <td className="px-4 py-4 font-semibold">{testimony.eventType}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-500">{formatDate(testimony.eventDate)}</td>
                    <td className="px-4 py-4"><Stars value={testimony.overallRating} compact /></td>
                    <td className="px-4 py-4"><Stars value={testimony.approachRating} compact /></td>
                    <td className="px-4 py-4"><Stars value={testimony.foodRating} compact /></td>
                    <td className="px-4 py-4"><Stars value={testimony.serviceRating} compact /></td>
                    <td className="px-4 py-4"><StatusBadge status={testimony.status} /></td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${testimony.isPublic ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {testimony.isPublic ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {testimony.isPublic ? 'Public' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setSelected(testimony)} title="View details" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-[#8E7722] dark:hover:bg-white/10"><Eye className="h-4 w-4" /></button>
                        {testimony.status !== 'approved' && testimony.status !== 'deleted' && <button type="button" onClick={() => void mutate(testimony, 'approve')} title="Approve" className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"><Check className="h-4 w-4" /></button>}
                        {testimony.isPublic && <button type="button" onClick={() => void mutate(testimony, 'hide')} title="Hide" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"><EyeOff className="h-4 w-4" /></button>}
                        {!['flagged', 'deleted'].includes(testimony.status) && <button type="button" onClick={() => void mutate(testimony, 'flag')} title="Flag" className="rounded-lg p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10"><Flag className="h-4 w-4" /></button>}
                        {['hidden', 'deleted'].includes(testimony.status) && <button type="button" onClick={() => void mutate(testimony, 'restore')} title="Restore" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"><RotateCcw className="h-4 w-4" /></button>}
                        {testimony.status !== 'deleted' && <button type="button" onClick={() => void mutate(testimony, 'delete')} title="Soft delete" className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
            <p className="text-xs text-gray-500 dark:text-[#A3B19B]">{pagination.totalRecords} testimonies found</p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-gray-200 p-2 disabled:opacity-40 dark:border-white/10"><ChevronLeft className="h-4 w-4" /></button>
              <span className="px-2 text-xs font-bold">Page {pagination.page} of {pagination.totalPages}</span>
              <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-gray-200 p-2 disabled:opacity-40 dark:border-white/10"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/35 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <aside className="h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl dark:bg-[#141A13] md:p-8" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2"><StatusBadge status={selected.status} />{selected.isFeatured && <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF5CC] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8E7722]"><Sparkles className="h-3 w-3" /> Featured</span>}</div>
                <h2 className="mt-3 font-sahitya text-3xl font-bold">{selected.clientName}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-[#A3B19B]">{selected.eventType} · {formatDate(selected.eventDate)}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 dark:bg-white/10"><X className="h-5 w-5" /></button>
            </div>

            {selected.photoUrl && <img src={selected.photoUrl} alt={`${selected.clientName}'s event`} className="mt-6 h-64 w-full rounded-2xl object-cover" />}

            <div className="mt-6 rounded-2xl border border-[#D6B53B]/20 bg-[#FDF5CC]/25 p-5">
              <MessageSquareQuote className="h-7 w-7 text-[#D6B53B]" />
              <p className="mt-3 whitespace-pre-wrap font-serif text-lg leading-8 text-gray-700 dark:text-[#F4F4F0]">“{selected.comment}”</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ['Overall', selected.overallRating],
                ['Approach', selected.approachRating],
                ['Food', selected.foodRating],
                ['Service', selected.serviceRating],
                ['Venue', selected.venueRating],
                ['Communication', selected.communicationRating],
              ].map(([label, value]) => value ? (
                <div key={String(label)} className="rounded-xl border border-gray-100 p-3 dark:border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">{label}</p>
                  <div className="mt-2"><Stars value={Number(value)} /></div>
                </div>
              ) : null)}
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-x-5 gap-y-4 rounded-2xl bg-gray-50 p-5 text-sm dark:bg-white/5 sm:grid-cols-2">
              {[
                ['Full name', selected.fullName],
                ['Email', selected.email || 'Not provided'],
                ['Package', selected.packageName || 'Not provided'],
                ['Booking reference', selected.bookingReference || 'Not provided'],
                ['Submitted', formatDate(selected.submittedAt)],
                ['Visibility', selected.isPublic ? 'Public' : 'Hidden'],
                ['Approved by', selected.approvedBy || '—'],
                ['Hidden by', selected.hiddenBy || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">{label}</dt>
                  <dd className="mt-1 font-semibold">{value}</dd>
                </div>
              ))}
              {selected.bookingId && (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Related booking</dt>
                  <dd className="mt-1"><Link href={`/admin/bookings?selected=${encodeURIComponent(selected.bookingId)}`} className="font-bold text-[#8E7722] hover:underline dark:text-[#D6B53B]">Open booking record</Link></dd>
                </div>
              )}
            </dl>

            <div className="mt-7 flex flex-wrap gap-2">
              {selected.status !== 'approved' && selected.status !== 'deleted' && <button type="button" disabled={Boolean(isMutating)} onClick={() => void mutate(selected, 'approve')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"><Check className="h-4 w-4" />Approve</button>}
              {selected.isPublic && <button type="button" disabled={Boolean(isMutating)} onClick={() => void mutate(selected, 'hide')} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-[#A3B19B]"><EyeOff className="h-4 w-4" />Hide</button>}
              {!['flagged', 'deleted'].includes(selected.status) && <button type="button" disabled={Boolean(isMutating)} onClick={() => void mutate(selected, 'flag')} className="inline-flex items-center gap-2 rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-bold text-orange-700 hover:bg-orange-50 dark:border-orange-500/20 dark:text-orange-300"><Flag className="h-4 w-4" />Flag</button>}
              {['hidden', 'deleted'].includes(selected.status) && <button type="button" disabled={Boolean(isMutating)} onClick={() => void mutate(selected, 'restore')} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-500/20 dark:text-blue-300"><RotateCcw className="h-4 w-4" />Restore</button>}
              {currentUserRole === 'SUPERADMIN' && selected.status === 'approved' && selected.isPublic && <button type="button" disabled={Boolean(isMutating)} onClick={() => void mutate(selected, 'feature', !selected.isFeatured)} className="inline-flex items-center gap-2 rounded-xl border border-[#D6B53B]/40 bg-[#FDF5CC]/60 px-4 py-2.5 text-sm font-bold text-[#8E7722]"><Sparkles className="h-4 w-4" />{selected.isFeatured ? 'Unfeature' : 'Feature'}</button>}
              {selected.status !== 'deleted' && <button type="button" disabled={Boolean(isMutating)} onClick={() => void mutate(selected, 'delete')} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 dark:border-red-500/20 dark:text-red-300"><Trash2 className="h-4 w-4" />Soft delete</button>}
              {isMutating && <Loader2 className="h-5 w-5 animate-spin self-center text-[#D6B53B]" />}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
