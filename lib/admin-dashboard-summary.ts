import 'server-only';

import {
  BookingStatus,
  DashboardTaskStatus,
  EmailStatus,
  N8nWorkflowStatus,
  PaymentSummaryStatus,
  Prisma,
  Role,
} from '@prisma/client';
import type { CurrentAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import type {
  AdminDashboardData,
  AdminDashboardMetrics,
  AdminTaskItem,
  BookingActivityPoint,
  NotificationItem,
  OperationsSummary,
  PaymentSummary,
  UpcomingEvent,
  WorkflowHealth,
  WorkflowIssue,
} from '@/types/admin-dashboard';

const UPCOMING_EVENT_STATUSES = [
  BookingStatus.CONFIRMED,
  BookingStatus.PENDING,
  BookingStatus.IN_PROGRESS,
  BookingStatus.RESCHEDULED,
] as const;

const INACTIVE_BOOKING_STATUSES = [
  BookingStatus.CANCELLED,
  BookingStatus.DECLINED,
  BookingStatus.EXPIRED,
] as const;

const PENDING_PAYMENT_STATUSES = [
  PaymentSummaryStatus.UNPAID,
  PaymentSummaryStatus.FOR_VERIFICATION,
  PaymentSummaryStatus.RESERVATION_PAID,
  PaymentSummaryStatus.DOWN_PAYMENT_PAID,
  PaymentSummaryStatus.PARTIALLY_PAID,
  PaymentSummaryStatus.OVERDUE,
  PaymentSummaryStatus.REJECTED,
] as const;

const NON_REVENUE_PAYMENT_STATUSES = [
  PaymentSummaryStatus.FAILED,
  PaymentSummaryStatus.REFUNDED,
  PaymentSummaryStatus.CANCELLED,
] as const;

type BookingActivityRow = {
  month: Date | string;
  bookings: number | bigint | string;
  confirmed: number | bigint | string;
  pending: number | bigint | string;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfNextMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function toMonthKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
  ].join('-');
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
}

function humanize(value: string | null | undefined) {
  if (!value) return 'General';

  return value
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function hrefFor(module: string | null | undefined, recordId?: string | null) {
  switch (module) {
    case 'bookings':
    case 'booking':
      return recordId ? `/admin/bookings?selected=${encodeURIComponent(recordId)}` : '/admin/bookings';
    case 'payments':
    case 'payment':
      return '/admin/payments';
    case 'contracts':
    case 'contract':
      return '/admin/contracts';
    case 'inquiries':
    case 'inquiry':
      return recordId ? `/admin/inquiries?selected=${encodeURIComponent(recordId)}` : '/admin/inquiries';
    case 'calendar':
    case 'tasks':
      return '/admin/calendar';
    case 'email_logs':
    case 'workflow_logs':
    case 'audit':
      return '/admin/audit';
    case 'notifications':
      return '/admin/dashboard';
    default:
      return '/admin/dashboard';
  }
}

function actorTaskFilter(actor: CurrentAdmin): Prisma.DashboardTaskWhereInput {
  if (actor.role === Role.SUPERADMIN) {
    return {};
  }

  return {
    OR: [
      { assignedTo: null },
      { assignedTo: actor.id },
      { assignedTo: actor.username },
      { createdBy: actor.id },
    ],
  };
}

function notificationFilter(actor: CurrentAdmin): Prisma.NotificationWhereInput {
  if (actor.role === Role.SUPERADMIN) {
    return {};
  }

  return {
    OR: [
      { createdFor: null },
      { createdFor: actor.id },
      { createdFor: actor.username },
    ],
  };
}

function pendingPaymentRecordWhere(): Prisma.PaymentRecordWhereInput {
  return {
    status: { notIn: [...NON_REVENUE_PAYMENT_STATUSES] },
    OR: [
      { status: { in: [...PENDING_PAYMENT_STATUSES] } },
      { remainingBalance: { gt: 0 } },
      { pendingAmount: { gt: 0 } },
    ],
    booking: {
      status: { notIn: [...INACTIVE_BOOKING_STATUSES] },
    },
  };
}

function pendingBookingPaymentWhere(): Prisma.BookingWhereInput {
  return {
    paymentRecordId: null,
    status: { notIn: [...INACTIVE_BOOKING_STATUSES] },
    OR: [
      { paymentSummaryStatus: { in: [...PENDING_PAYMENT_STATUSES] } },
      { paymentRemainingBalance: { gt: 0 } },
    ],
  };
}

function overduePaymentRecordWhere(today: Date): Prisma.PaymentRecordWhereInput {
  return {
    status: { notIn: [...NON_REVENUE_PAYMENT_STATUSES] },
    booking: {
      status: { notIn: [...INACTIVE_BOOKING_STATUSES] },
    },
    OR: [
      { status: PaymentSummaryStatus.OVERDUE },
      {
        dueDate: { lt: today },
        remainingBalance: { gt: 0 },
      },
    ],
  };
}

function overdueBookingPaymentWhere(today: Date): Prisma.BookingWhereInput {
  return {
    paymentRecordId: null,
    status: { notIn: [...INACTIVE_BOOKING_STATUSES] },
    OR: [
      { paymentSummaryStatus: PaymentSummaryStatus.OVERDUE },
      {
        paymentDueDate: { lt: today },
        paymentRemainingBalance: { gt: 0 },
      },
    ],
  };
}

function normalizeTaskStatus(task: {
  status: DashboardTaskStatus;
  taskDate: Date;
  isActive?: boolean;
  activationStatus?: string | null;
}) {
  if (!task.isActive && task.activationStatus === 'pending_booking_approval') {
    return 'pending_approval';
  }

  if (
    task.status === DashboardTaskStatus.PENDING &&
    startOfDay(task.taskDate) < startOfDay(new Date())
  ) {
    return 'overdue';
  }

  return task.status.toLowerCase();
}

async function getMetrics(actor: CurrentAdmin): Promise<AdminDashboardMetrics> {
  const today = startOfDay(new Date());
  const nextThirtyDays = addDays(today, 30);

  const [
    totalBookings,
    upcomingEvents,
    pendingPaymentRecords,
    pendingBookingPayments,
    openTasks,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({
      where: {
        eventDate: {
          gte: today,
          lte: nextThirtyDays,
        },
        status: { in: [...UPCOMING_EVENT_STATUSES] },
      },
    }),
    prisma.paymentRecord.count({ where: pendingPaymentRecordWhere() }),
    prisma.booking.count({ where: pendingBookingPaymentWhere() }),
    prisma.dashboardTask.count({
      where: {
        ...actorTaskFilter(actor),
        status: { in: [DashboardTaskStatus.PENDING, DashboardTaskStatus.OVERDUE] },
      },
    }),
  ]);

  return {
    totalBookings,
    upcomingEvents,
    pendingPayments: pendingPaymentRecords + pendingBookingPayments,
    openTasks,
  };
}

async function getUpcomingEvents(): Promise<UpcomingEvent[]> {
  const today = startOfDay(new Date());
  const nextThirtyDays = addDays(today, 30);

  const bookings = await prisma.booking.findMany({
    where: {
      eventDate: {
        gte: today,
        lte: nextThirtyDays,
      },
      status: { in: [...UPCOMING_EVENT_STATUSES] },
    },
    orderBy: [{ eventDate: 'asc' }, { startTime: 'asc' }],
    take: 5,
    select: {
      id: true,
      eventTitle: true,
      eventType: true,
      eventCategoryName: true,
      clientName: true,
      eventDate: true,
      startTime: true,
      venue: true,
      status: true,
    },
  });

  return bookings.map((booking) => ({
    id: booking.id,
    title: booking.eventTitle,
    eventType: booking.eventCategoryName ?? booking.eventType,
    clientName: booking.clientName,
    date: booking.eventDate.toISOString(),
    time: booking.startTime,
    venue: booking.venue,
    status: booking.status.toLowerCase(),
    href: hrefFor('bookings', booking.id),
  }));
}

async function getBookingActivity(): Promise<BookingActivityPoint[]> {
  const now = new Date();
  const firstMonth = addMonths(startOfMonth(now), -5);
  const end = startOfNextMonth(now);
  const buckets = Array.from({ length: 6 }, (_, index) => {
    const date = addMonths(firstMonth, index);
    return {
      month: toMonthKey(date),
      label: formatMonthLabel(date),
    };
  });

  const rows = await prisma.$queryRaw<BookingActivityRow[]>`
    SELECT
      date_trunc('month', "created_at") AS month,
      COUNT(*)::int AS bookings,
      COUNT(*) FILTER (
        WHERE "status"::text IN ('CONFIRMED', 'IN_PROGRESS', 'RESCHEDULED')
      )::int AS confirmed,
      COUNT(*) FILTER (
        WHERE "status"::text IN ('PENDING', 'ON_HOLD')
      )::int AS pending
    FROM "bookings"
    WHERE "created_at" >= ${firstMonth}
      AND "created_at" < ${end}
      AND "status"::text NOT IN ('CANCELLED', 'DECLINED', 'EXPIRED')
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const byMonth = new Map(
    rows.map((row) => {
      const monthDate = row.month instanceof Date ? row.month : new Date(row.month);
      return [
        toMonthKey(monthDate),
        {
          bookings: Number(row.bookings),
          confirmed: Number(row.confirmed),
          pending: Number(row.pending),
        },
      ];
    }),
  );

  return buckets.map((bucket) => ({
    ...bucket,
    bookings: byMonth.get(bucket.month)?.bookings ?? 0,
    confirmed: byMonth.get(bucket.month)?.confirmed ?? 0,
    pending: byMonth.get(bucket.month)?.pending ?? 0,
  }));
}

async function getTaskSummary(actor: CurrentAdmin): Promise<AdminTaskItem[]> {
  const tasks = await prisma.dashboardTask.findMany({
    where: {
      ...actorTaskFilter(actor),
      status: { in: [DashboardTaskStatus.PENDING, DashboardTaskStatus.OVERDUE] },
    },
    orderBy: [
      { isActive: 'desc' },
      { orderIndex: 'asc' },
      { status: 'desc' },
      { priority: 'desc' },
      { taskDate: 'asc' },
      { createdAt: 'desc' },
    ],
    take: 5,
  });

  const bookingIds = tasks
    .filter((task) => task.relatedModule === 'bookings' && task.relatedRecordId)
    .map((task) => task.relatedRecordId as string);
  const bookings = bookingIds.length
    ? await prisma.booking.findMany({
        where: { id: { in: bookingIds } },
        select: {
          id: true,
          bookingReference: true,
          clientName: true,
          eventTitle: true,
        },
      })
    : [];
  const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));

  return tasks.map((task) => {
    const booking = task.relatedRecordId ? bookingById.get(task.relatedRecordId) : null;
    const relatedLabel = booking
      ? `${booking.clientName} - ${booking.bookingReference}`
      : task.bookingReference ?? humanize(task.relatedModule);

    return {
      id: task.id,
      title: task.title,
      relatedLabel,
      dueDate: task.taskDate.toISOString(),
      dueTime: task.taskTime,
      priority: task.priority.toLowerCase(),
      status: normalizeTaskStatus(task),
      category: task.category,
      href: hrefFor(task.relatedModule, task.relatedRecordId),
      orderIndex: task.orderIndex,
      taskTemplateKey: task.taskTemplateKey,
      activationStatus: task.activationStatus,
      isActive: task.isActive,
      isEditable: task.isEditable,
      canComplete: task.isActive && task.status !== DashboardTaskStatus.COMPLETED,
    };
  });
}

async function getNotifications(actor: CurrentAdmin): Promise<NotificationItem[]> {
  const notifications = await prisma.notification.findMany({
    where: notificationFilter(actor),
    orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
    take: 5,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      priority: true,
      isRead: true,
      relatedModule: true,
      relatedRecordId: true,
      createdAt: true,
    },
  });

  return notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type.toLowerCase(),
    priority: notification.priority.toLowerCase(),
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    href: hrefFor(notification.relatedModule, notification.relatedRecordId),
  }));
}

async function getPaymentSummary(): Promise<PaymentSummary> {
  const today = startOfDay(new Date());
  const [
    recordCollected,
    bookingCollected,
    pendingPaymentRecords,
    pendingBookingPayments,
    overduePaymentRecords,
    overdueBookingPayments,
    recentActivity,
  ] = await Promise.all([
    prisma.paymentRecord.aggregate({
      where: {
        status: { notIn: [...NON_REVENUE_PAYMENT_STATUSES] },
        booking: { status: { notIn: [...INACTIVE_BOOKING_STATUSES] } },
      },
      _sum: { amountPaid: true },
    }),
    prisma.booking.aggregate({
      where: {
        paymentRecordId: null,
        status: { notIn: [...INACTIVE_BOOKING_STATUSES] },
        paymentSummaryStatus: { notIn: [...NON_REVENUE_PAYMENT_STATUSES] },
      },
      _sum: { paymentAmountPaid: true },
    }),
    prisma.paymentRecord.count({ where: pendingPaymentRecordWhere() }),
    prisma.booking.count({ where: pendingBookingPaymentWhere() }),
    prisma.paymentRecord.count({ where: overduePaymentRecordWhere(today) }),
    prisma.booking.count({ where: overdueBookingPaymentWhere(today) }),
    prisma.paymentHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        payment: {
          select: {
            id: true,
            bookingReference: true,
            clientName: true,
            paymentReference: true,
          },
        },
      },
    }),
  ]);

  return {
    totalCollected:
      (recordCollected._sum.amountPaid ?? 0) +
      (bookingCollected._sum.paymentAmountPaid ?? 0),
    pendingPayments: pendingPaymentRecords + pendingBookingPayments,
    overduePayments: overduePaymentRecords + overdueBookingPayments,
    recentActivity: recentActivity.map((entry) => ({
      id: entry.id,
      title: humanize(entry.action),
      description: entry.description,
      amount: entry.paymentAmount,
      createdAt: entry.createdAt.toISOString(),
      href: entry.payment?.bookingReference
        ? `/admin/payments?bookingReference=${encodeURIComponent(entry.payment.bookingReference)}`
        : '/admin/payments',
    })),
  };
}

async function getWorkflowHealth(): Promise<WorkflowHealth> {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const [
    lastSuccessfulBookingWorkflow,
    latestWorkflow,
    failedWorkflowsToday,
    failedWorkflowIssues,
    emailLogCount,
    failedEmailsToday,
    pendingEmails,
    failedEmailIssues,
  ] = await Promise.all([
    prisma.n8nWorkflowLog.findFirst({
      where: {
        status: N8nWorkflowStatus.SUCCESS,
        OR: [
          { workflowName: { contains: 'booking', mode: 'insensitive' } },
          { relatedModule: { contains: 'booking', mode: 'insensitive' } },
        ],
      },
      orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
      select: { completedAt: true, createdAt: true },
    }),
    prisma.n8nWorkflowLog.findFirst({
      orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
      select: { id: true },
    }),
    prisma.n8nWorkflowLog.count({
      where: {
        status: N8nWorkflowStatus.FAILED,
        createdAt: { gte: today, lt: tomorrow },
      },
    }),
    prisma.n8nWorkflowLog.findMany({
      where: { status: N8nWorkflowStatus.FAILED },
      orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      select: {
        id: true,
        workflowName: true,
        errorMessage: true,
        completedAt: true,
        createdAt: true,
      },
    }),
    prisma.emailLog.count(),
    prisma.emailLog.count({
      where: {
        status: { in: [EmailStatus.FAILED, EmailStatus.BOUNCED] },
        createdAt: { gte: today, lt: tomorrow },
      },
    }),
    prisma.emailLog.count({
      where: {
        status: { in: [EmailStatus.QUEUED, EmailStatus.PENDING, EmailStatus.RETRIED] },
      },
    }),
    prisma.emailLog.findMany({
      where: { status: { in: [EmailStatus.FAILED, EmailStatus.BOUNCED] } },
      orderBy: [{ failedAt: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      select: {
        id: true,
        subject: true,
        errorMessage: true,
        status: true,
        failedAt: true,
        createdAt: true,
      },
    }),
  ]);

  const status = failedWorkflowsToday > 0
    ? 'failed'
    : pendingEmails > 0
      ? 'warning'
      : latestWorkflow
        ? 'healthy'
        : 'no_recent_activity';
  const emailDeliveryStatus = failedEmailsToday > 0
    ? 'failed'
    : pendingEmails > 0
      ? 'warning'
      : emailLogCount > 0
        ? 'healthy'
        : 'no_recent_activity';

  const recentIssues: WorkflowIssue[] = [
    ...failedWorkflowIssues.map((workflow) => ({
      id: `workflow:${workflow.id}`,
      title: workflow.workflowName,
      message: workflow.errorMessage ?? 'Workflow failed without a recorded message.',
      type: 'workflow' as const,
      priority: 'critical' as const,
      createdAt: (workflow.completedAt ?? workflow.createdAt).toISOString(),
      href: hrefFor('workflow_logs', workflow.id),
    })),
    ...failedEmailIssues.map((email) => ({
      id: `email:${email.id}`,
      title: email.subject,
      message: email.errorMessage ?? `Email status is ${email.status.toLowerCase()}.`,
      type: 'email' as const,
      priority: 'high' as const,
      createdAt: (email.failedAt ?? email.createdAt).toISOString(),
      href: hrefFor('email_logs', email.id),
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    status,
    statusLabel: humanize(status),
    lastSuccessfulBookingWorkflow:
      (lastSuccessfulBookingWorkflow?.completedAt ?? lastSuccessfulBookingWorkflow?.createdAt)?.toISOString() ?? null,
    failedWorkflows: failedWorkflowsToday,
    emailDeliveryStatus,
    emailDeliveryLabel: humanize(emailDeliveryStatus),
    recentIssues,
  };
}

function buildOperationsSummary(
  actor: CurrentAdmin,
  metrics: AdminDashboardMetrics,
  tasks: AdminTaskItem[],
  workflowHealth: WorkflowHealth,
): OperationsSummary {
  const now = new Date();
  const hour = now.getHours();
  const greetingWord = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const summaryParts: string[] = [];

  if (metrics.upcomingEvents > 0) {
    summaryParts.push(`${metrics.upcomingEvents} event${metrics.upcomingEvents === 1 ? '' : 's'} scheduled in the next 30 days`);
  }

  if (metrics.openTasks > 0) {
    summaryParts.push(`${metrics.openTasks} open task${metrics.openTasks === 1 ? '' : 's'}`);
  }

  if (metrics.pendingPayments > 0) {
    summaryParts.push(`${metrics.pendingPayments} payment follow-up${metrics.pendingPayments === 1 ? '' : 's'}`);
  }

  if (workflowHealth.status === 'failed' || workflowHealth.status === 'warning') {
    summaryParts.push(`${workflowHealth.statusLabel.toLowerCase()} automation health`);
  }

  const priorityTask = tasks.find((task) => task.priority === 'critical' || task.priority === 'high') ?? tasks[0];
  const priorityAction = priorityTask
    ? `Review ${priorityTask.title}.`
    : metrics.pendingPayments > 0
      ? 'Review pending payment records.'
      : metrics.upcomingEvents > 0
        ? 'Check upcoming event readiness.'
        : 'Monitor new bookings and workflow results.';

  return {
    greeting: `${greetingWord}, ${actor.username}`,
    currentDate: new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(now),
    summary: summaryParts.length
      ? summaryParts.join(', ') + '.'
      : 'No major operations activity is waiting right now.',
    priorityAction,
  };
}

export async function getAdminDashboardSummary(actor: CurrentAdmin): Promise<AdminDashboardData> {
  const [
    metrics,
    bookingActivity,
    upcomingEvents,
    taskSummary,
    recentNotifications,
    paymentSummary,
    workflowHealth,
  ] = await Promise.all([
    getMetrics(actor),
    getBookingActivity(),
    getUpcomingEvents(),
    getTaskSummary(actor),
    getNotifications(actor),
    getPaymentSummary(),
    getWorkflowHealth(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    operationsSummary: buildOperationsSummary(actor, metrics, taskSummary, workflowHealth),
    metrics,
    bookingActivity,
    upcomingEvents,
    taskSummary,
    recentNotifications,
    paymentSummary,
    workflowHealth,
  };
}
