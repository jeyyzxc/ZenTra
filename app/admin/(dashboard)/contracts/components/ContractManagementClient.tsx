'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FilePenLine,
  FileText,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import ExportFormatMenu, { type ExportFormat, type ExportScope } from '@/components/admin/ExportFormatMenu';
import type {
  ContractBookingEventDto,
  ContractDto,
  ContractPageData,
  ContractSummaryDto,
  ContractTemplateDto,
} from '@/services/contract';

type TabKey = 'booking-events' | 'contracts' | 'failed-delivery' | 'signed-contracts' | 'templates';

const EMPTY_SUMMARY: ContractSummaryDto = {
  totalContracts: 0,
  draftContracts: 0,
  readyToSend: 0,
  sentContracts: 0,
  signedContracts: 0,
  failedDelivery: 0,
  bookingsWithoutContract: 0,
  pendingClientSignature: 0,
};

const TABS: Array<{
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'booking-events', label: 'Booking Events', icon: FilePenLine },
  { key: 'contracts', label: 'Contracts', icon: FileText },
  { key: 'failed-delivery', label: 'Failed Delivery', icon: AlertTriangle },
  { key: 'signed-contracts', label: 'Signed Contracts', icon: FileCheck2 },
  { key: 'templates', label: 'Templates', icon: ShieldCheck },
];

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatMoney(value: number | null | undefined) {
  return `PHP ${(value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function titleCase(value: string | null | undefined) {
  return (value ?? 'not set')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\bN8n\b/g, 'n8n').replace(/\bAi\b/g, 'AI');
}

function timeInputValue(value: string | null | undefined) {
  return value && /^\d{2}:\d{2}$/.test(value) ? value : '';
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes('failed') || normalized.includes('bounced') || normalized.includes('cancelled')) {
    return 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300';
  }

  if (normalized.includes('signed') || normalized.includes('delivered') || normalized === 'sent' || normalized === 'active') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300';
  }

  if (normalized.includes('ready') || normalized.includes('queued') || normalized.includes('retry')) {
    return 'border-[#D6B53B]/40 bg-[#FDF5CC] text-[#8E7722] dark:border-[#D6B53B]/20 dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]';
  }

  if (normalized.includes('generated') || normalized.includes('processing') || normalized.includes('viewed')) {
    return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300';
  }

  return 'border-gray-200 bg-gray-50 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]';
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${statusClass(status)}`}>
      {titleCase(status)}
    </span>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#D6B53B]/30 bg-[#FDF5CC]/30 p-8 text-center dark:bg-[#D6B53B]/5">
      <FileText className="mb-3 h-9 w-9 text-[#D6B53B]" />
      <h3 className="font-sahitya text-xl font-bold uppercase tracking-[0.08em]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">{detail}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-white/70 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#D6B53B]/40 hover:shadow-md dark:border-white/10 dark:bg-[#141A13]"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-2 font-sahitya text-3xl font-bold">{value}</p>
    </button>
  );
}

function BookingCard({
  booking,
  selected,
  onSelect,
  onGenerate,
}: {
  booking: ContractBookingEventDto;
  selected: boolean;
  onSelect: () => void;
  onGenerate: () => void;
}) {
  return (
    <article className={`rounded-xl border bg-white p-4 shadow-sm transition dark:bg-[#141A13] ${
      selected ? 'border-[#D6B53B] ring-2 ring-[#D6B53B]/20' : 'border-gray-100 hover:border-[#D6B53B]/30 dark:border-white/10'
    }`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#8E7722]">{booking.bookingReference}</span>
            <StatusBadge status={booking.contractStatus} />
            <StatusBadge status={booking.paymentStatus} />
          </div>
          <h3 className="mt-2 font-sahitya text-xl font-bold uppercase tracking-[0.05em]">{booking.clientName}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-[#A3B19B]">
            {booking.eventType} - {booking.packageName ?? 'No package'} - {formatDate(booking.eventDate)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {booking.clientEmail ?? 'No email'} - {booking.guestCount} pax - {booking.assignedCoordinator ?? 'Unassigned'}
          </p>
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!booking.canGenerate}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1a1f18] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#D6B53B] hover:text-[#1a1f18] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#D6B53B] dark:text-[#0C100B]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Generate
        </button>
      </div>
      {booking.eligibilityIssues.length > 0 && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          {booking.eligibilityIssues.join(' ')}
        </p>
      )}
    </article>
  );
}

function ContractCard({
  contract,
  selected,
  onSelect,
}: {
  contract: ContractDto;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition dark:bg-[#141A13] ${
        selected ? 'border-[#D6B53B] ring-2 ring-[#D6B53B]/20' : 'border-gray-100 hover:border-[#D6B53B]/30 dark:border-white/10'
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#8E7722]">{contract.contractNumber}</span>
            <StatusBadge status={contract.contractStatus} />
            <StatusBadge status={contract.emailStatus} />
          </div>
          <h3 className="mt-2 font-sahitya text-xl font-bold uppercase tracking-[0.05em]">{contract.clientName}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-[#A3B19B]">
            {contract.bookingReference} - {contract.eventType} - {formatDate(contract.eventDate)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-[#A3B19B] sm:min-w-64">
          <span>Amount<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">{formatMoney(contract.contractAmount)}</strong></span>
          <span>Balance<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">{formatMoney(contract.remainingBalance)}</strong></span>
          <span>Version v{contract.latestVersion || 1}</span>
          <span>{formatDateTime(contract.updatedAt)}</span>
        </div>
      </div>
    </button>
  );
}

function TemplateGrid({
  templates,
  isSuperAdmin,
  busyId,
  onCreateVersion,
  onActivate,
}: {
  templates: ContractTemplateDto[];
  isSuperAdmin: boolean;
  busyId: string | null;
  onCreateVersion: (template: ContractTemplateDto) => void;
  onActivate: (template: ContractTemplateDto) => void;
}) {
  if (templates.length === 0) {
    return <EmptyState title="No contract templates" detail="Approved contract templates will appear here once created." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {templates.map((template) => (
        <article key={template.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8E7722]">Template v{template.templateVersion}</p>
              <h3 className="mt-2 font-sahitya text-xl font-bold uppercase tracking-[0.06em]">{template.templateName}</h3>
            </div>
            <StatusBadge status={template.isActive ? 'active' : 'inactive'} />
          </div>
          <p className="mt-3 text-sm text-gray-500 dark:text-[#A3B19B]">{template.eventType ?? 'All event types'}</p>
          <p className="mt-4 rounded-lg bg-[#FDF5CC]/50 p-3 text-xs leading-5 text-gray-600 dark:bg-[#D6B53B]/10 dark:text-[#A3B19B]">
            Terms, venue rules, cancellation policy, advertisement clause, client responsibility, owner name, and signature are locked.
          </p>
          {isSuperAdmin ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => onCreateVersion(template)} className="inline-flex items-center gap-2 rounded-lg border border-[#D6B53B]/40 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8E7722]">
                <Plus className="h-3.5 w-3.5" />
                New Version
              </button>
              {!template.isActive && (
                <button type="button" disabled={busyId === template.id} onClick={() => onActivate(template)} className="inline-flex items-center gap-2 rounded-lg bg-[#1a1f18] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-40 dark:bg-[#D6B53B] dark:text-[#0C100B]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Activate
                </button>
              )}
            </div>
          ) : (
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Super Admin editing only</p>
          )}
        </article>
      ))}
    </div>
  );
}

export default function ContractManagementClient({
  currentUserRole,
}: {
  currentUserRole: 'SUPERADMIN' | 'ADMIN';
}) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ContractPageData | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('booking-events');
  const [search, setSearch] = useState(searchParams.get('q') ?? searchParams.get('search') ?? '');
  const [status, setStatus] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [workflowStatus, setWorkflowStatus] = useState('');
  const [signatureStatus, setSignatureStatus] = useState('');
  const [bookingStatus, setBookingStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [eventType, setEventType] = useState('');
  const [packageFilter, setPackageFilter] = useState('');
  const [coordinator, setCoordinator] = useState('');
  const [generatedBy, setGeneratedBy] = useState('');
  const [sentStatus, setSentStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<ContractBookingEventDto | null>(null);
  const [selectedContract, setSelectedContract] = useState<ContractDto | null>(null);
  const [templateDraft, setTemplateDraft] = useState<ContractTemplateDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isSuperAdmin = currentUserRole === 'SUPERADMIN';

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);
    if (emailStatus) params.set('emailStatus', emailStatus);
    if (workflowStatus) params.set('workflowStatus', workflowStatus);
    if (signatureStatus) params.set('signatureStatus', signatureStatus);
    if (bookingStatus) params.set('bookingStatus', bookingStatus);
    if (paymentStatus) params.set('paymentStatus', paymentStatus);
    if (eventType) params.set('eventType', eventType);
    if (packageFilter) params.set('package', packageFilter);
    if (coordinator) params.set('coordinator', coordinator);
    if (generatedBy) params.set('generatedBy', generatedBy);
    if (sentStatus) params.set('sentStatus', sentStatus);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    return params;
  }, [
    bookingStatus,
    coordinator,
    dateFrom,
    dateTo,
    emailStatus,
    eventType,
    generatedBy,
    packageFilter,
    paymentStatus,
    search,
    sentStatus,
    signatureStatus,
    status,
    workflowStatus,
  ]);

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);

    try {
      const response = await fetch(`/api/contracts?${buildQuery().toString()}`, { cache: 'no-store' });
      const payload = await response.json() as ContractPageData | { error?: string };

      if (!response.ok || !('summary' in payload)) {
        throw new Error('error' in payload && payload.error ? payload.error : 'Unable to load contract data.');
      }

      setData(payload);
      setSelectedBooking((current) => (
        payload.bookingEvents.find((booking) => booking.id === current?.id) ?? payload.bookingEvents[0] ?? null
      ));
      setSelectedContract((current) => (
        payload.contracts.find((contract) => contract.id === current?.id) ?? payload.contracts[0] ?? null
      ));
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load contract data.' });
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 250);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const activeContracts = useMemo(() => {
    if (!data) return [];
    if (activeTab === 'failed-delivery') return data.failedDelivery;
    if (activeTab === 'signed-contracts') return data.signedContracts;
    return data.contracts;
  }, [activeTab, data]);

  const runAction = async (
    id: string,
    action: () => Promise<Response>,
    successMessage: string,
  ) => {
    setBusyId(id);
    setNotice(null);

    try {
      const response = await action();
      const payload = await response.json().catch(() => ({})) as { error?: string; contract?: ContractDto };
      if (!response.ok) throw new Error(payload.error || 'Contract action failed.');

      if (payload.contract) {
        setSelectedContract(payload.contract);
        setActiveTab('contracts');
      }
      setNotice({ type: 'success', text: successMessage });
      await loadData(true);
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Contract action failed.' });
      await loadData(true);
    } finally {
      setBusyId(null);
    }
  };

  const generateContract = (booking: ContractBookingEventDto) => {
    void runAction(
      booking.id,
      () => fetch('/api/contracts/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      }),
      'Contract generated from booking, package, and payment data.',
    );
  };

  const sendContract = (contract: ContractDto, resend = false) => {
    void runAction(
      contract.id,
      () => fetch(`/api/contracts/${contract.id}/${resend ? 'resend' : 'send'}`, { method: 'POST' }),
      resend ? 'Contract resend workflow recorded.' : 'Contract delivery workflow triggered.',
    );
  };

  const resolveDeliveryIssue = (contract: ContractDto) => {
    void runAction(
      contract.id,
      () => fetch(`/api/contracts/${contract.id}/resolve-delivery`, { method: 'POST' }),
      'Delivery issue resolved. The contract is ready to send again.',
    );
  };

  const saveContract = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedContract) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));

    void runAction(
      selectedContract.id,
      () => fetch(`/api/contracts/${selectedContract.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      }),
      'Allowed dynamic contract fields saved.',
    );
  };

  const exportContracts = (format: ExportFormat, scope: ExportScope) => {
    if (format === 'print') {
      window.print();
      return;
    }

    const params = buildQuery();
    params.set('format', format);
    params.set('scope', scope);
    params.set('timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    if (scope === 'selected' && selectedContract) {
      params.set('ids', selectedContract.id);
    }

    window.location.href = `/api/contracts/export?${params.toString()}`;
  };

  const saveTemplateVersion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!templateDraft || !isSuperAdmin) return;

    setBusyId(templateDraft.id);
    setNotice(null);
    const values = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const response = await fetch('/api/contract-templates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          templateName: values.templateName,
          eventType: values.eventType,
          htmlTemplate: values.htmlTemplate,
          staticTermsContent: values.staticTermsContent,
          lockedSections: templateDraft.lockedSections,
        }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to create template version.');

      setTemplateDraft(null);
      setNotice({ type: 'success', text: 'New contract template version created. Activate it when approved.' });
      await loadData(true);
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Unable to create template version.' });
    } finally {
      setBusyId(null);
    }
  };

  const activateTemplate = async (template: ContractTemplateDto) => {
    setBusyId(template.id);
    setNotice(null);

    try {
      const response = await fetch(`/api/contract-templates/${template.id}/activate`, { method: 'POST' });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to activate template.');

      setNotice({ type: 'success', text: `Template v${template.templateVersion} is now active.` });
      await loadData(true);
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Unable to activate template.' });
    } finally {
      setBusyId(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setEmailStatus('');
    setWorkflowStatus('');
    setSignatureStatus('');
    setBookingStatus('');
    setPaymentStatus('');
    setEventType('');
    setPackageFilter('');
    setCoordinator('');
    setGeneratedBy('');
    setSentStatus('');
    setDateFrom('');
    setDateTo('');
  };

  const selectBooking = (booking: ContractBookingEventDto) => {
    setSelectedBooking(booking);
    setSelectedContract(data?.contracts.find((contract) => contract.id === booking.latestContractId) ?? null);
  };

  const summary = data?.summary ?? EMPTY_SUMMARY;
  const canResend = selectedContract
    ? ['failed', 'bounced', 'pending'].includes(selectedContract.emailStatus) ||
      selectedContract.contractStatus === 'delivery_failed' ||
      ['failed', 'retrying', 'manual_fallback'].includes(selectedContract.workflowStatus)
    : false;

  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 py-4 font-sans text-[#1a1f18] dark:text-[#F4F4F0] sm:px-6">
      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D6B53B]/30 bg-[#FDF5CC] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
            <Workflow className="h-3.5 w-3.5" />
            Contract Operations
          </div>
          <h1 className="font-sahitya text-3xl font-bold uppercase tracking-[0.08em]">Contract Management</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
            Generate, preview, edit, send, download, and track client contracts based on approved booking events.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportFormatMenu
            onExport={exportContracts}
            scopeOptions={[
              {
                scope: 'filtered',
                label: 'Filtered',
                description: `${activeContracts.length} visible contract registry record(s)`,
              },
              {
                scope: 'selected',
                label: 'Selected',
                description: selectedContract ? selectedContract.contractNumber : 'Select a contract to export one record',
                disabled: !selectedContract,
              },
              {
                scope: 'all',
                label: 'All Authorized',
                description: 'All contract records you are allowed to export',
              },
            ]}
          />
          <button type="button" onClick={() => void loadData()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6B53B]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#8E7722] shadow-sm hover:bg-[#FDF5CC] dark:bg-white/5 dark:text-[#D6B53B]">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Contracts" value={summary.totalContracts} onClick={() => { clearFilters(); setActiveTab('contracts'); }} />
        <SummaryCard label="Ready to Send" value={summary.readyToSend} onClick={() => { setActiveTab('contracts'); setStatus('ready_to_send'); }} />
        <SummaryCard label="Failed Delivery" value={summary.failedDelivery} onClick={() => setActiveTab('failed-delivery')} />
        <SummaryCard label="Without Contract" value={summary.bookingsWithoutContract} onClick={() => { clearFilters(); setActiveTab('booking-events'); }} />
        <SummaryCard label="Draft Contracts" value={summary.draftContracts} onClick={() => { setActiveTab('contracts'); setStatus('draft'); }} />
        <SummaryCard label="Sent Contracts" value={summary.sentContracts} onClick={() => { setActiveTab('contracts'); setStatus('sent'); }} />
        <SummaryCard label="Signed Contracts" value={summary.signedContracts} onClick={() => { setSignatureStatus('signed'); setActiveTab('signed-contracts'); }} />
        <SummaryCard label="Pending Signature" value={summary.pendingClientSignature} onClick={() => { setSignatureStatus('pending'); setActiveTab('contracts'); }} />
      </section>

      <section className="rounded-xl border border-white/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search client, booking, contract, email, event, package" className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5">
            <option value="">All contract status</option>
            {data?.filters.statuses.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
          </select>
          <select value={workflowStatus} onChange={(event) => setWorkflowStatus(event.target.value)} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5">
            <option value="">All workflow status</option>
            {data?.filters.workflowStatuses.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
          </select>
        </div>
        <details className="mt-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-[#8E7722]">
            <span className="inline-flex items-center gap-2"><CalendarRange className="h-4 w-4" /> More Filters</span>
            <button type="button" onClick={(event) => { event.preventDefault(); clearFilters(); }} className="rounded-md px-2 py-1 text-[10px] text-gray-500 hover:bg-white">Clear</button>
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-semibold text-gray-500">Event date from
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
            </label>
            <label className="text-xs font-semibold text-gray-500">Event date to
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
            </label>
            <select aria-label="Booking status" value={bookingStatus} onChange={(event) => setBookingStatus(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              <option value="">All booking status</option>
              {data?.filters.bookingStatuses.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
            </select>
            <select aria-label="Payment status" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              <option value="">All payment status</option>
              {data?.filters.paymentStatuses.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
            </select>
            <select aria-label="Event type" value={eventType} onChange={(event) => setEventType(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              <option value="">All event types</option>
              {data?.filters.eventTypes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select aria-label="Package" value={packageFilter} onChange={(event) => setPackageFilter(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              <option value="">All packages</option>
              {data?.filters.packages.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select aria-label="Assigned coordinator" value={coordinator} onChange={(event) => setCoordinator(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              <option value="">All coordinators</option>
              <option value="unassigned">Unassigned</option>
              {data?.filters.coordinators.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select aria-label="Generated by" value={generatedBy} onChange={(event) => setGeneratedBy(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              <option value="">Generated by anyone</option>
              {data?.filters.generators.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select aria-label="Email status" value={emailStatus} onChange={(event) => setEmailStatus(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              <option value="">All email status</option>
              {data?.filters.emailStatuses.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
            </select>
            <select aria-label="Sent status" value={sentStatus} onChange={(event) => setSentStatus(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              <option value="">All sent status</option>
              {data?.filters.sentStatuses.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
            </select>
            <select aria-label="Signature status" value={signatureStatus} onChange={(event) => setSignatureStatus(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              <option value="">All signature status</option>
              {data?.filters.signatureStatuses.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
            </select>
          </div>
        </details>
        <nav className="mt-3 flex flex-wrap gap-2" aria-label="Contract views">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] ${
                activeTab === tab.key
                  ? 'bg-[#1a1f18] text-white dark:bg-[#D6B53B] dark:text-[#0C100B]'
                  : 'bg-gray-50 text-gray-500 hover:bg-[#FDF5CC] hover:text-[#8E7722] dark:bg-white/5 dark:text-[#A3B19B]'
              }`}>
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </section>

      {notice && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
          notice.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {notice.text}
        </div>
      )}

      <div className="grid min-h-[680px] gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <main className="space-y-4">
          {isLoading && Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-white shadow-sm dark:bg-white/5" />
          ))}

          {!isLoading && activeTab === 'booking-events' && (
            data?.bookingEvents.length ? data.bookingEvents.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                selected={selectedBooking?.id === booking.id}
                onSelect={() => selectBooking(booking)}
                onGenerate={() => generateContract(booking)}
              />
            )) : <EmptyState title="No booking events ready for contract generation" detail="Eligible bookings will appear here once required booking, package, and payment information is available." />
          )}

          {!isLoading && activeTab !== 'booking-events' && activeTab !== 'templates' && (
            activeContracts.length ? activeContracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                selected={selectedContract?.id === contract.id}
                onSelect={() => {
                  setSelectedContract(contract);
                  setSelectedBooking(data?.bookingEvents.find((booking) => booking.id === contract.bookingId) ?? null);
                }}
              />
            )) : (
              <EmptyState
                title={activeTab === 'failed-delivery' ? 'No failed contract deliveries' : activeTab === 'signed-contracts' ? 'No signed contracts' : 'No contracts generated yet'}
                detail={activeTab === 'failed-delivery' ? 'Failed contract emails and workflow errors will appear here when action is needed.' : 'Generate a contract from an eligible booking event to get started.'}
              />
            )
          )}

          {!isLoading && activeTab === 'templates' && (
            <>
              <TemplateGrid
                templates={data?.templates ?? []}
                isSuperAdmin={isSuperAdmin}
                busyId={busyId}
                onCreateVersion={setTemplateDraft}
                onActivate={(template) => void activateTemplate(template)}
              />
              {isSuperAdmin && templateDraft && (
                <form onSubmit={saveTemplateVersion} className="rounded-xl border border-[#D6B53B]/30 bg-white p-5 shadow-sm dark:bg-[#141A13]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8E7722]">Versioned Template Update</p>
                      <h3 className="mt-1 font-sahitya text-xl font-bold uppercase tracking-[0.06em]">Create v{templateDraft.templateVersion + 1}</h3>
                    </div>
                    <button type="button" onClick={() => setTemplateDraft(null)} className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">Cancel</button>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-gray-500">Template name
                      <input name="templateName" required defaultValue={templateDraft.templateName} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
                    </label>
                    <label className="text-xs font-semibold text-gray-500">Event type
                      <input name="eventType" defaultValue={templateDraft.eventType ?? ''} placeholder="All event types" className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
                    </label>
                  </div>
                  <label className="mt-3 block text-xs font-semibold text-gray-500">Approved template HTML
                    <textarea name="htmlTemplate" required defaultValue={templateDraft.htmlTemplate} rows={12} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs leading-5 dark:border-white/10 dark:bg-white/5" />
                  </label>
                  <label className="mt-3 block text-xs font-semibold text-gray-500">Static terms version note
                    <textarea name="staticTermsContent" defaultValue={templateDraft.staticTermsContent ?? ''} rows={3} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
                  </label>
                  <p className="mt-3 text-xs leading-5 text-amber-700">Creating a version never overwrites the currently approved template. Review the locked legal sections before activating it.</p>
                  <button type="submit" disabled={busyId === templateDraft.id} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1a1f18] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-40 dark:bg-[#D6B53B] dark:text-[#0C100B]">
                    <Save className="h-3.5 w-3.5" />
                    Save New Version
                  </button>
                </form>
              )}
            </>
          )}
        </main>

        <aside className="rounded-xl border border-white/70 bg-[#FDF5CC] p-4 shadow-sm dark:border-white/10 dark:bg-[#11160F] xl:sticky xl:top-4 xl:h-[calc(100vh-128px)] xl:overflow-y-auto">
          {selectedContract ? (
            <div className="space-y-4">
              <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#141A13]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-bold text-[#8E7722]">{selectedContract.contractNumber}</p>
                    <h2 className="mt-1 font-sahitya text-2xl font-bold uppercase tracking-[0.06em]">{selectedContract.clientName}</h2>
                  </div>
                  <StatusBadge status={selectedContract.contractStatus} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-[#A3B19B]">
                  <span>Booking<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">{selectedContract.bookingReference}</strong></span>
                  <span>Version<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">v{selectedContract.latestVersion || 1}</strong></span>
                  <span>Email<br /><StatusBadge status={selectedContract.emailStatus} /></span>
                  <span>Workflow<br /><StatusBadge status={selectedContract.workflowStatus} /></span>
                  <span>Signature<br /><StatusBadge status={selectedContract.signatureStatus} /></span>
                  <span>Balance<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">{formatMoney(selectedContract.remainingBalance)}</strong></span>
                  <span>Template<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">v{selectedContract.templateVersion}</strong></span>
                  <span>Generated<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">{formatDateTime(selectedContract.createdAt)}</strong></span>
                  <span>Sent<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">{formatDateTime(selectedContract.lastSentAt)}</strong></span>
                  <span>Viewed<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">{formatDateTime(selectedContract.viewedAt)}</strong></span>
                  <span>Signed<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">{formatDateTime(selectedContract.signedAt)}</strong></span>
                  <span>Updated<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">{formatDateTime(selectedContract.updatedAt)}</strong></span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a href={selectedContract.pdfUrl ?? `/api/contracts/${selectedContract.id}/download`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] hover:bg-gray-50 dark:border-white/10 dark:bg-white/5">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                  <button type="button" onClick={() => sendContract(selectedContract)} disabled={busyId === selectedContract.id || selectedContract.contractStatus === 'signed'} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1a1f18] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[#D6B53B] hover:text-[#1a1f18] disabled:opacity-40 dark:bg-[#D6B53B] dark:text-[#0C100B]">
                    <Send className="h-3.5 w-3.5" />
                    Send
                  </button>
                  {canResend && (
                    <>
                      <button type="button" onClick={() => sendContract(selectedContract, true)} disabled={busyId === selectedContract.id} className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-red-700 disabled:opacity-40">
                        <Mail className="h-3.5 w-3.5" />
                        Resend Failed Delivery
                      </button>
                      <button type="button" onClick={() => resolveDeliveryIssue(selectedContract)} disabled={busyId === selectedContract.id} className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 disabled:opacity-40">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark Issue Resolved
                      </button>
                    </>
                  )}
                </div>
              </section>

              <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#141A13]">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#8E7722]">Booking and Payment Summary</h3>
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-[#A3B19B]">
                  <span>Booking status<br /><StatusBadge status={selectedContract.booking.status} /></span>
                  <span>Payment status<br /><StatusBadge status={selectedContract.booking.paymentStatus} /></span>
                  <span>Event<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">{selectedContract.eventType}</strong></span>
                  <span>Date<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">{formatDate(selectedContract.eventDate)}</strong></span>
                  <span>Venue<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">{selectedContract.booking.venue}</strong></span>
                  <span>Coordinator<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">{selectedContract.booking.assignedCoordinator ?? 'Unassigned'}</strong></span>
                  <span>Total paid<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">{formatMoney(selectedContract.totalPaid)}</strong></span>
                  <span>Contract amount<br /><strong className="text-[#1a1f18] dark:text-[#F4F4F0]">{formatMoney(selectedContract.contractAmount)}</strong></span>
                </div>
              </section>

              <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#141A13]">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#8E7722]">Editable Dynamic Fields</h3>
                <form key={selectedContract.id} onSubmit={saveContract} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-gray-500">Client name
                      <input name="clientName" defaultValue={selectedContract.clientName} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                    </label>
                    <label className="text-xs font-semibold text-gray-500">Client email
                      <input name="clientEmail" type="email" defaultValue={selectedContract.clientEmail ?? ''} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                    </label>
                    <label className="text-xs font-semibold text-gray-500">Event date
                      <input name="eventDate" type="date" defaultValue={selectedContract.eventDate.slice(0, 10)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                    </label>
                    <label className="text-xs font-semibold text-gray-500">Total pax
                      <input name="totalPax" type="number" min="0" step="1" defaultValue={selectedContract.dynamicFields.totalPax} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                    </label>
                    <label className="text-xs font-semibold text-gray-500">Check-in / start time
                      <input name="startTime" type="time" defaultValue={timeInputValue(selectedContract.dynamicFields.startTime)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                    </label>
                    <label className="text-xs font-semibold text-gray-500">Check-out / end time
                      <input name="endTime" type="time" defaultValue={timeInputValue(selectedContract.dynamicFields.endTime)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                    </label>
                    <label className="text-xs font-semibold text-gray-500">Colors
                      <input name="colors" defaultValue={selectedContract.dynamicFields.colors} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                    </label>
                    <label className="text-xs font-semibold text-gray-500">Theme
                      <input name="theme" defaultValue={selectedContract.dynamicFields.theme} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                    </label>
                    <label className="text-xs font-semibold text-gray-500">Package name
                      <input name="packageName" defaultValue={selectedContract.packageName ?? ''} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                    </label>
                    <label className="text-xs font-semibold text-gray-500">Contract amount
                      <input name="contractAmount" type="number" min="0" step="0.01" defaultValue={selectedContract.contractAmount ?? ''} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                    </label>
                    <label className="text-xs font-semibold text-gray-500">Total paid
                      <input name="totalPaid" type="number" min="0" step="0.01" defaultValue={selectedContract.totalPaid ?? ''} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                    </label>
                    <label className="text-xs font-semibold text-gray-500">Remaining balance
                      <input name="remainingBalance" type="number" min="0" step="0.01" defaultValue={selectedContract.remainingBalance ?? ''} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                    </label>
                  </div>
                  <label className="block text-xs font-semibold text-gray-500">Package inclusions, one per line
                    <textarea name="packageInclusions" defaultValue={selectedContract.dynamicFields.packageInclusions.join('\n')} rows={5} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                  </label>
                  <label className="block text-xs font-semibold text-gray-500">Item description
                    <textarea name="itemDescription" defaultValue={selectedContract.dynamicFields.itemDescription} rows={2} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                  </label>
                  <label className="block text-xs font-semibold text-gray-500">Payment schedule
                    <textarea name="paymentSchedule" defaultValue={selectedContract.dynamicFields.paymentSchedule} rows={2} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                  </label>
                  <label className="block text-xs font-semibold text-gray-500">Payment remarks
                    <textarea name="paymentRemarks" defaultValue={selectedContract.dynamicFields.paymentRemarks} rows={2} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                  </label>
                  <label className="block text-xs font-semibold text-gray-500">Internal notes
                    <textarea name="internalNotes" defaultValue={selectedContract.internalNotes ?? ''} rows={3} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5" />
                  </label>
                  <button type="submit" disabled={busyId === selectedContract.id} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a1f18] px-3 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[#D6B53B] hover:text-[#1a1f18] disabled:opacity-40 dark:bg-[#D6B53B] dark:text-[#0C100B]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Save Dynamic Fields
                  </button>
                </form>
              </section>

              <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#141A13]">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#8E7722]">Actual Generated Preview</h3>
                {selectedContract.htmlPreview ? (
                  <iframe
                    title={`Preview ${selectedContract.contractNumber}`}
                    src={`/api/contracts/${selectedContract.id}/preview`}
                    className="h-[560px] w-full rounded-lg border border-gray-200 bg-white"
                  />
                ) : (
                  <EmptyState title="No contract generated yet" detail="Generate a contract from the selected booking to preview it here." />
                )}
              </section>

              <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#141A13]">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#8E7722]">Delivery and Workflow</h3>
                <div className="space-y-3 text-sm text-gray-500 dark:text-[#A3B19B]">
                  {selectedContract.latestEmail ? (
                    <>
                      <p>{selectedContract.latestEmail.subject}</p>
                      <p>{selectedContract.latestEmail.recipientEmail}</p>
                      <StatusBadge status={selectedContract.latestEmail.status} />
                      <p>Provider ID: {selectedContract.latestEmail.providerMessageId ?? '-'}</p>
                      <p>Retry count: {selectedContract.latestEmail.retryCount}</p>
                      <p>Last attempt: {formatDateTime(selectedContract.latestEmail.lastAttemptAt)}</p>
                      {selectedContract.latestEmail.errorMessage && <p className="text-red-600">{selectedContract.latestEmail.errorMessage}</p>}
                    </>
                  ) : <p>No email delivery record yet.</p>}
                  {selectedContract.latestWorkflow && (
                    <div className="border-t border-gray-100 pt-3 dark:border-white/10">
                      <p className="font-semibold text-[#1a1f18] dark:text-[#F4F4F0]">{selectedContract.latestWorkflow.workflowName}</p>
                      <StatusBadge status={selectedContract.latestWorkflow.status} />
                      <p>Execution ID: {selectedContract.latestWorkflow.workflowExecutionId ?? '-'}</p>
                      <p>Completed: {formatDateTime(selectedContract.latestWorkflow.completedAt)}</p>
                      {selectedContract.latestWorkflow.errorMessage && <p className="text-red-600">{selectedContract.latestWorkflow.errorMessage}</p>}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#141A13]">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#8E7722]">Contract Timeline</h3>
                <div className="space-y-3">
                  {selectedContract.timeline.length ? selectedContract.timeline.map((entry) => (
                    <div key={entry.id} className="flex gap-3 text-sm">
                      <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6B53B]" />
                      <div>
                        <p className="font-semibold">{titleCase(entry.action)}</p>
                        <p className="text-xs leading-5 text-gray-500 dark:text-[#A3B19B]">{entry.description}</p>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-gray-400">{formatDateTime(entry.createdAt)} - {entry.source}</p>
                      </div>
                    </div>
                  )) : <p className="text-sm text-gray-500">No contract timeline entries yet.</p>}
                </div>
              </section>
            </div>
          ) : selectedBooking ? (
            <section className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#141A13]">
              <p className="font-mono text-xs font-bold text-[#8E7722]">{selectedBooking.bookingReference}</p>
              <h2 className="mt-2 font-sahitya text-2xl font-bold uppercase tracking-[0.06em]">{selectedBooking.clientName}</h2>
              <div className="mt-4 space-y-3 text-sm text-gray-500 dark:text-[#A3B19B]">
                <p>{selectedBooking.eventTitle}</p>
                <p>{selectedBooking.eventType} - {formatDate(selectedBooking.eventDate)}</p>
                <p>{selectedBooking.clientEmail ?? 'No email'} - {selectedBooking.guestCount} pax</p>
                <StatusBadge status={selectedBooking.paymentStatus} />
              </div>
              <button type="button" onClick={() => generateContract(selectedBooking)} disabled={!selectedBooking.canGenerate || busyId === selectedBooking.id} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a1f18] px-3 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[#D6B53B] hover:text-[#1a1f18] disabled:opacity-40 dark:bg-[#D6B53B] dark:text-[#0C100B]">
                <Sparkles className="h-3.5 w-3.5" />
                Generate Contract
              </button>
            </section>
          ) : (
            <EmptyState title="Unable to load contract data" detail="Please check your connection or try refreshing the page." />
          )}
        </aside>
      </div>
    </div>
  );
}
