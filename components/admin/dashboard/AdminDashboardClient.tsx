'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, X } from 'lucide-react';
import { AdminActionCenter, type TaskFilter } from '@/components/admin/dashboard/AdminActionCenter';
import { BookingActivityChart } from '@/components/admin/dashboard/BookingActivityChart';
import { DashboardEmptyState } from '@/components/admin/dashboard/DashboardEmptyState';
import { DashboardErrorState } from '@/components/admin/dashboard/DashboardErrorState';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { MetricsGrid } from '@/components/admin/dashboard/MetricsGrid';
import { NotificationsPanel } from '@/components/admin/dashboard/NotificationsPanel';
import { PaymentSummaryCard } from '@/components/admin/dashboard/PaymentSummaryCard';
import { QuickActionsPanel } from '@/components/admin/dashboard/QuickActionsPanel';
import { UpcomingEventsPanel } from '@/components/admin/dashboard/UpcomingEventsPanel';
import { WorkflowHealthPanel } from '@/components/admin/dashboard/WorkflowHealthPanel';
import { Button, buttonStyles } from '@/components/ui/Button';
import { cn } from '@/lib/class-names';
import type {
  AdminDashboardData,
  AdminTaskItem,
  NotificationItem,
  UpcomingEvent,
} from '@/types/admin-dashboard';

type ApiWrapper = {
  success?: boolean;
  data?: AdminDashboardData;
  error?: string;
  details?: string;
};

type DetailItem = {
  title: string;
  subtitle: string;
  href?: string;
  rows: Array<{ label: string; value: string }>;
};

type ToastState = {
  type: 'success' | 'error';
  message: string;
} | null;

async function readDashboardResponse(response: Response) {
  const payload = await response.json() as AdminDashboardData | ApiWrapper;

  if (!response.ok) {
    const message = 'error' in payload && payload.error
      ? payload.error
      : 'Unable to load dashboard data.';
    throw new Error(message);
  }

  if ('metrics' in payload) {
    return payload;
  }

  if (payload.success && payload.data) {
    return payload.data;
  }

  throw new Error('Unable to load dashboard data.');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function taskMatchesFilter(task: AdminTaskItem, filter: TaskFilter) {
  const taskText = [
    task.title,
    task.relatedLabel,
    task.category ?? '',
    task.href,
  ].join(' ').toLowerCase();

  if (filter === 'all') return true;
  if (filter === 'overdue') return task.status === 'overdue';
  if (filter === 'today') {
    return new Date(task.dueDate).toDateString() === new Date().toDateString();
  }
  if (filter === 'payments') return taskText.includes('payment');
  if (filter === 'contracts') return taskText.includes('contract');
  return true;
}

function eventDetail(event: UpcomingEvent): DetailItem {
  return {
    title: event.title,
    subtitle: `${event.clientName} - ${event.eventType}`,
    href: event.href,
    rows: [
      { label: 'Date', value: formatDate(event.date) },
      { label: 'Time', value: event.time ?? 'No time recorded' },
      { label: 'Venue', value: event.venue },
      { label: 'Status', value: event.status },
    ],
  };
}

function taskDetail(task: AdminTaskItem): DetailItem {
  return {
    title: task.title,
    subtitle: task.relatedLabel,
    href: task.href,
    rows: [
      { label: 'Due date', value: formatDate(task.dueDate) },
      { label: 'Due time', value: task.dueTime ?? 'No time recorded' },
      { label: 'Priority', value: task.priority },
      { label: 'Status', value: task.status },
      { label: 'Category', value: task.category ?? 'General' },
    ],
  };
}

function notificationDetail(notification: NotificationItem): DetailItem {
  return {
    title: notification.title,
    subtitle: `${notification.type} - ${notification.priority}`,
    href: notification.href,
    rows: [
      { label: 'Message', value: notification.message },
      { label: 'Created', value: formatDateTime(notification.createdAt) },
      { label: 'State', value: notification.isRead ? 'Read' : 'Unread' },
      { label: 'Priority', value: notification.priority },
    ],
  };
}

function isDashboardEmpty(data: AdminDashboardData) {
  return (
    data.metrics.totalBookings === 0 &&
    data.metrics.upcomingEvents === 0 &&
    data.metrics.pendingPayments === 0 &&
    data.metrics.openTasks === 0 &&
    data.upcomingEvents.length === 0 &&
    data.taskSummary.length === 0 &&
    data.recentNotifications.length === 0 &&
    data.paymentSummary.totalCollected === 0 &&
    data.paymentSummary.recentActivity.length === 0 &&
    data.workflowHealth.recentIssues.length === 0
  );
}

function DetailDrawer({
  detail,
  onClose,
}: {
  detail: DetailItem | null;
  onClose: () => void;
}) {
  if (!detail) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={detail.title}>
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label="Close details"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[#E5E7EB] bg-[#FAFAF8] p-5 shadow-xl dark:border-white/10 dark:bg-[#141A13]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8E7722] dark:text-[#D4AF37]">
              Details
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#111827] dark:text-[#F4F4F0]">
              {detail.title}
            </h2>
            <p className="mt-1 text-sm text-[#667085] dark:text-[#A3B19B]">
              {detail.subtitle}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close details">
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        <dl className="mt-6 divide-y divide-[#EAECF0] dark:divide-white/10">
          {detail.rows.map((row) => (
            <div key={row.label} className="py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#667085] dark:text-[#A3B19B]">
                {row.label}
              </dt>
              <dd className="mt-1 break-words text-sm font-semibold text-[#1F2933] dark:text-[#F4F4F0]">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {detail.href ? (
          <Link href={detail.href} className={buttonStyles({ variant: 'primary', className: 'mt-6 w-full' })}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Open Record
          </Link>
        ) : null}
      </aside>
    </div>
  );
}

export function AdminDashboardClient({
  initialData,
}: {
  initialData: AdminDashboardData;
}) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<ToastState>(null);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailItem | null>(null);

  const refreshDashboard = useCallback(async (message?: string) => {
    setIsRefreshing(true);
    setError('');

    try {
      const response = await fetch('/api/admin/dashboard/summary', {
        cache: 'no-store',
      });
      const nextData = await readDashboardResponse(response);
      setData(nextData);

      if (message) {
        setToast({ type: 'success', message });
      }
    } catch (caughtError) {
      const messageText = caughtError instanceof Error
        ? caughtError.message
        : 'Unable to load dashboard data.';
      setError(messageText);
      setToast({ type: 'error', message: messageText });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 4200);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filteredTasks = useMemo(() => {
    return data.taskSummary.filter((task) => taskMatchesFilter(task, taskFilter));
  }, [data.taskSummary, taskFilter]);

  const completeTask = async (task: AdminTaskItem) => {
    setPendingTaskId(task.id);
    setError('');

    try {
      const response = await fetch(`/api/dashboard/agenda/${encodeURIComponent(task.id)}/complete`, {
        method: 'PATCH',
      });
      const payload = await response.json() as { success?: boolean; error?: string; message?: string };

      if (!response.ok || payload.success === false) {
        throw new Error(payload.error || 'Unable to complete task.');
      }

      await refreshDashboard(payload.message || 'Task completed.');
    } catch (caughtError) {
      const messageText = caughtError instanceof Error
        ? caughtError.message
        : 'Unable to complete task.';
      setError(messageText);
      setToast({ type: 'error', message: messageText });
    } finally {
      setPendingTaskId(null);
    }
  };

  return (
    <div className="min-w-0 space-y-6 text-[#1F2933] dark:text-[#F4F4F0]">
      <DashboardHeader
        summary={data.operationsSummary}
        generatedAt={data.generatedAt}
        isRefreshing={isRefreshing}
        onRefresh={() => void refreshDashboard('Dashboard refreshed.')}
      />

      {error ? (
        <DashboardErrorState
          detail={error}
          onRetry={() => void refreshDashboard('Dashboard refreshed.')}
        />
      ) : null}

      {isDashboardEmpty(data) ? <DashboardEmptyState /> : null}

      <MetricsGrid metrics={data.metrics} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <BookingActivityChart points={data.bookingActivity} />
        <UpcomingEventsPanel
          events={data.upcomingEvents}
          onSelect={(event) => setDetail(eventDetail(event))}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <AdminActionCenter
          tasks={filteredTasks}
          activeFilter={taskFilter}
          onFilterChange={setTaskFilter}
          onSelect={(task) => setDetail(taskDetail(task))}
          onComplete={(task) => void completeTask(task)}
          pendingTaskId={pendingTaskId}
        />
        <NotificationsPanel
          notifications={data.recentNotifications}
          onSelect={(notification) => setDetail(notificationDetail(notification))}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <PaymentSummaryCard summary={data.paymentSummary} />
        <WorkflowHealthPanel health={data.workflowHealth} />
        <QuickActionsPanel />
      </div>

      {toast ? (
        <div
          className={cn(
            'fixed bottom-5 right-5 z-[90] flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm font-semibold shadow-lg',
            toast.type === 'success'
              ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#2F855A] dark:border-[#2F855A]/30 dark:bg-[#2F855A]/15 dark:text-[#86EFAC]'
              : 'border-[#FED7AA] bg-[#FFF7ED] text-[#C2410C] dark:border-[#C2410C]/30 dark:bg-[#C2410C]/15 dark:text-[#FDBA74]',
          )}
          role="status"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{toast.message}</span>
        </div>
      ) : null}

      <DetailDrawer detail={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
