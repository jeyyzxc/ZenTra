'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import AuditLogPagination from './AuditLogPagination';
import EmailLogDetail from './EmailLogDetail';
import EmailLogFiltersComponent from './EmailLogFilters';
import EmailLogTable from './EmailLogTable';
import type {
  AuditPagination,
  EmailLogFilters,
  EmailLogListItem,
  EmailLogListResponse,
  EmailLogSort,
} from '../types';

const EMPTY_FILTERS: EmailLogFilters = {
  search: '',
  startDate: '',
  endDate: '',
  emailType: '',
  status: '',
  triggerSource: '',
  workflowName: '',
  relatedModule: '',
};

const DEFAULT_PAGINATION: AuditPagination = {
  page: 1,
  limit: 10,
  totalRecords: 0,
  totalPages: 1,
};

type ToastState = {
  tone: 'success' | 'error';
  message: string;
} | null;

export type EmailLogsClientHandle = {
  exportLogs: (format: 'csv' | 'excel' | 'pdf') => void;
  refresh: () => void;
};

function dateInputToIso(value: string, boundary: 'start' | 'end') {
  if (!value) {
    return '';
  }

  const suffix = boundary === 'start' ? 'T00:00:00.000' : 'T23:59:59.999';
  return new Date(`${value}${suffix}`).toISOString();
}

const EmailLogsClient = forwardRef<EmailLogsClientHandle, {
  currentUserRole: 'SUPERADMIN' | 'ADMIN';
  emailTypeOptions: string[];
  initialSearch?: string;
  onLoadingChange?: (isLoading: boolean) => void;
  onUpdated?: (date: Date) => void;
  relatedModuleOptions: string[];
  statusOptions: string[];
  triggerSourceOptions: string[];
  workflowOptions: string[];
}>(function EmailLogsClient({
  currentUserRole,
  emailTypeOptions,
  initialSearch,
  onLoadingChange,
  onUpdated,
  relatedModuleOptions,
  statusOptions,
  triggerSourceOptions,
  workflowOptions,
}, ref) {
  const isSuperAdmin = currentUserRole === 'SUPERADMIN';
  const [filters, setFilters] = useState<EmailLogFilters>({
    ...EMPTY_FILTERS,
    search: initialSearch ?? '',
  });
  const [sort, setSort] = useState<EmailLogSort>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState<AuditPagination>(DEFAULT_PAGINATION);
  const [logs, setLogs] = useState<EmailLogListItem[]>([]);
  const [selectedLog, setSelectedLog] = useState<EmailLogListItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<ToastState>(null);

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

    if (filters.emailType) {
      params.set('emailType', filters.emailType);
    }

    if (filters.status) {
      params.set('status', filters.status);
    }

    if (filters.triggerSource) {
      params.set('triggerSource', filters.triggerSource);
    }

    if (filters.workflowName) {
      params.set('workflowName', filters.workflowName);
    }

    if (filters.relatedModule) {
      params.set('relatedModule', filters.relatedModule);
    }

    return params;
  }, [filters, pagination.limit, pagination.page, sort.sortBy, sort.sortOrder]);

  const loadLogs = useCallback(async (quiet = false) => {
    if (!quiet) {
      setIsLoading(true);
      onLoadingChange?.(true);
    }

    setError('');

    try {
      const response = await fetch(`/api/email-logs?${buildQuery().toString()}`, {
        cache: 'no-store',
      });
      const payload = await response.json() as EmailLogListResponse | { error?: string };

      if (!response.ok || !('logs' in payload)) {
        throw new Error('error' in payload && payload.error ? payload.error : 'Unable to load email logs.');
      }

      setLogs(payload.logs);
      setPagination(payload.pagination);
      onUpdated?.(new Date());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load email logs.');
    } finally {
      if (!quiet) {
        setIsLoading(false);
        onLoadingChange?.(false);
      }
    }
  }, [buildQuery, onLoadingChange, onUpdated]);

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

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const exportLogs = useCallback((format: 'csv' | 'excel' | 'pdf') => {
    const params = buildQuery(false);
    params.set('format', format);
    params.set('timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);
    window.location.href = `/api/email-logs/export?${params.toString()}`;
  }, [buildQuery]);

  useImperativeHandle(ref, () => ({
    exportLogs,
    refresh: () => {
      void loadLogs();
    },
  }), [exportLogs, loadLogs]);

  const activeFilterCount = useMemo(() => (
    Object.values(filters).filter(Boolean).length
  ), [filters]);

  const handleFilterChange = (key: keyof EmailLogFilters, value: string) => {
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

  const handleSelectLog = async (log: EmailLogListItem) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/email-logs/${log.id}`, {
        cache: 'no-store',
      });
      const payload = await response.json() as { log?: EmailLogListItem; error?: string };

      if (!response.ok || !payload.log) {
        throw new Error(payload.error || 'Unable to load this email log.');
      }

      setSelectedLog(payload.log);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load this email log.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleResend = async (log: EmailLogListItem) => {
    setIsResending(true);
    setError('');

    try {
      const response = await fetch(`/api/email-logs/${log.id}/resend`, {
        method: 'POST',
      });
      const payload = await response.json() as { success?: boolean; log?: EmailLogListItem; error?: string };

      if (!response.ok || !payload.success || !payload.log) {
        throw new Error(payload.error || 'Failed to resend email. Please try again.');
      }

      setSelectedLog(payload.log);
      setLogs((current) => current.map((item) => (item.id === payload.log?.id ? payload.log : item)));
      setToast({ tone: 'success', message: 'Email resend initiated successfully' });
      void loadLogs(true);
    } catch (caughtError) {
      setToast({
        tone: 'error',
        message: caughtError instanceof Error ? caughtError.message : 'Failed to resend email. Please try again.',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col">
      <EmailLogFiltersComponent
        activeFilterCount={activeFilterCount}
        emailTypeOptions={emailTypeOptions}
        filters={filters}
        onChange={handleFilterChange}
        onClear={clearFilters}
        relatedModuleOptions={relatedModuleOptions}
        statusOptions={statusOptions}
        triggerSourceOptions={triggerSourceOptions}
        workflowOptions={workflowOptions}
      />

      {error && (
        <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-col rounded-2xl border border-white/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#1C1D21]">
        <EmailLogTable
          isLoading={isLoading}
          logs={logs}
          onSelectLog={handleSelectLog}
          onSort={handleSort}
          sort={sort}
        />
        <AuditLogPagination
          pagination={pagination}
          recordCountLabel="Email Records"
          onPageChange={(page) => setPagination((current) => ({ ...current, page }))}
          onPageSizeChange={(limit) => setPagination((current) => ({ ...current, page: 1, limit }))}
        />
      </div>

      <EmailLogDetail
        isLoading={isDetailLoading}
        isOpen={isDetailOpen}
        isResending={isResending}
        isSuperAdmin={isSuperAdmin}
        log={selectedLog}
        onClose={() => setIsDetailOpen(false)}
        onResend={handleResend}
      />

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[90] rounded-2xl border px-4 py-3 text-sm font-bold shadow-xl ${
            toast.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
});

export default EmailLogsClient;
