'use client';

import Link from 'next/link';
import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  FileText,
  Inbox,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  TrendingUp,
  Workflow,
  X,
} from 'lucide-react';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type DashboardOverview = {
  generated_at: string;
  snapshot: {
    total_bookings: number;
    confirmed_events: number;
    pending_bookings: number;
    revenue_this_month: number;
    pending_payments: number;
    contracts_pending: number;
    unanswered_inquiries: number;
    needs_action: number;
  };
  assistant_summary: {
    greeting: string;
    summary: Array<{ type: string; message: string }>;
    priority_action: string;
    generated_at: string;
  };
  trends: {
    range: string;
    labels: string[];
    revenue: number[];
    confirmed_bookings: number[];
    pending_bookings: number[];
  };
  needs_action: Array<{
    id: string;
    type: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    related_module: string;
    related_record_id: string | null;
    primary_action: string;
    secondary_action: string | null;
    href: string;
    created_at: string;
  }>;
  calendar: {
    month: string;
    items: Array<{
      id: string;
      date: string;
      type: string;
      title: string;
      time: string | null;
      related_module: string;
      related_record_id: string | null;
      status: string | null;
      priority?: string | null;
    }>;
  };
  agenda: Array<{
    id: string;
    title: string;
    description: string | null;
    date: string;
    time: string | null;
    related_module: string | null;
    related_record_id: string | null;
    priority: string;
    status: string;
    assigned_admin: string | null;
    created_source: string;
    can_complete: boolean;
  }>;
  upcoming_events: Array<{
    id: string;
    title: string;
    event_date: string;
    event_time: string | null;
    event_type: string;
    client_name: string;
    status: string;
    assigned_coordinator: string | null;
    payment_status: string;
    href: string;
  }>;
  recent_activity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
    href: string;
  }>;
  workflow_health: {
    successful_workflows_today: number;
    failed_workflows_today: number;
    failed_emails_today: number;
    pending_retries: number;
    last_workflow_run_at: string | null;
  };
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    priority: string;
    is_read: boolean;
    related_module: string | null;
    related_record_id: string | null;
    created_at: string;
    href: string;
  }>;
};

type AgendaFormState = {
  title: string;
  description: string;
  date: string;
  time: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedTo: string;
  relatedModule: string;
  relatedRecordId: string;
  reminderOption: string;
};

const EMPTY_AGENDA_FORM: AgendaFormState = {
  title: '',
  description: '',
  date: '',
  time: '',
  priority: 'MEDIUM',
  assignedTo: '',
  relatedModule: '',
  relatedRecordId: '',
  reminderOption: '',
};

const TREND_RANGES = [
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'last_6_months', label: 'Last 6 months' },
  { value: 'this_year', label: 'This year' },
];

function monthKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
  ].join('-');
}

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return 'No recorded run';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function normalizeLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function priorityClasses(priority: string) {
  switch (priority) {
    case 'critical':
      return 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300';
    case 'high':
      return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300';
    case 'medium':
      return 'border-[#D6B53B]/30 bg-[#FDF5CC] text-[#8E7722] dark:border-[#D6B53B]/30 dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]';
  }
}

function markerClass(type: string) {
  if (type.includes('payment')) return 'bg-orange-500';
  if (type.includes('task')) return 'bg-blue-500';
  if (type.includes('event')) return 'bg-emerald-500';
  if (type.includes('ocular')) return 'bg-[#D6B53B]';
  return 'bg-gray-400';
}

function SectionShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#141A13]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-sans text-[15px] font-bold text-gray-900 dark:text-[#F4F4F0]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex min-h-[130px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/70 px-4 py-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-3 text-gray-300 dark:text-white/20">{icon}</div>
      <p className="font-sans text-sm font-bold text-gray-700 dark:text-[#F4F4F0]">{title}</p>
      <p className="mt-1 max-w-[260px] font-sans text-xs leading-5 text-gray-500 dark:text-[#A3B19B]">
        {detail}
      </p>
    </div>
  );
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-100 dark:bg-white/10 ${className}`} />
  );
}

export default function AdminDashboard() {
  const [today] = useState(() => new Date());
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trendRange, setTrendRange] = useState('this_year');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(() => dateKey(new Date()));
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [agendaForm, setAgendaForm] = useState<AgendaFormState>(() => ({
    ...EMPTY_AGENDA_FORM,
    date: dateKey(new Date()),
  }));
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const loadDashboard = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    setIsRefreshing(quiet);
    setError('');

    try {
      const params = new URLSearchParams({
        range: trendRange,
        month: monthKey(calendarDate),
      });
      const response = await fetch(`/api/dashboard/overview?${params.toString()}`, {
        cache: 'no-store',
      });
      const payload = await response.json() as ApiResponse<DashboardOverview>;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || 'Unable to load dashboard data.');
      }

      setOverview(payload.data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load dashboard data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [calendarDate, trendRange]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadDashboard]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadDashboard(true);
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [loadDashboard]);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(today).toUpperCase();
  }, [today]);

  const calendarItemsByDate = useMemo(() => {
    const map = new Map<string, DashboardOverview['calendar']['items']>();

    overview?.calendar.items.forEach((item) => {
      const items = map.get(item.date) ?? [];
      items.push(item);
      map.set(item.date, items);
    });

    return map;
  }, [overview?.calendar.items]);

  const selectedCalendarItems = calendarItemsByDate.get(selectedDay) ?? [];

  const chartHasData = Boolean(overview?.trends.revenue.some((value) => value > 0) ||
    overview?.trends.confirmed_bookings.some((value) => value > 0) ||
    overview?.trends.pending_bookings.some((value) => value > 0));

  const submitAgenda = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPendingActionId('create-agenda');
    setActionError('');
    setActionMessage('');

    try {
      const response = await fetch('/api/dashboard/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agendaForm),
      });
      const payload = await response.json() as ApiResponse<{ id: string }>;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to create agenda task.');
      }

      setActionMessage('Agenda task added.');
      setIsAgendaModalOpen(false);
      setAgendaForm({
        ...EMPTY_AGENDA_FORM,
        date: selectedDay,
      });
      await loadDashboard(true);
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : 'Unable to create agenda task.');
    } finally {
      setPendingActionId(null);
    }
  };

  const completeAgenda = async (id: string) => {
    if (id.startsWith('calendar-task:')) return;
    setPendingActionId(id);
    setActionError('');
    setActionMessage('');

    try {
      const response = await fetch(`/api/dashboard/agenda/${encodeURIComponent(id)}/complete`, {
        method: 'PATCH',
      });
      const payload = await response.json() as ApiResponse<{ id: string }>;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to complete agenda task.');
      }

      setActionMessage('Agenda task completed.');
      await loadDashboard(true);
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : 'Unable to complete agenda task.');
    } finally {
      setPendingActionId(null);
    }
  };

  const runNeedAction = async (
    item: DashboardOverview['needs_action'][number],
    action: string,
  ) => {
    setPendingActionId(`${item.id}:${action}`);
    setActionError('');
    setActionMessage('');

    try {
      let response: Response | null = null;

      if (action === 'Acknowledge') {
        response = await fetch(`/api/dashboard/alerts/${encodeURIComponent(item.id)}/acknowledge`, {
          method: 'PATCH',
        });
      } else if (action === 'Send Reminder') {
        response = await fetch('/api/dashboard/actions/send-payment-reminder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentRecordId: item.related_record_id }),
        });
      } else if (action === 'Resolve Fallback' && item.related_module === 'email_logs') {
        response = await fetch('/api/dashboard/actions/retry-failed-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailLogId: item.related_record_id }),
        });
      }

      if (!response) return;

      const payload = await response.json() as ApiResponse<unknown>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Dashboard action failed.');
      }

      setActionMessage(payload.message || 'Dashboard action completed.');
      await loadDashboard(true);
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : 'Dashboard action failed.');
    } finally {
      setPendingActionId(null);
    }
  };

  const moveMonth = (amount: number) => {
    setCalendarDate((current) => {
      const next = new Date(current);
      next.setMonth(next.getMonth() + amount);
      const key = dateKey(new Date(next.getFullYear(), next.getMonth(), 1));
      setSelectedDay(key);
      return next;
    });
  };

  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
  const selectedDate = new Date(`${selectedDay}T00:00:00`);

  const snapshotCards = overview
    ? [
        {
          label: 'Total Bookings',
          value: overview.snapshot.total_bookings.toLocaleString(),
          detail: 'Created this month',
          href: '/admin/bookings',
          icon: CalendarDays,
        },
        {
          label: 'Confirmed Events',
          value: overview.snapshot.confirmed_events.toLocaleString(),
          detail: 'Upcoming active bookings',
          href: '/admin/bookings?status=CONFIRMED',
          icon: CheckCircle2,
        },
        {
          label: 'Pending Bookings',
          value: overview.snapshot.pending_bookings.toLocaleString(),
          detail: 'Waiting for confirmation',
          href: '/admin/bookings?status=PENDING',
          icon: Clock3,
        },
        {
          label: 'Revenue This Month',
          value: formatMoney(overview.snapshot.revenue_this_month),
          detail: 'Verified payment records',
          href: '/admin/payments',
          icon: CircleDollarSign,
        },
        {
          label: 'Pending Payments',
          value: overview.snapshot.pending_payments.toLocaleString(),
          detail: 'Unpaid or partial balances',
          href: '/admin/payments',
          icon: TrendingUp,
        },
        {
          label: 'Contracts Pending',
          value: overview.snapshot.contracts_pending.toLocaleString(),
          detail: 'Review, sending, or signing',
          href: '/admin/contracts',
          icon: FileText,
        },
        {
          label: 'Unanswered Inquiries',
          value: overview.snapshot.unanswered_inquiries.toLocaleString(),
          detail: 'Awaiting admin reply',
          href: '/admin/support',
          icon: MessageCircle,
        },
        {
          label: 'Needs Action',
          value: overview.snapshot.needs_action.toLocaleString(),
          detail: 'Urgent dashboard alerts',
          href: '#needs-action',
          icon: AlertTriangle,
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6 font-sans text-[#1a1f18] dark:text-[#F4F4F0]">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.22em] text-[#D6B53B]">
            {formattedDate}
          </p>
          <h1 className="font-sahitya text-3xl font-bold uppercase tracking-[0.08em]">
            Dashboard
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
            Track event progress, business activity, bookings, payments, and upcoming schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-white/80 bg-white px-3 py-2 text-xs font-semibold text-gray-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]">
            {overview ? `Last updated ${formatDateTime(overview.generated_at)}` : 'Loading latest data'}
          </div>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="inline-flex items-center gap-2 rounded-lg border border-[#D6B53B]/30 bg-white px-4 py-2 text-sm font-bold text-[#8E7722] transition hover:bg-[#FDF5CC] dark:bg-white/5 dark:text-[#D6B53B]"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {(actionMessage || actionError) && (
        <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
          actionError
            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
        }`}>
          {actionError || actionMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading && !overview
          ? Array.from({ length: 8 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-28" />
            ))
          : snapshotCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.label}
                  href={card.href}
                  className="group rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D6B53B]/40 hover:shadow-md dark:border-white/5 dark:bg-[#141A13]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-[#A3B19B]">
                        {card.label}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">
                        {card.value}
                      </p>
                      <p className="mt-1 text-xs font-medium text-gray-500 dark:text-[#A3B19B]">
                        {card.detail}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#FDF5CC] p-2 text-[#8E7722] transition group-hover:bg-[#D6B53B] group-hover:text-white dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="flex min-w-0 flex-col gap-6">
          <SectionShell title="Zeni, Your Smart Assistant">
            {isLoading && !overview ? (
              <div className="space-y-3">
                <SkeletonBlock className="h-5 w-44" />
                <SkeletonBlock className="h-24" />
              </div>
            ) : overview ? (
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#D6B53B]/30 bg-[#FDF5CC] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {overview.assistant_summary.greeting}
                  </p>
                  <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-[#1A2218]">
                    <ul className="space-y-2">
                      {overview.assistant_summary.summary.map((item, index) => (
                        <li key={`${item.type}-${index}`} className="flex gap-2 text-sm leading-6 text-gray-600 dark:text-[#A3B19B]">
                          <Check className="mt-1 h-4 w-4 shrink-0 text-[#D6B53B]" />
                          <span>{item.message}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 border-t border-gray-200 pt-3 text-sm font-bold text-[#8E7722] dark:border-white/10 dark:text-[#D6B53B]">
                      Recommended priority: {overview.assistant_summary.priority_action}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </SectionShell>

          <SectionShell
            title="Revenue & Booking Trends"
            action={
              <select
                value={trendRange}
                onChange={(event) => setTrendRange(event.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1A2218] dark:text-[#F4F4F0]"
              >
                {TREND_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            }
          >
            {isLoading && !overview ? (
              <SkeletonBlock className="h-[270px]" />
            ) : overview && chartHasData ? (
              <TrendChart trends={overview.trends} />
            ) : (
              <EmptyState
                icon={<TrendingUp className="h-8 w-8" />}
                title="No trend data yet."
                detail="Verified payments and active bookings will appear here once recorded."
              />
            )}
          </SectionShell>

          <SectionShell
            title="Needs Action"
            action={overview ? (
              <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-red-600 dark:bg-red-500/10 dark:text-red-300">
                {overview.needs_action.length} Pending
              </span>
            ) : null}
          >
            <div id="needs-action" className="space-y-3">
              {isLoading && !overview ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-28" />
                ))
              ) : overview && overview.needs_action.length > 0 ? (
                overview.needs_action.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-[#1A2218]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${priorityClasses(item.priority)}`}>
                            {item.priority}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-[#A3B19B]">
                            {normalizeLabel(item.type)}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-[#A3B19B]">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <NeedActionButton
                          action={item.primary_action}
                          href={item.href}
                          isPending={pendingActionId === `${item.id}:${item.primary_action}`}
                          onRun={() => void runNeedAction(item, item.primary_action)}
                        />
                        {item.secondary_action && (
                          <NeedActionButton
                            action={item.secondary_action}
                            href={item.href}
                            isPending={pendingActionId === `${item.id}:${item.secondary_action}`}
                            secondary
                            onRun={() => void runNeedAction(item, item.secondary_action as string)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={<CheckCircle2 className="h-8 w-8" />}
                  title="No urgent actions right now."
                  detail="Everything looks clear for today."
                />
              )}
            </div>
          </SectionShell>

          <SectionShell title="Recent Activity">
            {isLoading && !overview ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-16" />
                ))}
              </div>
            ) : overview && overview.recent_activity.length > 0 ? (
              <div className="space-y-3">
                {overview.recent_activity.map((activity) => (
                  <Link
                    key={activity.id}
                    href={activity.href}
                    className="flex gap-3 rounded-lg border border-gray-100 bg-gray-50/70 p-3 transition hover:border-[#D6B53B]/40 dark:border-white/5 dark:bg-[#1A2218]"
                  >
                    <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#D6B53B]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                          {activity.title}
                        </p>
                        <span className="shrink-0 text-[11px] font-semibold text-gray-400 dark:text-[#A3B19B]">
                          {formatDateTime(activity.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-[#A3B19B]">
                        {activity.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Bell className="h-8 w-8" />}
                title="No recent activity yet."
                detail="Audit, email, and workflow events will appear here once recorded."
              />
            )}
          </SectionShell>
        </main>

        <aside className="flex min-w-0 flex-col gap-6">
          <SectionShell
            title="Schedule"
            action={
              <button
                type="button"
                onClick={() => {
                  setAgendaForm((current) => ({ ...current, date: selectedDay }));
                  setIsAgendaModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#D6B53B]/30 bg-[#FDF5CC] px-3 py-1.5 text-xs font-bold text-[#8E7722] hover:bg-[#D6B53B] hover:text-white dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            }
          >
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-white/5 dark:bg-[#1A2218]">
              <div className="mb-4 flex items-center justify-between rounded-lg bg-white p-1 dark:bg-[#141A13]">
                <button
                  type="button"
                  onClick={() => moveMonth(-1)}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-50 hover:text-[#D6B53B] dark:text-[#A3B19B] dark:hover:bg-white/5"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-800 dark:text-white">
                  {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarDate)}
                </p>
                <button
                  type="button"
                  onClick={() => moveMonth(1)}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-50 hover:text-[#D6B53B] dark:text-[#A3B19B] dark:hover:bg-white/5"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-[#A3B19B]">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <span key={day} className="py-1">{day}</span>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                  <div key={`empty-${index}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const key = dateKey(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day));
                  const items = calendarItemsByDate.get(key) ?? [];
                  const isSelected = key === selectedDay;
                  const isToday = key === dateKey(today);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDay(key)}
                      className={`relative flex h-9 items-center justify-center rounded-lg text-sm font-semibold transition ${
                        isSelected
                          ? 'bg-[#D6B53B] text-white shadow-sm'
                          : isToday
                            ? 'bg-[#FDF5CC] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]'
                            : 'text-gray-600 hover:bg-white hover:text-[#D6B53B] dark:text-[#A3B19B] dark:hover:bg-white/5'
                      }`}
                    >
                      {day}
                      {items.length > 0 && (
                        <span className="absolute bottom-1 flex gap-0.5">
                          {items.slice(0, 3).map((item) => (
                            <span key={item.id} className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : markerClass(item.type)}`} />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-[#A3B19B]">
                {Number.isNaN(selectedDate.getTime()) ? 'Selected date' : formatDate(selectedDay)}
              </p>
              {selectedCalendarItems.length > 0 ? (
                <div className="space-y-2">
                  {selectedCalendarItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.related_module === 'bookings' ? `/admin/bookings?selected=${item.related_record_id ?? ''}` : item.related_module === 'payments' ? '/admin/payments' : '/admin/calendar'}
                      className="block rounded-lg border border-gray-100 bg-gray-50/70 p-3 text-sm hover:border-[#D6B53B]/40 dark:border-white/5 dark:bg-[#1A2218]"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${markerClass(item.type)}`} />
                        <span className="font-bold text-gray-900 dark:text-white">{item.title}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-[#A3B19B]">
                        {item.time || 'All day'} {item.status ? `- ${normalizeLabel(item.status)}` : ''}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<CalendarDays className="h-7 w-7" />}
                  title="No items on this date."
                  detail="Booked events, tasks, and deadlines will appear here."
                />
              )}
            </div>
          </SectionShell>

          <SectionShell
            title="Today's Agenda"
            action={
              <button
                type="button"
                onClick={() => {
                  setAgendaForm((current) => ({
                    ...current,
                    date: dateKey(today),
                  }));
                  setIsAgendaModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:border-[#D6B53B]/40 hover:text-[#8E7722] dark:border-white/10 dark:text-[#A3B19B] dark:hover:text-[#D6B53B]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            }
          >
            {isLoading && !overview ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-16" />
                ))}
              </div>
            ) : overview && overview.agenda.length > 0 ? (
              <div className="space-y-3">
                {overview.agenda.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!item.can_complete || item.status === 'completed' || pendingActionId === item.id}
                    onClick={() => void completeAgenda(item.id)}
                    className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                      item.status === 'completed'
                        ? 'border-transparent bg-gray-50/70 opacity-70 dark:bg-white/[0.03]'
                        : 'border-gray-100 bg-white hover:border-[#D6B53B]/50 dark:border-white/5 dark:bg-[#1A2218]'
                    }`}
                  >
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      item.status === 'completed'
                        ? 'border-[#D6B53B] bg-[#D6B53B] text-white'
                        : 'border-gray-300 text-transparent dark:border-white/20'
                    }`}>
                      {pendingActionId === item.id ? <Loader2 className="h-3 w-3 animate-spin text-[#D6B53B]" /> : <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-bold ${item.status === 'completed' ? 'text-gray-400 line-through dark:text-[#A3B19B]' : 'text-gray-900 dark:text-white'}`}>
                        {item.title}
                      </span>
                      <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-[#A3B19B]">
                        {item.time || 'No time'} - {normalizeLabel(item.priority)} - {normalizeLabel(item.created_source)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Inbox className="h-8 w-8" />}
                title="No agenda for today."
                detail="Add a task or wait for system-generated reminders."
              />
            )}
          </SectionShell>

          <SectionShell
            title="Upcoming Events"
            action={
              <Link href="/admin/bookings" className="text-xs font-bold uppercase tracking-[0.14em] text-[#8E7722] hover:text-[#D6B53B] dark:text-[#D6B53B]">
                View All
              </Link>
            }
          >
            {isLoading && !overview ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-16" />
                ))}
              </div>
            ) : overview && overview.upcoming_events.length > 0 ? (
              <div className="space-y-3">
                {overview.upcoming_events.map((event) => (
                  <Link
                    key={event.id}
                    href={event.href}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/70 p-3 transition hover:border-[#D6B53B]/40 dark:border-white/5 dark:bg-[#1A2218]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                        {event.title}
                      </p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-[#A3B19B]">
                        {formatDate(event.event_date)} - {event.event_type}
                      </p>
                      <p className="mt-1 truncate text-xs text-gray-500 dark:text-[#A3B19B]">
                        {event.client_name} {event.assigned_coordinator ? `- ${event.assigned_coordinator}` : ''}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${priorityClasses(event.status === 'confirmed' ? 'low' : 'medium')}`}>
                      {normalizeLabel(event.status)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CalendarDays className="h-8 w-8" />}
                title="No upcoming events found."
                detail="Confirmed bookings will appear here once scheduled."
              />
            )}
          </SectionShell>

          <SectionShell title="Workflow & Email Health">
            {isLoading && !overview ? (
              <SkeletonBlock className="h-32" />
            ) : overview ? (
              <div className="grid grid-cols-2 gap-3">
                <HealthMetric label="Successful workflows" value={overview.workflow_health.successful_workflows_today} />
                <HealthMetric label="Failed workflows" value={overview.workflow_health.failed_workflows_today} danger={overview.workflow_health.failed_workflows_today > 0} />
                <HealthMetric label="Failed emails" value={overview.workflow_health.failed_emails_today} danger={overview.workflow_health.failed_emails_today > 0} />
                <HealthMetric label="Pending retries" value={overview.workflow_health.pending_retries} />
                <div className="col-span-2 rounded-lg border border-gray-100 bg-gray-50/70 p-3 dark:border-white/5 dark:bg-[#1A2218]">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-[#A3B19B]">
                    <Workflow className="h-4 w-4 text-[#D6B53B]" />
                    Last workflow run
                  </div>
                  <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
                    {formatDateTime(overview.workflow_health.last_workflow_run_at)}
                  </p>
                </div>
              </div>
            ) : null}
          </SectionShell>
        </aside>
      </div>

      {isAgendaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={submitAgenda}
            className="w-full max-w-xl rounded-lg border border-gray-100 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-[#141A13]"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Agenda</h2>
              <button
                type="button"
                onClick={() => setIsAgendaModalOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white"
                aria-label="Close agenda form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">Task title</span>
                <input
                  required
                  value={agendaForm.title}
                  onChange={(event) => setAgendaForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1A2218]"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">Description</span>
                <textarea
                  value={agendaForm.description}
                  onChange={(event) => setAgendaForm((current) => ({ ...current, description: event.target.value }))}
                  className="h-20 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1A2218]"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">Date</span>
                <input
                  required
                  type="date"
                  value={agendaForm.date}
                  onChange={(event) => setAgendaForm((current) => ({ ...current, date: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1A2218]"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">Time</span>
                <input
                  type="time"
                  value={agendaForm.time}
                  onChange={(event) => setAgendaForm((current) => ({ ...current, time: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1A2218]"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">Priority</span>
                <select
                  value={agendaForm.priority}
                  onChange={(event) => setAgendaForm((current) => ({ ...current, priority: event.target.value as AgendaFormState['priority'] }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1A2218]"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">Assigned admin</span>
                <input
                  value={agendaForm.assignedTo}
                  onChange={(event) => setAgendaForm((current) => ({ ...current, assignedTo: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1A2218]"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">Related module</span>
                <select
                  value={agendaForm.relatedModule}
                  onChange={(event) => setAgendaForm((current) => ({ ...current, relatedModule: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1A2218]"
                >
                  <option value="">None</option>
                  <option value="bookings">Bookings</option>
                  <option value="payments">Payments</option>
                  <option value="contracts">Contracts</option>
                  <option value="inquiries">Inquiries</option>
                  <option value="calendar">Calendar</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">Related record</span>
                <input
                  value={agendaForm.relatedRecordId}
                  onChange={(event) => setAgendaForm((current) => ({ ...current, relatedRecordId: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1A2218]"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">Reminder option</span>
                <select
                  value={agendaForm.reminderOption}
                  onChange={(event) => setAgendaForm((current) => ({ ...current, reminderOption: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-[#1A2218]"
                >
                  <option value="">No reminder</option>
                  <option value="same_day">Same day</option>
                  <option value="one_day_before">One day before</option>
                  <option value="three_days_before">Three days before</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAgendaModalOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-[#A3B19B] dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pendingActionId === 'create-agenda'}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1a1f18] px-4 py-2 text-sm font-bold text-white hover:bg-[#D6B53B] disabled:cursor-wait disabled:opacity-70 dark:bg-[#D6B53B] dark:text-[#141A13]"
              >
                {pendingActionId === 'create-agenda' && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function NeedActionButton({
  action,
  href,
  isPending,
  secondary = false,
  onRun,
}: {
  action: string;
  href: string;
  isPending: boolean;
  secondary?: boolean;
  onRun: () => void;
}) {
  const isLinkAction = /view|review|reply|open/i.test(action);
  const Icon = action.includes('Reminder')
    ? Send
    : action.includes('Fallback')
      ? RotateCcw
      : isLinkAction
        ? ExternalLink
        : Check;

  const className = secondary
    ? 'inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:border-[#D6B53B]/40 hover:text-[#8E7722] dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B] dark:hover:text-[#D6B53B]'
    : 'inline-flex items-center gap-2 rounded-lg bg-[#1a1f18] px-3 py-2 text-xs font-bold text-white hover:bg-[#D6B53B] dark:bg-[#D6B53B] dark:text-[#141A13]';

  if (isLinkAction) {
    return (
      <Link href={href} className={className}>
        <Icon className="h-3.5 w-3.5" />
        {action}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onRun} disabled={isPending} className={className}>
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {action}
    </button>
  );
}

function TrendChart({ trends }: { trends: DashboardOverview['trends'] }) {
  const maxRevenue = Math.max(...trends.revenue, 1);
  const maxBookings = Math.max(...trends.confirmed_bookings, ...trends.pending_bookings, 1);
  const points = trends.revenue.map((value, index) => {
    const x = trends.revenue.length === 1
      ? 50
      : (index / (trends.revenue.length - 1)) * 100;
    const y = 160 - (value / maxRevenue) * 140;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-[270px]">
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-[#A3B19B]">
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#D6B53B]" />Revenue</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Confirmed</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-orange-400" />Pending</span>
      </div>
      <div className="relative h-[215px] rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-[#1A2218]">
        <svg viewBox="0 0 100 170" preserveAspectRatio="none" className="absolute inset-x-4 top-4 h-[160px] w-[calc(100%-2rem)] overflow-visible">
          <polyline
            points={points}
            fill="none"
            stroke="#D6B53B"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
          />
          {trends.revenue.map((value, index) => {
            const x = trends.revenue.length === 1
              ? 50
              : (index / (trends.revenue.length - 1)) * 100;
            const y = 160 - (value / maxRevenue) * 140;
            return <circle key={`${value}-${index}`} cx={x} cy={y} r="1.4" fill="#D6B53B" />;
          })}
        </svg>
        <div className="absolute inset-x-4 bottom-9 top-4 flex items-end justify-between gap-2">
          {trends.labels.map((label, index) => (
            <div key={label} className="flex h-full min-w-0 flex-1 items-end justify-center gap-1">
              <div
                className="w-2 rounded-t bg-emerald-500/80"
                style={{ height: `${Math.max(4, (trends.confirmed_bookings[index] / maxBookings) * 100)}%` }}
                title={`${trends.confirmed_bookings[index]} confirmed bookings`}
              />
              <div
                className="w-2 rounded-t bg-orange-400/80"
                style={{ height: `${Math.max(4, (trends.pending_bookings[index] / maxBookings) * 100)}%` }}
                title={`${trends.pending_bookings[index]} pending bookings`}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-4 bottom-3 flex justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400 dark:text-[#A3B19B]">
          {trends.labels.map((label) => (
            <span key={label} className="min-w-0 flex-1 truncate text-center">{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HealthMetric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${
      danger
        ? 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10'
        : 'border-gray-100 bg-gray-50/70 dark:border-white/5 dark:bg-[#1A2218]'
    }`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-gray-400 dark:text-[#A3B19B]">
        {label}
      </p>
      <p className={`mt-2 text-xl font-bold ${danger ? 'text-red-600 dark:text-red-300' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  );
}
