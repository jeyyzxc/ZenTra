'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  History,
  Loader2,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  UploadCloud,
  WalletCards,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ExportFormatMenu, { type ExportFormat, type ExportScope } from '@/components/admin/ExportFormatMenu';

type UserRole = 'SUPERADMIN' | 'ADMIN';

type PaymentHistoryEntry = {
  id: string;
  action: string;
  description: string;
  oldStatus: string | null;
  newStatus: string | null;
  oldAmount: number | null;
  newAmount: number | null;
  oldBalance: number | null;
  newBalance: number | null;
  paymentAmount: number | null;
  paymentType: string | null;
  paymentMethod: string | null;
  proofFileName: string | null;
  verification: string | null;
  performedBy: string;
  notes: string | null;
  createdAt: string;
};

type PaymentMilestone = {
  id: string;
  milestoneName: string;
  amountRequired: number;
  amountPaid: number;
  dueDate: string | null;
  status: string;
};

type PaymentRecord = {
  id: string;
  paymentReference: string;
  bookingReference: string;
  bookingId: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  eventTitle: string | null;
  eventType: string | null;
  eventDate: string | null;
  packageName: string | null;
  paymentType: string | null;
  status: string;
  verificationStatus: string;
  totalAmount: number;
  amountPaid: number;
  pendingAmount: number;
  remainingBalance: number;
  paymentMethod: string | null;
  paymentDate: string | null;
  dueDate: string | null;
  proofFileName: string | null;
  proofFileType: string | null;
  proofUploadedBy: string | null;
  proofUploadedAt: string | null;
  proofUrl: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  notes: string | null;
  source: string;
  updatedAt: string;
  booking: {
    id: string;
    eventTitle: string;
    eventDate: string;
    packageSelected: string | null;
    assignedCoordinator: string | null;
    clientEmail: string | null;
    clientPhone: string | null;
  };
  history: PaymentHistoryEntry[];
  milestones: PaymentMilestone[];
};

type AvailableBooking = {
  id: string;
  bookingReference: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  eventTitle: string;
  eventType: string;
  eventDate: string;
  packageSelected: string | null;
  assignedCoordinator: string | null;
  paymentTotalAmount: number | null;
  suggestedDueDate: string;
};

type PaymentResponse = {
  records: PaymentRecord[];
  availableBookings: AvailableBooking[];
  summary: {
    revenueThisMonth: number;
    totalCollected: number;
    pending: number;
    overdue: number;
    downPayments: number;
    partialPayments: number;
    fullyPaid: number;
    forVerification: number;
  };
  options: {
    eventTypes: string[];
    packages: string[];
    coordinators: string[];
  };
  error?: string;
};

type Filters = {
  search: string;
  dateFrom: string;
  dateTo: string;
  eventType: string;
  package: string;
  paymentType: string;
  status: string;
  dueStatus: string;
  verificationStatus: string;
  coordinator: string;
  month: string;
};

const EMPTY_FILTERS: Filters = {
  search: '',
  dateFrom: '',
  dateTo: '',
  eventType: '',
  package: '',
  paymentType: '',
  status: '',
  dueStatus: '',
  verificationStatus: '',
  coordinator: '',
  month: '',
};

const PAYMENT_TYPES = [
  'DOWN_PAYMENT',
  'PARTIAL_PAYMENT',
  'FULL_PAYMENT',
  'RESERVATION_FEE',
  'ADDITIONAL_PAYMENT',
];

const PAYMENT_STATUSES = [
  'UNPAID',
  'FOR_VERIFICATION',
  'RESERVATION_PAID',
  'DOWN_PAYMENT_PAID',
  'PARTIALLY_PAID',
  'FULLY_PAID',
  'OVERDUE',
  'REJECTED',
  'REFUNDED',
  'CANCELLED',
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'GCash', 'BDO', 'BPI', 'Maya', 'Other'];
const PROOF_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf';

function money(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);
}

function label(value: string | null | undefined) {
  if (!value) return 'Not set';
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\bN8n\b/g, 'n8n').replace(/\bAi\b/g, 'AI');
}

function formatDate(value: string | null | undefined, includeTime = false) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return new Intl.DateTimeFormat('en-PH', includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(date);
}

function toDateInput(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function todayInput() {
  return toDateInput(new Date().toISOString());
}

function statusClass(value: string) {
  if (value === 'FULLY_PAID') return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300';
  if (value === 'PARTIALLY_PAID') return 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300';
  if (value === 'DOWN_PAYMENT_PAID' || value === 'RESERVATION_PAID') return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300';
  if (value === 'FOR_VERIFICATION') return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300';
  if (value === 'OVERDUE' || value === 'UNPAID') return 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300';
  return 'border-gray-200 bg-gray-100 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300';
}

function milestoneClass(value: string) {
  if (value === 'PAID') return 'bg-emerald-500';
  if (value === 'FOR_VERIFICATION') return 'bg-amber-500';
  if (value === 'OVERDUE' || value === 'REJECTED') return 'bg-red-500';
  return 'bg-gray-300 dark:bg-white/20';
}

function dueMeta(record: PaymentRecord) {
  if (!record.dueDate) return { text: 'No due date', overdueDays: 0, urgent: false };
  const due = new Date(record.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const days = Math.floor((today.getTime() - due.getTime()) / 86_400_000);
  return {
    text: days > 0 ? `${days} day${days === 1 ? '' : 's'} overdue` : formatDate(record.dueDate),
    overdueDays: Math.max(days, 0),
    urgent: days > 0 && record.remainingBalance > 0,
  };
}

function progress(record: PaymentRecord) {
  if (record.totalAmount <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((record.amountPaid / record.totalAmount) * 100)));
}

function SummaryCard({
  icon,
  label: cardLabel,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#D6B53B]/15 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#141A13]">
      <div className={`absolute -right-7 -top-7 h-20 w-20 rounded-full opacity-15 ${tone}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-[#A3B19B]">{cardLabel}</p>
          <p className="mt-2 font-sahitya text-2xl font-bold text-[#1a1f18] dark:text-white">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 text-white shadow-sm ${tone}`}>{icon}</div>
      </div>
    </div>
  );
}

function Field({
  label: fieldLabel,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">{fieldLabel}</span>
      {children}
    </label>
  );
}

const inputClass = 'h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-[#1A2218] dark:text-white';
const textareaClass = 'min-h-24 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-[#1A2218] dark:text-white';

function ProofPicker({
  file,
  onChange,
  error,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}) {
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : '', [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="space-y-3">
      <label className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition hover:border-[#D6B53B] hover:bg-[#FDF5CC]/30 dark:hover:bg-[#D6B53B]/5 ${error ? 'border-red-300 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/5' : 'border-[#D6B53B]/30 bg-[#FDF5CC]/20 dark:bg-white/[0.02]'}`}>
        <UploadCloud className="h-8 w-8 text-[#D6B53B]" />
        <span className="mt-2 text-sm font-bold">{file ? 'Replace payment proof' : 'Upload receipt or payment proof'}</span>
        <span className="mt-1 text-xs text-gray-400">JPG, JPEG, PNG, WEBP, or PDF · maximum 5 MB</span>
        <input
          type="file"
          className="sr-only"
          accept={PROOF_ACCEPT}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
      </label>
      {file && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button type="button" onClick={() => onChange(null)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" aria-label="Remove proof">
              <X className="h-4 w-4" />
            </button>
          </div>
          {previewUrl && file.type.startsWith('image/') && (
            <div className="relative mt-3 h-40 overflow-hidden rounded-lg bg-gray-100 dark:bg-black/20">
              <Image src={previewUrl} alt="Payment proof preview" fill unoptimized className="object-contain" />
            </div>
          )}
          {previewUrl && file.type === 'application/pdf' && (
            <object data={previewUrl} type="application/pdf" className="mt-3 h-40 w-full rounded-lg">
              <p className="text-xs text-gray-500">PDF preview is not available in this browser.</p>
            </object>
          )}
        </div>
      )}
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}

function Modal({
  title,
  eyebrow,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className={`max-h-[94vh] w-full overflow-hidden rounded-[2rem] border border-[#D6B53B]/20 bg-[#F9F8F1] shadow-2xl dark:bg-[#141A13] ${wide ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <div className="flex items-center justify-between border-b border-[#D6B53B]/15 bg-white/90 px-6 py-5 dark:bg-[#141A13]/90">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E7722] dark:text-[#D6B53B]">{eyebrow}</p>
            <h2 className="mt-1 font-sahitya text-2xl font-bold uppercase tracking-[0.05em]">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function PaymentManagementClient({ currentUserRole }: { currentUserRole: UserRole }) {
  const isSuperAdmin = currentUserRole === 'SUPERADMIN';
  const [data, setData] = useState<PaymentResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState<'create' | 'add' | 'edit' | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) params.set(key, value.trim());
    });
    return params.toString();
  }, [filters]);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/payments${queryString ? `?${queryString}` : ''}`, { cache: 'no-store' });
      const payload = await response.json() as PaymentResponse;
      if (!response.ok) throw new Error(payload.error || 'Unable to load payment records.');
      setData(payload);
      setSelectedId((current) => (
        current && payload.records.some((record) => record.id === current) ? current : null
      ));
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load payment records.' });
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const selected = useMemo(
    () => data?.records.find((record) => record.id === selectedId) ?? null,
    [data, selectedId],
  );

  const mutate = async (
    request: () => Promise<Response>,
    successMessage: string,
  ) => {
    setIsSaving(true);
    setNotice(null);
    try {
      const response = await request();
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to save payment changes.');
      setModal(null);
      setNotice({ type: 'success', text: successMessage });
      await load(true);
      return true;
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save payment changes.' });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const verify = async (record: PaymentRecord) => {
    await mutate(
      () => fetch(`/api/payments/${record.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Proof reviewed and payment verified.' }),
      }),
      `${record.paymentReference} was verified and added to collected revenue.`,
    );
  };

  const reject = async (record: PaymentRecord) => {
    const reason = window.prompt('Enter the reason this payment proof is being rejected:');
    if (!reason?.trim()) return;
    await mutate(
      () => fetch(`/api/payments/${record.id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      }),
      `${record.paymentReference} was rejected.`,
    );
  };

  const exportPayments = (format: ExportFormat, scope: ExportScope) => {
    if (format === 'print') {
      window.print();
      return;
    }

    const params = new URLSearchParams(queryString);
    params.set('format', format);
    params.set('scope', scope);
    params.set('timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    if (scope === 'selected' && selectedId) {
      params.set('ids', selectedId);
    }

    window.location.href = `/api/payments/export?${params.toString()}`;
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-6 text-[#1a1f18] dark:text-[#F4F4F0]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8E7722] dark:text-[#D6B53B]">In-person collection control</p>
          <h1 className="mt-1 font-sahitya text-3xl font-bold uppercase tracking-[0.08em]">Payment & History</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
            Track in-person payments, client balances, due dates, receipts, and payment progress for active bookings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportFormatMenu
            onExport={exportPayments}
            scopeOptions={[
              {
                scope: 'filtered',
                label: 'Filtered',
                description: `${data?.records.length ?? 0} matching payment record(s)`,
              },
              {
                scope: 'selected',
                label: 'Selected',
                description: selected ? selected.paymentReference : 'Open a payment to export one record',
                disabled: !selectedId,
              },
              {
                scope: 'all',
                label: 'All Authorized',
                description: 'All payment records you are allowed to export',
              },
            ]}
          />
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm hover:border-[#D6B53B] dark:border-white/10 dark:bg-[#141A13]"
          >
            <Filter className="h-4 w-4" /> Filters {activeFilterCount > 0 && <span className="rounded-full bg-[#D6B53B] px-2 py-0.5 text-[10px] text-white">{activeFilterCount}</span>}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm hover:border-[#D6B53B] dark:border-white/10 dark:bg-[#141A13]"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            type="button"
            disabled={!data?.availableBookings.length}
            onClick={() => setModal('create')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#D6B53B] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#D6B53B] dark:text-[#141A13]"
          >
            <Plus className="h-4 w-4" /> New Payment Record
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <SummaryCard icon={<CircleDollarSign className="h-5 w-5" />} label="Revenue This Month" value={money(data?.summary.revenueThisMonth ?? 0)} tone="bg-emerald-600" />
        <SummaryCard icon={<Banknote className="h-5 w-5" />} label="Total Collected" value={money(data?.summary.totalCollected ?? 0)} tone="bg-[#8E7722]" />
        <SummaryCard icon={<Clock3 className="h-5 w-5" />} label="Pending Payments" value={String(data?.summary.pending ?? 0)} tone="bg-amber-500" />
        <SummaryCard icon={<AlertCircle className="h-5 w-5" />} label="Overdue Payments" value={String(data?.summary.overdue ?? 0)} tone="bg-red-600" />
        <SummaryCard icon={<ReceiptText className="h-5 w-5" />} label="Down Payments" value={String(data?.summary.downPayments ?? 0)} tone="bg-blue-600" />
        <SummaryCard icon={<WalletCards className="h-5 w-5" />} label="Partial Payments" value={String(data?.summary.partialPayments ?? 0)} tone="bg-purple-600" />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} label="Fully Paid" value={String(data?.summary.fullyPaid ?? 0)} tone="bg-emerald-500" />
        <SummaryCard icon={<ShieldCheck className="h-5 w-5" />} label="For Verification" value={String(data?.summary.forVerification ?? 0)} tone="bg-orange-500" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
          <input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search client, email, booking reference, payment reference, or event title"
            className="h-11 w-full rounded-xl border border-gray-200 bg-[#F9F8F1] pl-10 pr-4 text-sm outline-none transition focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-[#1A2218]"
          />
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 dark:border-white/10">
            <FilterSelect label="Payment Type" value={filters.paymentType} onChange={(value) => setFilters((current) => ({ ...current, paymentType: value }))} options={PAYMENT_TYPES} />
            <FilterSelect label="Payment Status" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={PAYMENT_STATUSES} />
            <FilterSelect label="Due Date Status" value={filters.dueStatus} onChange={(value) => setFilters((current) => ({ ...current, dueStatus: value }))} options={['DUE_TODAY', 'DUE_THIS_WEEK', 'DUE_THIS_MONTH', 'OVERDUE', 'NO_DUE_DATE']} />
            <FilterSelect label="Verification" value={filters.verificationStatus} onChange={(value) => setFilters((current) => ({ ...current, verificationStatus: value }))} options={['NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED']} />
            <FilterSelect label="Event Type" value={filters.eventType} onChange={(value) => setFilters((current) => ({ ...current, eventType: value }))} options={data?.options.eventTypes ?? []} rawLabels />
            <FilterSelect label="Package" value={filters.package} onChange={(value) => setFilters((current) => ({ ...current, package: value }))} options={data?.options.packages ?? []} rawLabels />
            <FilterSelect label="Coordinator" value={filters.coordinator} onChange={(value) => setFilters((current) => ({ ...current, coordinator: value }))} options={data?.options.coordinators ?? []} rawLabels />
            <Field label="Month / Year"><input type="month" value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))} className={inputClass} /></Field>
            <Field label="Event Date From"><input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} className={inputClass} /></Field>
            <Field label="Event Date To"><input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} className={inputClass} /></Field>
            <div className="flex items-end sm:col-span-2">
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm font-bold text-gray-500 hover:border-red-300 hover:text-red-600 dark:border-white/10">
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {notice && (
        <div role="status" className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${notice.type === 'error' ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'}`}>
          {notice.type === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#141A13]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className="font-bold">Active booking payments</h2>
            <p className="mt-1 text-xs text-gray-400">{data?.records.length ?? 0} payment record{data?.records.length === 1 ? '' : 's'} shown</p>
          </div>
          {data && data.availableBookings.length > 0 && (
            <button type="button" onClick={() => setModal('create')} className="text-xs font-bold text-[#8E7722] hover:underline dark:text-[#D6B53B]">
              {data.availableBookings.length} active booking{data.availableBookings.length === 1 ? '' : 's'} need setup
            </button>
          )}
        </div>

        {isLoading && !data ? (
          <PaymentSkeleton />
        ) : data?.records.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[1640px] w-full text-left text-sm">
              <thead className="bg-[#F9F8F1] text-[10px] uppercase tracking-[0.13em] text-gray-400 dark:bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3">References</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Package</th>
                  <th className="px-4 py-3">Payment Type</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Amount Paid</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Proof</th>
                  <th className="px-4 py-3">Last Updated</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((record) => {
                  const percentage = progress(record);
                  const due = dueMeta(record);
                  return (
                    <tr key={record.id} className="border-t border-gray-100 align-top transition hover:bg-[#FDF5CC]/20 dark:border-white/5 dark:hover:bg-white/[0.03]">
                      <td className="px-4 py-4">
                        <p className="font-bold text-[#8E7722] dark:text-[#D6B53B]">{record.paymentReference}</p>
                        <p className="mt-1 text-xs text-gray-400">{record.bookingReference}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold">{record.clientName}</p>
                        <p className="mt-1 max-w-48 truncate text-xs text-gray-400">{record.clientEmail ?? 'No email'}</p>
                        <p className="mt-0.5 text-xs text-gray-400">{record.clientPhone ?? 'No contact'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="max-w-48 font-semibold">{record.eventTitle ?? record.booking.eventTitle}</p>
                        <p className="mt-1 text-xs text-gray-400">{record.eventType ?? 'Event'} · {formatDate(record.eventDate ?? record.booking.eventDate)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="max-w-40 font-semibold">{record.packageName ?? 'Custom package'}</p>
                        <p className="mt-1 text-xs text-gray-400">{money(record.totalAmount)}</p>
                      </td>
                      <td className="px-4 py-4">{label(record.paymentType)}</td>
                      <td className="px-4 py-4">
                        <div className="w-32">
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="font-bold">{percentage}%</span>
                            {record.pendingAmount > 0 && <span className="text-amber-600">+{money(record.pendingAmount)} pending</span>}
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#D6B53B] to-emerald-500" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-bold">{money(record.amountPaid)}</td>
                      <td className="px-4 py-4 font-semibold">{money(record.remainingBalance)}</td>
                      <td className="px-4 py-4">
                        <p className={due.urgent ? 'font-bold text-red-600' : ''}>{due.text}</p>
                        {record.dueDate && <p className="mt-1 text-xs text-gray-400">{formatDate(record.dueDate)}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusClass(record.status)}`}>{label(record.status)}</span>
                        <p className="mt-2 text-[10px] uppercase tracking-wide text-gray-400">{label(record.verificationStatus)}</p>
                      </td>
                      <td className="px-4 py-4">
                        {record.proofUrl ? (
                          <a href={record.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-bold text-[#8E7722] hover:underline dark:text-[#D6B53B]">
                            <FileCheck2 className="h-4 w-4" /> View
                          </a>
                        ) : <span className="text-xs text-gray-400">Missing</span>}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500">{formatDate(record.updatedAt, true)}</td>
                      <td className="px-4 py-4">
                        <button type="button" onClick={() => setSelectedId(record.id)} className="inline-flex items-center gap-1 font-bold text-[#8E7722] hover:underline dark:text-[#D6B53B]">
                          View <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-full bg-[#FDF5CC] p-4 text-[#8E7722]"><WalletCards className="h-8 w-8" /></div>
            <p className="mt-4 font-bold">No active payments yet.</p>
            <p className="mt-1 max-w-md text-sm text-gray-500">Payment records will appear here once a client booking is created and its payment record is initialized.</p>
            {data && data.availableBookings.length > 0 && (
              <button type="button" onClick={() => setModal('create')} className="mt-4 rounded-xl bg-[#1a1f18] px-4 py-2.5 text-sm font-bold text-white">Set up first payment record</button>
            )}
          </div>
        )}
      </section>

      {selected && (
        <PaymentDrawer
          record={selected}
          isSuperAdmin={isSuperAdmin}
          isSaving={isSaving}
          onClose={() => setSelectedId(null)}
          onAdd={() => setModal('add')}
          onEdit={() => setModal('edit')}
          onVerify={() => void verify(selected)}
          onReject={() => void reject(selected)}
        />
      )}

      {modal === 'create' && data && (
        <CreateRecordModal
          bookings={data.availableBookings}
          isSaving={isSaving}
          onClose={() => setModal(null)}
          onSubmit={(input) => mutate(
            () => fetch('/api/payments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(input),
            }),
            'Payment record created.',
          )}
        />
      )}

      {modal === 'add' && selected && (
        <AddPaymentModal
          record={selected}
          isSaving={isSaving}
          onClose={() => setModal(null)}
          onSubmit={(input, proof) => {
            const body = new FormData();
            body.set('payload', JSON.stringify(input));
            body.set('proof', proof);
            return mutate(
              () => fetch(`/api/payments/${selected.id}/add-payment`, { method: 'POST', body }),
              'Payment submitted with proof and is now waiting for verification.',
            );
          }}
        />
      )}

      {modal === 'edit' && selected && (
        <EditPaymentModal
          record={selected}
          isSuperAdmin={isSuperAdmin}
          isSaving={isSaving}
          onClose={() => setModal(null)}
          onSubmit={(input, proof) => {
            const body = new FormData();
            body.set('payload', JSON.stringify(input));
            if (proof) body.set('proof', proof);
            return mutate(
              () => fetch(`/api/payments/${selected.id}`, { method: 'PATCH', body }),
              'Payment record updated and history preserved.',
            );
          }}
        />
      )}
    </div>
  );
}

function FilterSelect({
  label: filterLabel,
  value,
  onChange,
  options,
  rawLabels = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  rawLabels?: boolean;
}) {
  return (
    <Field label={filterLabel}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        <option value="">All</option>
        {options.map((option) => <option key={option} value={option}>{rawLabels ? option : label(option)}</option>)}
      </select>
    </Field>
  );
}

function PaymentSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="grid animate-pulse grid-cols-5 gap-4 rounded-xl border border-gray-100 p-4 dark:border-white/5">
          {Array.from({ length: 5 }, (__, column) => <div key={column} className="h-10 rounded-lg bg-gray-100 dark:bg-white/5" />)}
        </div>
      ))}
    </div>
  );
}

function PaymentDrawer({
  record,
  isSuperAdmin,
  isSaving,
  onClose,
  onAdd,
  onEdit,
  onVerify,
  onReject,
}: {
  record: PaymentRecord;
  isSuperAdmin: boolean;
  isSaving: boolean;
  onClose: () => void;
  onAdd: () => void;
  onEdit: () => void;
  onVerify: () => void;
  onReject: () => void;
}) {
  const percentage = progress(record);
  const due = dueMeta(record);

  return (
    <div className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-[#D6B53B]/20 bg-[#F9F8F1] shadow-2xl dark:bg-[#0C100B]">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#D6B53B]/15 bg-white/95 px-6 py-5 backdrop-blur dark:bg-[#141A13]/95">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E7722] dark:text-[#D6B53B]">{record.paymentReference}</p>
            <h2 className="mt-1 font-sahitya text-2xl font-bold">{record.clientName}</h2>
            <p className="text-sm text-gray-500">{record.bookingReference} · {record.eventTitle}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Close payment details">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <section className="rounded-2xl bg-gradient-to-br from-[#1a1f18] to-[#283124] p-5 text-white shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#E9D77D]">Payment Summary</p>
                <p className="mt-2 text-3xl font-bold">{money(record.amountPaid)}</p>
                <p className="mt-1 text-sm text-white/60">of {money(record.totalAmount)} verified</p>
              </div>
              <span className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase ${statusClass(record.status)}`}>{label(record.status)}</span>
            </div>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-[#D6B53B] to-emerald-400" style={{ width: `${percentage}%` }} />
            </div>
            <div className="mt-3 flex justify-between text-xs text-white/60">
              <span>{percentage}% complete</span>
              <span>{money(record.remainingBalance)} remaining</span>
            </div>
            {record.pendingAmount > 0 && (
              <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
                {money(record.pendingAmount)} is waiting for proof verification and is not included in revenue.
              </div>
            )}
          </section>

          <div className="grid gap-3 sm:grid-cols-3">
            <DetailCard label="Due Date" value={formatDate(record.dueDate)} note={due.urgent ? due.text : undefined} critical={due.urgent} />
            <DetailCard label="Payment Type" value={label(record.paymentType)} />
            <DetailCard label="Method" value={record.paymentMethod ?? 'Not set'} />
          </div>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#141A13]">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8E7722] dark:text-[#D6B53B]"><FileText className="h-4 w-4" /> Booking, client & package</h3>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <Info label="Event" value={`${record.eventTitle ?? 'Event'} · ${formatDate(record.eventDate)}`} />
              <Info label="Event Type" value={record.eventType ?? 'Not set'} />
              <Info label="Client Contact" value={[record.clientEmail, record.clientPhone].filter(Boolean).join(' · ') || 'Not set'} />
              <Info label="Coordinator" value={record.booking.assignedCoordinator ?? 'Unassigned'} />
              <Info label="Package" value={record.packageName ?? 'Custom package'} />
              <Info label="Package Price" value={money(record.totalAmount)} />
            </div>
            <Link href={`/admin/bookings?selected=${encodeURIComponent(record.bookingId)}`} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#8E7722] hover:underline dark:text-[#D6B53B]">
              View related booking <ChevronRight className="h-4 w-4" />
            </Link>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#141A13]">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8E7722] dark:text-[#D6B53B]"><CalendarClock className="h-4 w-4" /> Payment Milestones</h3>
            <div className="mt-4 space-y-3">
              {record.milestones.length ? record.milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 dark:bg-white/5">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${milestoneClass(milestone.status)}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold capitalize">{milestone.milestoneName}</p>
                      <span className="text-[10px] font-bold uppercase text-gray-400">{label(milestone.status)}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{money(milestone.amountPaid)} of {money(milestone.amountRequired)} · due {formatDate(milestone.dueDate)}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-400">No payment milestones recorded.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#141A13]">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8E7722] dark:text-[#D6B53B]"><ReceiptText className="h-4 w-4" /> Proof / Receipt Viewer</h3>
            {record.proofUrl ? (
              <div className="mt-4">
                {record.proofFileType?.startsWith('image/') ? (
                  <div className="relative h-64 overflow-hidden rounded-xl bg-gray-100 dark:bg-black/20">
                    <Image src={record.proofUrl} alt="Saved payment proof" fill unoptimized className="object-contain" />
                  </div>
                ) : (
                  <object data={record.proofUrl} type="application/pdf" className="h-64 w-full rounded-xl border border-gray-100 dark:border-white/5">
                    <p className="p-4 text-sm">PDF preview unavailable. Use the view button below.</p>
                  </object>
                )}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                  <div>
                    <p className="font-bold text-gray-700 dark:text-gray-200">{record.proofFileName}</p>
                    <p>Uploaded {formatDate(record.proofUploadedAt, true)} by {record.proofUploadedBy ?? 'Admin'}</p>
                  </div>
                  <a href={record.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#D6B53B]/30 px-3 py-2 font-bold text-[#8E7722] dark:text-[#D6B53B]">
                    <Eye className="h-4 w-4" /> View full proof
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-red-200 bg-red-50 p-5 text-center text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/5">
                No payment proof has been uploaded.
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#141A13]">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8E7722] dark:text-[#D6B53B]"><History className="h-4 w-4" /> Payment History & Audit Trail</h3>
            <div className="mt-4 space-y-0">
              {record.history.length ? record.history.map((entry, index) => (
                <div key={entry.id} className="relative flex gap-4 pb-5">
                  {index < record.history.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-[#D6B53B]/25" />}
                  <span className="relative mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-[#D6B53B] bg-white dark:bg-[#141A13]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-bold">{entry.description}</p>
                      <span className="text-[10px] text-gray-400">{formatDate(entry.createdAt, true)}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Performed by {entry.performedBy}</p>
                    {(entry.oldStatus || entry.newStatus) && (
                      <p className="mt-1 text-xs text-gray-400">{label(entry.oldStatus)} → {label(entry.newStatus)}</p>
                    )}
                    {entry.paymentAmount !== null && <p className="mt-1 text-xs font-bold text-[#8E7722] dark:text-[#D6B53B]">{money(entry.paymentAmount)}</p>}
                    {entry.notes && <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">{entry.notes}</p>}
                  </div>
                </div>
              )) : <p className="text-sm text-gray-400">No payment history recorded.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#141A13]">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#8E7722] dark:text-[#D6B53B]">Internal Notes</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">{record.notes || 'No internal notes.'}</p>
          </section>
        </div>

        <div className="sticky bottom-0 grid gap-2 border-t border-[#D6B53B]/15 bg-white/95 p-4 backdrop-blur sm:grid-cols-2 dark:bg-[#141A13]/95">
          <a href={`/api/payments/${record.id}/receipt?timeZone=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6B53B]/30 px-4 py-3 text-sm font-bold text-[#8E7722] hover:bg-[#FDF5CC] dark:text-[#D6B53B]">
            <ReceiptText className="h-4 w-4" /> Receipt PDF
          </a>
          <a href={`/api/payments/${record.id}/statement?timeZone=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6B53B]/30 px-4 py-3 text-sm font-bold text-[#8E7722] hover:bg-[#FDF5CC] dark:text-[#D6B53B]">
            <FileText className="h-4 w-4" /> Statement PDF
          </a>
          <button type="button" disabled={record.pendingAmount > 0 || isSaving} onClick={onAdd} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a1f18] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#D6B53B] dark:text-[#141A13]">
            <Plus className="h-4 w-4" /> Add Payment
          </button>
          <button type="button" disabled={isSaving} onClick={onEdit} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold hover:border-[#D6B53B] dark:border-white/10">
            <Pencil className="h-4 w-4" /> Edit Record
          </button>
          {isSuperAdmin && record.verificationStatus === 'PENDING' && (
            <>
              <button type="button" disabled={isSaving} onClick={onVerify} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Mark Verified
              </button>
              <button type="button" disabled={isSaving} onClick={onReject} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                <XCircle className="h-4 w-4" /> Reject Proof
              </button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function DetailCard({ label: detailLabel, value, note, critical = false }: { label: string; value: string; note?: string; critical?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-white p-4 dark:bg-[#141A13] ${critical ? 'border-red-200 dark:border-red-500/20' : 'border-gray-200 dark:border-white/10'}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-gray-400">{detailLabel}</p>
      <p className={`mt-2 font-bold ${critical ? 'text-red-600' : ''}`}>{value}</p>
      {note && <p className="mt-1 text-xs font-semibold text-red-500">{note}</p>}
    </div>
  );
}

function Info({ label: infoLabel, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">{infoLabel}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function CreateRecordModal({
  bookings,
  isSaving,
  onClose,
  onSubmit,
}: {
  bookings: AvailableBooking[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: Record<string, unknown>) => Promise<boolean>;
}) {
  const [bookingId, setBookingId] = useState(bookings[0]?.id ?? '');
  const selected = bookings.find((booking) => booking.id === bookingId) ?? bookings[0];
  const [totalAmount, setTotalAmount] = useState(String(selected?.paymentTotalAmount ?? ''));
  const [dueDate, setDueDate] = useState(toDateInput(selected?.suggestedDueDate));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const selectBooking = (id: string) => {
    setBookingId(id);
    const booking = bookings.find((item) => item.id === id);
    setTotalAmount(String(booking?.paymentTotalAmount ?? ''));
    setDueDate(toDateInput(booking?.suggestedDueDate));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!bookingId || Number(totalAmount) <= 0) {
      setError('Select a booking and enter a valid package price.');
      return;
    }
    await onSubmit({ bookingId, totalAmount: Number(totalAmount), dueDate, notes });
  };

  return (
    <Modal title="New Payment Record" eyebrow="Active booking setup" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          <Field label="Booking Reference">
            <select value={bookingId} onChange={(event) => selectBooking(event.target.value)} className={inputClass} required>
              {bookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.bookingReference} · {booking.clientName} · {booking.eventTitle}</option>)}
            </select>
          </Field>
          {selected && (
            <div className="grid gap-3 rounded-2xl border border-[#D6B53B]/20 bg-[#FDF5CC]/30 p-4 text-sm sm:grid-cols-2 dark:bg-[#D6B53B]/5">
              <Info label="Client" value={selected.clientName} />
              <Info label="Event" value={`${selected.eventTitle} · ${formatDate(selected.eventDate)}`} />
              <Info label="Package" value={selected.packageSelected ?? 'Custom package'} />
              <Info label="Coordinator" value={selected.assignedCoordinator ?? 'Unassigned'} />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Package Price"><input type="number" min="0.01" step="0.01" required value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} className={inputClass} /></Field>
            <Field label="Initial Due Date"><input type="date" required value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={inputClass} /></Field>
          </div>
          <Field label="Internal Notes"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={textareaClass} /></Field>
          <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            This creates an unpaid monitoring record only. It does not process a payment or contact a payment gateway.
          </p>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        </div>
        <ModalFooter isSaving={isSaving} onClose={onClose} submitLabel="Create Record" />
      </form>
    </Modal>
  );
}

function AddPaymentModal({
  record,
  isSaving,
  onClose,
  onSubmit,
}: {
  record: PaymentRecord;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: Record<string, unknown>, proof: File) => Promise<boolean>;
}) {
  const [paymentType, setPaymentType] = useState('DOWN_PAYMENT');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(todayInput());
  const [dueDate, setDueDate] = useState(toDateInput(record.dueDate));
  const [notes, setNotes] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [error, setError] = useState('');

  const amount = Number(paymentAmount) || 0;
  const projectedPaid = Math.min(record.amountPaid + amount, record.totalAmount);
  const projectedBalance = Math.max(record.totalAmount - projectedPaid, 0);
  const projectedProgress = record.totalAmount > 0 ? Math.round((projectedPaid / record.totalAmount) * 100) : 0;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!proof) {
      setError('Payment proof is required before saving payment changes.');
      return;
    }
    if (amount <= 0 || amount > record.remainingBalance) {
      setError('Enter a payment amount greater than zero and not above the remaining balance.');
      return;
    }
    await onSubmit({ paymentType, paymentAmount: amount, paymentMethod, paymentDate, dueDate, notes }, proof);
  };

  return (
    <Modal title="Add In-Person Payment" eyebrow={record.paymentReference} onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="grid max-h-[72vh] gap-6 overflow-y-auto p-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Payment Type">
                <select value={paymentType} onChange={(event) => setPaymentType(event.target.value)} className={inputClass}>
                  {PAYMENT_TYPES.map((type) => <option key={type} value={type}>{label(type)}</option>)}
                </select>
              </Field>
              <Field label="Payment Amount"><input type="number" min="0.01" max={record.remainingBalance} step="0.01" required value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} className={inputClass} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Payment Method">
                <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className={inputClass}>
                  {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </Field>
              <Field label="Payment Date"><input type="date" required value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} className={inputClass} /></Field>
            </div>
            <Field label="Next / Balance Due Date"><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={inputClass} /></Field>
            <Field label="Notes"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={textareaClass} /></Field>
            <ProofPicker file={proof} onChange={setProof} error={error.includes('proof') ? error : undefined} />
            {error && !error.includes('proof') && <p className="text-sm font-semibold text-red-600">{error}</p>}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-[#1a1f18] p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#E9D77D]">Live calculation</p>
              <div className="mt-4 space-y-3 text-sm">
                <Calculation label="Package Price" value={money(record.totalAmount)} />
                <Calculation label="Previously Verified" value={money(record.amountPaid)} />
                <Calculation label="New Payment" value={money(amount)} accent />
                <div className="border-t border-white/10 pt-3">
                  <Calculation label="Projected Balance" value={money(projectedBalance)} strong />
                </div>
              </div>
              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-[#D6B53B] to-emerald-400 transition-all" style={{ width: `${Math.min(projectedProgress, 100)}%` }} />
              </div>
              <p className="mt-2 text-right text-xs text-white/60">{projectedProgress}% after verification</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              <strong>Verification rule:</strong> saving submits this amount for review. It will not increase collected revenue or reduce the verified balance until a Super Admin approves the proof.
            </div>
          </div>
        </div>
        <ModalFooter isSaving={isSaving} onClose={onClose} submitLabel="Submit for Verification" />
      </form>
    </Modal>
  );
}

function EditPaymentModal({
  record,
  isSuperAdmin,
  isSaving,
  onClose,
  onSubmit,
}: {
  record: PaymentRecord;
  isSuperAdmin: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: Record<string, unknown>, proof: File | null) => Promise<boolean>;
}) {
  const [form, setForm] = useState({
    totalAmount: String(record.totalAmount),
    amountPaid: String(record.amountPaid),
    status: record.status,
    paymentType: record.paymentType ?? 'PARTIAL_PAYMENT',
    paymentMethod: record.paymentMethod ?? '',
    paymentDate: toDateInput(record.paymentDate),
    dueDate: toDateInput(record.dueDate),
    notes: record.notes ?? '',
    reason: '',
  });
  const [proof, setProof] = useState<File | null>(null);
  const [error, setError] = useState('');

  const protectedChange = isSuperAdmin && (
    Number(form.totalAmount) !== record.totalAmount ||
    Number(form.amountPaid) !== record.amountPaid ||
    form.status !== record.status ||
    form.paymentType !== (record.paymentType ?? 'PARTIAL_PAYMENT') ||
    form.paymentMethod !== (record.paymentMethod ?? '')
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (protectedChange && !proof) {
      setError('Payment proof is required before saving payment changes.');
      return;
    }
    if (protectedChange && form.reason.trim().length < 5) {
      setError('Enter a clear reason for the Super Admin payment override.');
      return;
    }
    await onSubmit(isSuperAdmin
      ? {
          totalAmount: Number(form.totalAmount),
          amountPaid: Number(form.amountPaid),
          status: form.status,
          paymentType: form.paymentType,
          paymentMethod: form.paymentMethod,
          paymentDate: form.paymentDate,
          dueDate: form.dueDate,
          notes: form.notes,
          reason: form.reason,
        }
      : {
          dueDate: form.dueDate,
          notes: form.notes,
        }, proof);
  };

  const setField = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <Modal title="Edit Payment Record" eyebrow={isSuperAdmin ? 'Super Admin controls' : 'Limited Admin edit'} onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="max-h-[72vh] space-y-5 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Package Price"><input disabled={!isSuperAdmin} type="number" min="0.01" step="0.01" value={form.totalAmount} onChange={(event) => setField('totalAmount', event.target.value)} className={inputClass} /></Field>
            <Field label="Verified Amount Paid"><input disabled={!isSuperAdmin} type="number" min="0" step="0.01" value={form.amountPaid} onChange={(event) => setField('amountPaid', event.target.value)} className={inputClass} /></Field>
            <Field label="Payment Status">
              <select disabled={!isSuperAdmin} value={form.status} onChange={(event) => setField('status', event.target.value)} className={inputClass}>
                {PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}
              </select>
            </Field>
            <Field label="Payment Type">
              <select disabled={!isSuperAdmin} value={form.paymentType} onChange={(event) => setField('paymentType', event.target.value)} className={inputClass}>
                {PAYMENT_TYPES.map((type) => <option key={type} value={type}>{label(type)}</option>)}
              </select>
            </Field>
            <Field label="Payment Method">
              <select disabled={!isSuperAdmin} value={form.paymentMethod} onChange={(event) => setField('paymentMethod', event.target.value)} className={inputClass}>
                <option value="">Not set</option>
                {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
              </select>
            </Field>
            <Field label="Payment Date"><input disabled={!isSuperAdmin} type="date" value={form.paymentDate} onChange={(event) => setField('paymentDate', event.target.value)} className={inputClass} /></Field>
            <Field label="Due Date"><input type="date" value={form.dueDate} onChange={(event) => setField('dueDate', event.target.value)} className={inputClass} /></Field>
          </div>
          <Field label="Internal Notes"><textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} className={textareaClass} /></Field>
          {isSuperAdmin && protectedChange && (
            <>
              <Field label="Override Reason"><textarea required minLength={5} value={form.reason} onChange={(event) => setField('reason', event.target.value)} placeholder="Explain why the verified amount, status, method, type, or package price is changing." className={textareaClass} /></Field>
              <ProofPicker file={proof} onChange={setProof} error={error.includes('proof') ? error : undefined} />
            </>
          )}
          {!isSuperAdmin && (
            <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              Admin access can update the due date and internal notes. Verified amounts, payment status, method, and type require a Super Admin override with a reason and new proof.
            </p>
          )}
          {error && !error.includes('proof') && <p className="text-sm font-semibold text-red-600">{error}</p>}
        </div>
        <ModalFooter isSaving={isSaving} onClose={onClose} submitLabel="Save Changes" />
      </form>
    </Modal>
  );
}

function Calculation({ label: calculationLabel, value, accent = false, strong = false }: { label: string; value: string; accent?: boolean; strong?: boolean }) {
  return <div className={`flex items-center justify-between gap-4 ${strong ? 'text-base font-bold' : ''}`}><span className="text-white/60">{calculationLabel}</span><span className={accent ? 'font-bold text-[#E9D77D]' : ''}>{value}</span></div>;
}

function ModalFooter({ isSaving, onClose, submitLabel }: { isSaving: boolean; onClose: () => void; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4 dark:border-white/10 dark:bg-[#141A13]">
      <button type="button" disabled={isSaving} onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">Cancel</button>
      <button type="submit" disabled={isSaving} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-[#1a1f18] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#D6B53B] disabled:opacity-50 dark:bg-[#D6B53B] dark:text-[#141A13]">
        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}{submitLabel}
      </button>
    </div>
  );
}
