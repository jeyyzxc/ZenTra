'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Mail, RefreshCw } from 'lucide-react';
import AuditLogDetail from './AuditLogDetail';
import AuditLogExport from './AuditLogExport';
import AuditLogFilters from './AuditLogFilters';
import AuditLogPagination from './AuditLogPagination';
import AuditLogTable from './AuditLogTable';
import EmailLogsClient, { type EmailLogsClientHandle } from './EmailLogsClient';
import SystemLogsTabs, { type SystemLogsTab } from './SystemLogsTabs';
import type {
  AuditFilters,
  AuditListResponse,
  AuditLogListItem,
  AuditPagination,
  AuditSort,
  AuditUserOption,
} from '../types';

const EMPTY_FILTERS: AuditFilters = {
  search: '',
  startDate: '',
  endDate: '',
  userId: '',
  userRole: '',
  action: '',
  module: '',
  status: '',
};

const DEFAULT_PAGINATION: AuditPagination = {
  page: 1,
  limit: 10,
  totalRecords: 0,
  totalPages: 1,
};

function dateInputToIso(value: string, boundary: 'start' | 'end') {
  if (!value) {
    return '';
  }

  const suffix = boundary === 'start' ? 'T00:00:00.000' : 'T23:59:59.999';
  return new Date(`${value}${suffix}`).toISOString();
}

export default function AuditLogsClient({
  actionOptions,
  currentUserRole,
  emailTypeOptions,
  moduleOptions,
  relatedModuleOptions,
  roleOptions,
  statusOptions,
  emailStatusOptions,
  triggerSourceOptions,
  userOptions,
  workflowOptions,
  initialAuditSearch,
  initialEmailSearch,
  initialTab,
}: {
  actionOptions: string[];
  currentUserRole: 'SUPERADMIN' | 'ADMIN';
  emailTypeOptions: string[];
  initialAuditSearch?: string;
  initialEmailSearch?: string;
  initialTab?: SystemLogsTab;
  moduleOptions: string[];
  relatedModuleOptions: string[];
  roleOptions: string[];
  statusOptions: string[];
  emailStatusOptions: string[];
  triggerSourceOptions: string[];
  userOptions: AuditUserOption[];
  workflowOptions: string[];
}) {
  const isSuperAdmin = currentUserRole === 'SUPERADMIN';
  const emailLogsRef = useRef<EmailLogsClientHandle>(null);
  const hasLoggedInitialAuditRead = useRef(false);
  const [activeTab, setActiveTab] = useState<SystemLogsTab>(initialTab ?? 'audit');
  const [filters, setFilters] = useState<AuditFilters>({
    ...EMPTY_FILTERS,
    search: initialAuditSearch ?? '',
  });
  const [sort, setSort] = useState<AuditSort>({
    sortBy: 'timestamp',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState<AuditPagination>(DEFAULT_PAGINATION);
  const [logs, setLogs] = useState<AuditLogListItem[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLogListItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailLoading, setIsEmailLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [emailLastUpdated, setEmailLastUpdated] = useState<Date | null>(null);

  const buildQuery = useCallback((includePagination = true) => {
    const params = new URLSearchParams();

    if (includePagination) {
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
    }

    params.set('sortBy', sort.sortBy);
    params.set('sortOrder', sort.sortOrder);

    if (filters.search.trim()) {
      params.set('search', filters.search.trim());
    }

    if (filters.startDate) {
      params.set('startDate', dateInputToIso(filters.startDate, 'start'));
    }

    if (filters.endDate) {
      params.set('endDate', dateInputToIso(filters.endDate, 'end'));
    }

    if (isSuperAdmin && filters.userId) {
      params.set('userId', filters.userId);
    }

    if (isSuperAdmin && filters.userRole) {
      params.set('userRole', filters.userRole);
    }

    if (filters.action) {
      params.set('action', filters.action);
    }

    if (filters.module) {
      params.set('module', filters.module);
    }

    if (filters.status) {
      params.set('status', filters.status);
    }

    return params;
  }, [filters, isSuperAdmin, pagination.limit, pagination.page, sort.sortBy, sort.sortOrder]);

  const loadLogs = useCallback(async (quiet = false) => {
    if (!quiet) {
      setIsLoading(true);
    }

    setError('');

    try {
      const shouldSkipAudit = hasLoggedInitialAuditRead.current || quiet;
      const response = await fetch(`/api/audit?${buildQuery().toString()}`, {
        cache: 'no-store',
        headers: shouldSkipAudit ? { 'X-Audit-Skip': 'poll' } : undefined,
      });
      const payload = await response.json() as AuditListResponse | { error?: string };

      if (!response.ok || !('logs' in payload)) {
        throw new Error('error' in payload && payload.error ? payload.error : 'Unable to load audit logs.');
      }

      setLogs(payload.logs);
      setPagination(payload.pagination);
      setLastUpdated(new Date());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load audit logs.');
    } finally {
      hasLoggedInitialAuditRead.current = true;

      if (!quiet) {
        setIsLoading(false);
      }
    }
  }, [buildQuery]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadLogs();
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [loadLogs]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadLogs(true);
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [loadLogs]);

  const activeFilterCount = useMemo(() => (
    Object.entries(filters)
      .filter(([key, value]) => (
        Boolean(value) && (isSuperAdmin || (key !== 'userId' && key !== 'userRole'))
      ))
      .length
  ), [filters, isSuperAdmin]);

  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const handleSort = (sortBy: string) => {
    setSort((current) => ({
      sortBy,
      sortOrder: current.sortBy === sortBy && current.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const handleSelectLog = async (log: AuditLogListItem) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
    setIsDetailLoading(true);

    try {
      const response = await fetch(`/api/audit/${log.id}`, {
        cache: 'no-store',
      });
      const payload = await response.json() as { log?: AuditLogListItem; error?: string };

      if (!response.ok || !payload.log) {
        throw new Error(payload.error || 'Unable to load this audit log.');
      }

      setSelectedLog(payload.log);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load this audit log.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (activeTab === 'email') {
      emailLogsRef.current?.exportLogs(format);
      return;
    }

    const params = buildQuery(false);
    params.set('format', format);
    params.set('timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);
    window.location.href = `/api/audit/export?${params.toString()}`;
  };

  const activeLastUpdated = activeTab === 'audit' ? lastUpdated : emailLastUpdated;
  const activeIsLoading = activeTab === 'audit' ? isLoading : isEmailLoading;
  const badgeLabel = activeTab === 'email'
    ? 'Email Delivery'
    : isSuperAdmin ? 'Live Audit Trail' : 'Personal Activity';
  const badgeIcon = activeTab === 'email'
    ? <Mail className="h-4 w-4 text-blue-500" />
    : <Activity className="h-4 w-4 text-emerald-500" />;
  const pageSubtitle = activeTab === 'email'
    ? (
      isSuperAdmin
        ? 'Track automated emails, workflow triggers, delivery status, and failed email attempts'
        : 'Your email delivery activity and related notifications'
    )
    : (
      isSuperAdmin
        ? 'Complete system activity trail - all users, all events'
        : 'Your personal activity history within the system'
    );
  const recordCountLabel = isSuperAdmin ? 'Total Records' : 'Your Records';
  const handleRefresh = () => {
    if (activeTab === 'email') {
      emailLogsRef.current?.refresh();
      return;
    }

    void loadLogs();
  };

  return (
    <div className="mx-auto flex w-full flex-col font-sans text-[#1a1f18] dark:text-[#F4F4F0] overflow-x-auto">
      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background-color: #D4AF37;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background-color: #E8D579;
        }
      `}</style>
      <div className="flex shrink-0 flex-col justify-between gap-5 xl:flex-row xl:items-center px-4 sm:px-6 mt-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D6B53B]/30 bg-[#FDF5CC] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
            <span className={`h-2 w-2 animate-pulse rounded-full ${activeTab === 'email' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
            {badgeLabel}
          </div>
          <h1 className="font-sahitya text-3xl font-bold uppercase tracking-[0.08em] text-[#1a1f18] dark:text-[#F4F4F0]">
            System Logs
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
            {pageSubtitle}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white px-4 py-2 text-xs font-semibold text-gray-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]">
            {badgeIcon}
            {activeLastUpdated ? `Updated ${activeLastUpdated.toLocaleTimeString()}` : 'Syncing...'}
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6B53B]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#8E7722] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FDF5CC] dark:border-[#D6B53B]/20 dark:bg-white/5 dark:text-[#D6B53B]"
          >
            <RefreshCw className={`h-4 w-4 ${activeIsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <AuditLogExport onExport={handleExport} />
        </div>
      </div>

      <section className="flex flex-col border-t border-[#D6B53B]/20 bg-[#FDF5CC]/70 shadow-[0_18px_60px_rgba(142,119,34,0.08)] backdrop-blur dark:border-white/10 dark:bg-[#141A13] px-4 py-4 sm:px-6 mt-6">
        <SystemLogsTabs activeTab={activeTab} onChange={setActiveTab} />

        <div className={activeTab === 'audit' ? 'mt-4' : 'hidden'}>
          <AuditLogFilters
            actionOptions={actionOptions}
            activeFilterCount={activeFilterCount}
            filters={filters}
            isSuperAdmin={isSuperAdmin}
            moduleOptions={moduleOptions}
            onChange={handleFilterChange}
            onClear={clearFilters}
            roleOptions={roleOptions}
            statusOptions={statusOptions}
            userOptions={userOptions}
          />

          {error && (
            <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="mt-5 flex flex-col rounded-2xl border border-white/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#1C1D21]">
            <AuditLogTable
              isLoading={isLoading}
              logs={logs}
              isSuperAdmin={isSuperAdmin}
              onSelectLog={handleSelectLog}
              onSort={handleSort}
              sort={sort}
            />
            <AuditLogPagination
              pagination={pagination}
              recordCountLabel={recordCountLabel}
              onPageChange={(page) => setPagination((current) => ({ ...current, page }))}
              onPageSizeChange={(limit) => setPagination((current) => ({ ...current, page: 1, limit }))}
            />
          </div>
        </div>

        <div className={activeTab === 'email' ? 'mt-4' : 'hidden'}>
          <EmailLogsClient
            ref={emailLogsRef}
            currentUserRole={currentUserRole}
            emailTypeOptions={emailTypeOptions}
            initialSearch={initialEmailSearch}
            onLoadingChange={setIsEmailLoading}
            onUpdated={setEmailLastUpdated}
            relatedModuleOptions={relatedModuleOptions}
            statusOptions={emailStatusOptions}
            triggerSourceOptions={triggerSourceOptions}
            workflowOptions={workflowOptions}
          />
        </div>
      </section>

      <AuditLogDetail
        isLoading={isDetailLoading}
        isOpen={isDetailOpen}
        isSuperAdmin={isSuperAdmin}
        log={selectedLog}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
