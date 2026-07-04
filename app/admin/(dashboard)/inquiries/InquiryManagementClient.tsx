'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Clock3,
  Copy,
  ExternalLink,
  Flag,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  X,
} from 'lucide-react';

type InquiryStatus =
  | 'new'
  | 'pending_response'
  | 'answered'
  | 'follow_up'
  | 'converted_to_booking'
  | 'closed'
  | 'spam';
type InquiryPriority = 'low' | 'normal' | 'high';

type InquiryItem = {
  id: string;
  inquiryReference: string;
  fullName: string;
  phoneNumber: string | null;
  email: string;
  preferredContactTime: string | null;
  message: string;
  eventInterest: string | null;
  packageInterest: string | null;
  requestedEventDate: string | null;
  sourcePage: string;
  status: InquiryStatus;
  priority: InquiryPriority;
  assignedTo: string | null;
  relatedBookingId: string | null;
  submittedAt: string;
  answeredAt: string | null;
  closedAt: string | null;
  updatedAt: string;
};

type InquiryDetail = InquiryItem & {
  notes: Array<{
    id: string;
    note: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  }>;
  activity: Array<{
    id: string;
    action: string;
    description: string;
    performedBy: string;
    createdAt: string;
  }>;
  relatedBooking: {
    id: string;
    bookingReference: string;
    eventTitle: string;
    eventDate: string;
    status: string;
  } | null;
};

type Summary = {
  total: number;
  new: number;
  pending: number;
  followUp: number;
  answered: number;
  converted: number;
  highPriority: number;
};

type AdminOption = {
  id: string;
  username: string;
  label: string;
  role: string;
};

type Filters = {
  search: string;
  startDate: string;
  endDate: string;
  status: string;
  priority: string;
  eventInterest: string;
  assignedTo: string;
  preferredContactTime: string;
};

type ConversionForm = {
  eventTitle: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  guestCount: string;
  packageSelected: string;
  specialRequests: string;
  assignedCoordinator: string;
  internalNotes: string;
  conflictOverrideReason: string;
};

const EMPTY_FILTERS: Filters = {
  search: '',
  startDate: '',
  endDate: '',
  status: '',
  priority: '',
  eventInterest: '',
  assignedTo: '',
  preferredContactTime: '',
};

const EMPTY_SUMMARY: Summary = {
  total: 0,
  new: 0,
  pending: 0,
  followUp: 0,
  answered: 0,
  converted: 0,
  highPriority: 0,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function normalizeLabel(value: string) {
  return value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function statusClass(status: InquiryStatus) {
  const classes: Record<InquiryStatus, string> = {
    new: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
    pending_response: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    answered: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    follow_up: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300',
    converted_to_booking: 'border-[#D6B53B]/40 bg-[#FDF5CC] text-[#6D5A18] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]',
    closed: 'border-gray-200 bg-gray-100 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]',
    spam: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
  };
  return classes[status];
}

function priorityClass(priority: InquiryPriority) {
  if (priority === 'high') return 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300';
  if (priority === 'low') return 'border-gray-200 bg-gray-50 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]';
  return 'border-[#D6B53B]/30 bg-[#FDF5CC] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]';
}

function StatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${statusClass(status)}`}>
      {normalizeLabel(status)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: InquiryPriority }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${priorityClass(priority)}`}>
      {priority}
    </span>
  );
}

export default function InquiryManagementClient({
  currentUserRole,
}: {
  currentUserRole: 'SUPERADMIN' | 'ADMIN';
}) {
  const searchParams = useSearchParams();
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [eventInterests, setEventInterests] = useState<string[]>([]);
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalRecords: 0 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<InquiryDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState('');
  const [note, setNote] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [conversionForm, setConversionForm] = useState<ConversionForm | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters, page]);

  const loadList = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    setError('');
    try {
      const [listResponse, summaryResponse] = await Promise.all([
        fetch(`/api/admin/inquiries?${query}`, { cache: 'no-store' }),
        fetch('/api/admin/inquiries/summary', { cache: 'no-store' }),
      ]);
      const listPayload = await listResponse.json() as {
        inquiries?: InquiryItem[];
        pagination?: typeof pagination;
        filterOptions?: {
          eventInterests: string[];
          preferredTimes: string[];
          admins: AdminOption[];
        };
        error?: string;
      };
      const summaryPayload = await summaryResponse.json() as { summary?: Summary; error?: string };

      if (!listResponse.ok) throw new Error(listPayload.error || 'Unable to load inquiries.');
      if (!summaryResponse.ok) throw new Error(summaryPayload.error || 'Unable to load inquiry summary.');

      setInquiries(listPayload.inquiries ?? []);
      setPagination(listPayload.pagination ?? { page: 1, totalPages: 1, totalRecords: 0 });
      setEventInterests(listPayload.filterOptions?.eventInterests ?? []);
      setPreferredTimes(listPayload.filterOptions?.preferredTimes ?? []);
      setAdmins(listPayload.filterOptions?.admins ?? []);
      setSummary(summaryPayload.summary ?? EMPTY_SUMMARY);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load inquiries.');
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [query]);

  const loadDetail = useCallback(async (id: string) => {
    setIsDetailLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/inquiries/${encodeURIComponent(id)}`, { cache: 'no-store' });
      const payload = await response.json() as { inquiry?: InquiryDetail; error?: string };
      if (!response.ok || !payload.inquiry) throw new Error(payload.error || 'Unable to load inquiry details.');
      setSelected(payload.inquiry);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load inquiry details.');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadList(), 150);
    return () => window.clearTimeout(timeout);
  }, [loadList]);

  useEffect(() => {
    const selectedId = searchParams.get('selected');
    if (!selectedId) return;
    const timeout = window.setTimeout(() => void loadDetail(selectedId), 0);
    return () => window.clearTimeout(timeout);
  }, [loadDetail, searchParams]);

  useEffect(() => {
    const interval = window.setInterval(() => void loadList(true), 30_000);
    return () => window.clearInterval(interval);
  }, [loadList]);

  const refreshSelected = async () => {
    await loadList(true);
    if (selected) await loadDetail(selected.id);
  };

  const changeFilter = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const requestAction = async (
    endpoint: string,
    method: 'PATCH' | 'POST',
    body?: Record<string, unknown>,
  ) => {
    setPendingAction(endpoint);
    setError('');
    try {
      const response = await fetch(endpoint, {
        method,
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to update inquiry.');
      await refreshSelected();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to update inquiry.');
    } finally {
      setPendingAction('');
    }
  };

  const setStatus = (status: InquiryStatus) => {
    if (!selected) return;
    void requestAction(
      `/api/admin/inquiries/${encodeURIComponent(selected.id)}/status`,
      'PATCH',
      { status },
    );
  };

  const quickStatus = async (id: string, status: InquiryStatus) => {
    const endpoint = `/api/admin/inquiries/${encodeURIComponent(id)}/status`;
    setPendingAction(endpoint);
    setError('');
    try {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to update inquiry.');
      await loadList(true);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to update inquiry.');
    } finally {
      setPendingAction('');
    }
  };

  const setPriority = (priority: InquiryPriority) => {
    if (!selected) return;
    void requestAction(
      `/api/admin/inquiries/${encodeURIComponent(selected.id)}`,
      'PATCH',
      { priority },
    );
  };

  const assign = (assignedTo: string) => {
    if (!selected) return;
    void requestAction(
      `/api/admin/inquiries/${encodeURIComponent(selected.id)}/assign`,
      'PATCH',
      { assignedTo: assignedTo || null },
    );
  };

  const addNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || !note.trim()) return;
    const endpoint = `/api/admin/inquiries/${encodeURIComponent(selected.id)}/notes`;
    setPendingAction(endpoint);
    setError('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to add internal note.');
      setNote('');
      await refreshSelected();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to add internal note.');
    } finally {
      setPendingAction('');
    }
  };

  const copy = async (label: string, value: string | null) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopyMessage(`${label} copied`);
    window.setTimeout(() => setCopyMessage(''), 1800);
  };

  const openConversion = () => {
    if (!selected) return;
    setConversionForm({
      eventTitle: `${selected.eventInterest || 'Zion'} event for ${selected.fullName}`,
      eventType: selected.eventInterest || 'Wedding Reception',
      eventDate: selected.requestedEventDate?.slice(0, 10) ?? '',
      startTime: '',
      endTime: '',
      venue: 'Main Hall',
      guestCount: '0',
      packageSelected: selected.packageInterest || '',
      specialRequests: '',
      assignedCoordinator: '',
      internalNotes: '',
      conflictOverrideReason: '',
    });
  };

  const submitConversion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || !conversionForm) return;
    const endpoint = `/api/admin/inquiries/${encodeURIComponent(selected.id)}/convert-to-booking`;
    setPendingAction(endpoint);
    setError('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...conversionForm,
          guestCount: Number(conversionForm.guestCount),
        }),
      });
      const payload = await response.json() as {
        bookingId?: string;
        error?: string;
        conflicts?: Array<{ bookingReference: string }>;
      };
      if (!response.ok || !payload.bookingId) {
        const conflictText = payload.conflicts?.length
          ? ` Conflict: ${payload.conflicts.map((item) => item.bookingReference).join(', ')}.`
          : '';
        throw new Error(`${payload.error || 'Unable to create booking.'}${conflictText}`);
      }
      setConversionForm(null);
      await refreshSelected();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to create booking.');
    } finally {
      setPendingAction('');
    }
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const summaryCards = [
    ['Total Inquiries', summary.total, 'All received messages'],
    ['New Inquiries', summary.new, 'New and unread'],
    ['Pending Response', summary.pending, 'Waiting for contact'],
    ['Follow-Up Needed', summary.followUp, 'Another attempt required'],
    ['Answered', summary.answered, 'Already handled'],
    ['Converted to Booking', summary.converted, 'Qualified leads'],
    ['High Priority', summary.highPriority, 'Active urgent inquiries'],
  ];

  return (
    <div className="mx-auto flex w-full flex-col gap-6 font-sans text-[#1a1f18] dark:text-[#F4F4F0]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D6B53B]/30 bg-[#FDF5CC] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
            <Inbox className="h-3.5 w-3.5" />
            Possible Client Pipeline
          </div>
          <h1 className="font-sahitya text-3xl font-bold uppercase tracking-[0.08em]">Inquiry Management</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
            Manage client inquiries, package questions, event concerns, and booking-related messages from the Client Panel.
          </p>
        </div>
        <button type="button" onClick={() => void loadList()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6B53B]/30 bg-white px-5 py-2.5 text-sm font-bold text-[#8E7722] shadow-sm hover:bg-[#FDF5CC] dark:bg-white/5 dark:text-[#D6B53B]">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-7">
        {summaryCards.map(([label, value, noteText]) => (
          <article key={String(label)} className="rounded-2xl border border-[#D6B53B]/20 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8E7722] dark:text-[#D6B53B]">{label}</p>
            <p className="mt-2 font-sahitya text-3xl font-bold">{value}</p>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-[#A3B19B]">{noteText}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[#D6B53B]/20 bg-[#FDF5CC]/55 p-4 shadow-[0_18px_60px_rgba(142,119,34,0.08)] dark:border-white/10 dark:bg-[#141A13]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <input value={filters.search} onChange={(event) => changeFilter('search', event.target.value)} placeholder="Search name, email, phone, message, or event interest" className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1C1D21]" />
          </label>
          <select value={filters.status} onChange={(event) => changeFilter('status', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1C1D21]">
            <option value="">All statuses</option>
            {(['new', 'pending_response', 'answered', 'follow_up', 'converted_to_booking', 'closed', 'spam'] as InquiryStatus[]).map((status) => <option key={status} value={status}>{normalizeLabel(status)}</option>)}
          </select>
          <select value={filters.priority} onChange={(event) => changeFilter('priority', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1C1D21]">
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          <input aria-label="Submitted from" type="date" value={filters.startDate} onChange={(event) => changeFilter('startDate', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#1C1D21]" />
          <input aria-label="Submitted to" type="date" value={filters.endDate} onChange={(event) => changeFilter('endDate', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#1C1D21]" />
          <select value={filters.eventInterest} onChange={(event) => changeFilter('eventInterest', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#1C1D21]">
            <option value="">Any event interest</option>
            {eventInterests.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={filters.assignedTo} onChange={(event) => changeFilter('assignedTo', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#1C1D21]">
            <option value="">Any assignment</option>
            <option value="unassigned">Unassigned</option>
            {admins.map((admin) => <option key={admin.id} value={admin.label}>{admin.label}</option>)}
          </select>
          <select value={filters.preferredContactTime} onChange={(event) => changeFilter('preferredContactTime', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#1C1D21]">
            <option value="">Any preferred time</option>
            {preferredTimes.map((item) => <option key={item}>{item}</option>)}
          </select>
          <button type="button" onClick={() => { setFilters(EMPTY_FILTERS); setPage(1); }} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]">
            Clear {activeFilterCount ? `(${activeFilterCount})` : ''}
          </button>
        </div>

        {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>}

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#1C1D21]">
          <div className="overflow-x-auto">
            <table className="min-w-[1480px] w-full text-left">
              <thead className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]">
                <tr>
                  {['Submitted Date', 'Requested Date', 'Client', 'Message Preview', 'Preferred Time', 'Event Interest', 'Status', 'Priority', 'Assigned To', 'Last Updated', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {isLoading ? (
                  <tr><td colSpan={11} className="h-64 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#D6B53B]" /></td></tr>
                ) : inquiries.length === 0 ? (
                  <tr><td colSpan={11} className="px-6 py-20 text-center"><Inbox className="mx-auto h-10 w-10 text-[#D6B53B]/60" /><p className="mt-4 font-sahitya text-xl font-bold">No inquiries yet.</p><p className="mt-1 text-sm text-gray-500 dark:text-[#A3B19B]">Client messages from the Contact Us page will appear here once submitted.</p></td></tr>
                ) : inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="text-sm transition hover:bg-[#FDF5CC]/20 dark:hover:bg-white/[0.03]">
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-500">{formatDate(inquiry.submittedAt)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-[#8E7722] dark:text-[#D6B53B]">{inquiry.requestedEventDate ? formatDateOnly(inquiry.requestedEventDate) : 'Not selected'}</td>
                    <td className="px-4 py-4"><p className="font-bold">{inquiry.fullName}</p><p className="mt-1 max-w-48 truncate text-xs text-gray-400">{inquiry.email}</p><p className="max-w-48 truncate text-xs text-gray-400">{inquiry.phoneNumber || 'No phone'}</p></td>
                    <td className="max-w-xs px-4 py-4"><p className="line-clamp-2 text-xs leading-5 text-gray-600 dark:text-[#A3B19B]">{inquiry.message}</p></td>
                    <td className="px-4 py-4 text-xs font-semibold">{inquiry.preferredContactTime || 'Any time'}</td>
                    <td className="px-4 py-4"><p className="font-semibold">{inquiry.eventInterest || 'Not specified'}</p>{inquiry.packageInterest && <p className="mt-1 text-xs text-gray-400">{inquiry.packageInterest}</p>}</td>
                    <td className="px-4 py-4"><StatusBadge status={inquiry.status} /></td>
                    <td className="px-4 py-4"><PriorityBadge priority={inquiry.priority} /></td>
                    <td className="px-4 py-4 text-xs font-semibold">{inquiry.assignedTo || 'Unassigned'}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-500">{formatDate(inquiry.updatedAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => void loadDetail(inquiry.id)} title="View details" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-[#8E7722] dark:hover:bg-white/10"><ExternalLink className="h-4 w-4" /></button>
                        {inquiry.status !== 'answered' && <button type="button" onClick={() => void quickStatus(inquiry.id, 'answered')} title="Mark answered" className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"><Check className="h-4 w-4" /></button>}
                        {inquiry.status !== 'follow_up' && <button type="button" onClick={() => void quickStatus(inquiry.id, 'follow_up')} title="Follow-up" className="rounded-lg p-2 text-violet-600 hover:bg-violet-50"><RotateCcw className="h-4 w-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
            <p className="text-xs text-gray-500">{pagination.totalRecords} inquiries found</p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-gray-200 p-2 disabled:opacity-40 dark:border-white/10"><ChevronLeft className="h-4 w-4" /></button>
              <span className="px-2 text-xs font-bold">Page {pagination.page} of {pagination.totalPages}</span>
              <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-gray-200 p-2 disabled:opacity-40 dark:border-white/10"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </section>

      {(selected || isDetailLoading) && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/35 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <aside className="h-full w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-2xl dark:bg-[#141A13] md:p-8" onClick={(event) => event.stopPropagation()}>
            {isDetailLoading && !selected ? <div className="flex h-full items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-[#D6B53B]" /></div> : selected && (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2"><StatusBadge status={selected.status} /><PriorityBadge priority={selected.priority} /></div>
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.15em] text-[#8E7722] dark:text-[#D6B53B]">{selected.inquiryReference}</p>
                    <h2 className="mt-1 font-sahitya text-3xl font-bold">{selected.fullName}</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-[#A3B19B]">Submitted {formatDate(selected.submittedAt)}</p>
                  </div>
                  <button type="button" onClick={() => setSelected(null)} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 dark:bg-white/10"><X className="h-5 w-5" /></button>
                </div>

                <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => void copy('Email', selected.email)} className="flex items-center gap-3 rounded-2xl border border-gray-100 p-4 text-left hover:border-[#D6B53B]/40 dark:border-white/10">
                    <Mail className="h-5 w-5 text-[#D6B53B]" /><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Email</span><span className="mt-1 block truncate text-sm font-semibold">{selected.email}</span></span><Copy className="h-4 w-4 text-gray-400" />
                  </button>
                  <button type="button" onClick={() => void copy('Phone', selected.phoneNumber)} className="flex items-center gap-3 rounded-2xl border border-gray-100 p-4 text-left hover:border-[#D6B53B]/40 dark:border-white/10">
                    <Phone className="h-5 w-5 text-[#D6B53B]" /><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Phone</span><span className="mt-1 block truncate text-sm font-semibold">{selected.phoneNumber || 'Not provided'}</span></span><Copy className="h-4 w-4 text-gray-400" />
                  </button>
                </section>
                {copyMessage && <p className="mt-2 text-xs font-bold text-emerald-600">{copyMessage}</p>}

                <section className="mt-5 rounded-2xl border border-[#D6B53B]/20 bg-[#FDF5CC]/25 p-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8E7722]"><MessageCircle className="h-4 w-4" />Full message</div>
                  <p className="mt-3 whitespace-pre-wrap font-serif text-lg leading-8 text-gray-700 dark:text-[#F4F4F0]">{selected.message}</p>
                </section>

                <dl className="mt-5 grid grid-cols-1 gap-4 rounded-2xl bg-gray-50 p-5 text-sm dark:bg-white/5 sm:grid-cols-2">
                  {[
                    ['Preferred contact time', selected.preferredContactTime || 'Any time'],
                    ['Requested event date', selected.requestedEventDate ? formatDateOnly(selected.requestedEventDate) : 'Not selected'],
                    ['Event interest', selected.eventInterest || 'Not specified'],
                    ['Package interest', selected.packageInterest || 'Not specified'],
                    ['Source', normalizeLabel(selected.sourcePage)],
                  ].map(([label, value]) => <div key={label}><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
                </dl>

                <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Status
                    <select value={selected.status} onChange={(event) => setStatus(event.target.value as InquiryStatus)} disabled={Boolean(pendingAction)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-[#1C1D21]">
                      {(['new', 'pending_response', 'answered', 'follow_up', 'closed', 'spam'] as InquiryStatus[]).map((status) => <option key={status} value={status}>{normalizeLabel(status)}</option>)}
                      {selected.status === 'converted_to_booking' && <option value="converted_to_booking">Converted to Booking</option>}
                    </select>
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Priority
                    <select value={selected.priority} onChange={(event) => setPriority(event.target.value as InquiryPriority)} disabled={Boolean(pendingAction)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-[#1C1D21]">
                      <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
                    </select>
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Assigned admin
                    <select value={selected.assignedTo || ''} onChange={(event) => assign(event.target.value)} disabled={Boolean(pendingAction)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-[#1C1D21]">
                      <option value="">Unassigned</option>
                      {admins.map((admin) => <option key={admin.id} value={admin.label}>{admin.label}</option>)}
                    </select>
                  </label>
                </section>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setStatus('answered')} disabled={Boolean(pendingAction)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"><Check className="h-4 w-4" />Mark Answered</button>
                  <button type="button" onClick={() => setStatus('follow_up')} disabled={Boolean(pendingAction)} className="inline-flex items-center gap-2 rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-bold text-violet-700 hover:bg-violet-50 dark:border-violet-500/20 dark:text-violet-300"><RotateCcw className="h-4 w-4" />Add Follow-Up</button>
                  {!selected.relatedBookingId && <button type="button" onClick={openConversion} disabled={Boolean(pendingAction)} className="inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#D6B53B] hover:text-[#1a1f18]"><CalendarPlus className="h-4 w-4" />Convert to Booking</button>}
                  <button type="button" onClick={() => setStatus('spam')} disabled={Boolean(pendingAction)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 dark:border-red-500/20 dark:text-red-300"><Flag className="h-4 w-4" />Mark Spam</button>
                  <button type="button" onClick={() => setStatus('closed')} disabled={Boolean(pendingAction)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-[#A3B19B]"><X className="h-4 w-4" />Close</button>
                  {pendingAction && <Loader2 className="h-5 w-5 animate-spin self-center text-[#D6B53B]" />}
                </div>

                {selected.relatedBooking && (
                  <Link href={`/admin/bookings?selected=${encodeURIComponent(selected.relatedBooking.id)}`} className="mt-5 flex items-center justify-between rounded-2xl border border-[#D6B53B]/30 bg-[#FDF5CC] p-4 text-[#1a1f18] hover:border-[#8E7722]">
                    <span><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#8E7722]">Related booking</span><span className="mt-1 block font-bold">{selected.relatedBooking.bookingReference} · {selected.relatedBooking.eventTitle}</span><span className="mt-1 block text-xs text-gray-500">{formatDateOnly(selected.relatedBooking.eventDate)} · {normalizeLabel(selected.relatedBooking.status)}</span></span>
                    <ExternalLink className="h-5 w-5" />
                  </Link>
                )}

                <section className="mt-7">
                  <h3 className="flex items-center gap-2 font-sahitya text-xl font-bold"><Clipboard className="h-5 w-5 text-[#D6B53B]" />Internal Notes</h3>
                  <form onSubmit={addNote} className="mt-3 flex gap-2">
                    <textarea value={note} onChange={(event) => setNote(event.target.value)} required maxLength={2000} placeholder="Add a private note for the admin team..." className="min-h-24 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                    <button type="submit" disabled={Boolean(pendingAction)} className="self-end rounded-xl bg-[#D6B53B] p-3 text-[#1a1f18] disabled:opacity-50" title="Add internal note"><Send className="h-5 w-5" /></button>
                  </form>
                  <div className="mt-4 space-y-3">
                    {selected.notes.length ? selected.notes.map((item) => <article key={item.id} className="rounded-xl border border-gray-100 p-4 dark:border-white/10"><p className="whitespace-pre-wrap text-sm leading-6">{item.note}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">{item.createdBy} · {formatDate(item.createdAt)}</p></article>) : <p className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400 dark:border-white/10">No internal notes yet.</p>}
                  </div>
                </section>

                <section className="mt-7">
                  <h3 className="flex items-center gap-2 font-sahitya text-xl font-bold"><Clock3 className="h-5 w-5 text-[#D6B53B]" />Activity Timeline</h3>
                  <div className="mt-4 space-y-4 border-l border-[#D6B53B]/30 pl-5">
                    {selected.activity.map((item) => <article key={item.id} className="relative"><span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-[#D6B53B]" /><p className="text-sm font-bold">{normalizeLabel(item.action)}</p><p className="mt-1 text-sm leading-6 text-gray-600 dark:text-[#A3B19B]">{item.description}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">{item.performedBy} · {formatDate(item.createdAt)}</p></article>)}
                  </div>
                </section>
              </>
            )}
          </aside>
        </div>
      )}

      {conversionForm && selected && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={submitConversion} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-[#141A13] md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E7722]">Inquiry Conversion</p><h2 className="mt-1 font-sahitya text-2xl font-bold">Create Booking for {selected.fullName}</h2><p className="mt-1 text-sm text-gray-500">The original inquiry remains linked and preserved.</p></div>
              <button type="button" onClick={() => setConversionForm(null)} className="rounded-full bg-gray-100 p-2 text-gray-500"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ['eventTitle', 'Event title', 'text'],
                ['eventType', 'Event type', 'text'],
                ['eventDate', 'Event date', 'date'],
                ['venue', 'Venue', 'text'],
                ['guestCount', 'Guest count', 'number'],
                ['packageSelected', 'Package', 'text'],
                ['startTime', 'Start time', 'time'],
                ['endTime', 'End time', 'time'],
                ['assignedCoordinator', 'Assigned coordinator', 'text'],
              ].map(([key, label, type]) => (
                <label key={key} className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">{label}
                  <input required={['eventTitle', 'eventType', 'eventDate', 'venue', 'guestCount'].includes(key)} min={type === 'number' ? 0 : undefined} type={type} value={conversionForm[key as keyof ConversionForm]} onChange={(event) => setConversionForm((current) => current ? { ...current, [key]: event.target.value } : current)} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-white/5" />
                </label>
              ))}
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 sm:col-span-2">Special requests
                <textarea value={conversionForm.specialRequests} onChange={(event) => setConversionForm((current) => current ? { ...current, specialRequests: event.target.value } : current)} className="mt-1.5 min-h-20 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-white/5" />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 sm:col-span-2">Additional internal notes
                <textarea value={conversionForm.internalNotes} onChange={(event) => setConversionForm((current) => current ? { ...current, internalNotes: event.target.value } : current)} className="mt-1.5 min-h-20 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-white/5" />
              </label>
              {currentUserRole === 'SUPERADMIN' && <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 sm:col-span-2">Conflict override reason (only if needed)
                <textarea minLength={10} value={conversionForm.conflictOverrideReason} onChange={(event) => setConversionForm((current) => current ? { ...current, conflictOverrideReason: event.target.value } : current)} className="mt-1.5 min-h-20 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal normal-case dark:border-white/10 dark:bg-white/5" />
              </label>}
            </div>
            {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConversionForm(null)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600">Cancel</button>
              <button type="submit" disabled={Boolean(pendingAction)} className="inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#D6B53B] hover:text-[#1a1f18] disabled:opacity-60">{pendingAction && <Loader2 className="h-4 w-4 animate-spin" />}Create Booking</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
