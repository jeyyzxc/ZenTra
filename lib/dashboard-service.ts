import {
  AuditAction,
  AuditStatus,
  AutomationStatus,
  BookingStatus,
  DashboardTaskPriority,
  DashboardTaskSource,
  DashboardTaskStatus,
  EmailStatus,
  InquiryPriority,
  InquiryStatus,
  N8nWorkflowStatus,
  NotificationPriority,
  NotificationType,
  PaymentSummaryStatus,
  Prisma,
  Role,
  SyncStatus,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { auditActor, createAuditLog, systemAuditActor } from '@/lib/audit';
import type { CurrentAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

const ACTIVE_EVENT_STATUSES = [
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.RESCHEDULED,
] as const;

const PENDING_BOOKING_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.ON_HOLD,
] as const;

function isBookingApprovedOrActive(status: BookingStatus) {
  return status === BookingStatus.CONFIRMED || status === BookingStatus.IN_PROGRESS;
}

const REVENUE_PAYMENT_STATUSES = [
  PaymentSummaryStatus.FOR_VERIFICATION,
  PaymentSummaryStatus.RESERVATION_PAID,
  PaymentSummaryStatus.DOWN_PAYMENT_PAID,
  PaymentSummaryStatus.PARTIALLY_PAID,
  PaymentSummaryStatus.FULLY_PAID,
  PaymentSummaryStatus.REJECTED,
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

type RelatedModule =
  | 'bookings'
  | 'payments'
  | 'contracts'
  | 'inquiries'
  | 'calendar'
  | 'tasks'
  | 'audit'
  | 'email_logs'
  | 'workflow_logs'
  | 'notifications';

export type DashboardSnapshot = {
  total_bookings: number;
  confirmed_events: number;
  pending_bookings: number;
  revenue_this_month: number;
  pending_payments: number;
  contracts_pending: number;
  unanswered_inquiries: number;
  needs_action: number;
};

export type DashboardAssistantSummary = {
  greeting: string;
  summary: Array<{
    type: string;
    message: string;
  }>;
  priority_action: string;
  generated_at: string;
};

export type DashboardTrends = {
  range: string;
  labels: string[];
  revenue: number[];
  confirmed_bookings: number[];
  pending_bookings: number[];
};

export type DashboardNeedAction = {
  id: string;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  related_module: RelatedModule;
  related_record_id: string | null;
  primary_action: string;
  secondary_action: string | null;
  href: string;
  created_at: string;
};

export type DashboardCalendarItem = {
  id: string;
  date: string;
  type: string;
  title: string;
  time: string | null;
  related_module: RelatedModule;
  related_record_id: string | null;
  status: string | null;
  priority?: string | null;
};

export type DashboardCalendar = {
  month: string;
  items: DashboardCalendarItem[];
};

export type DashboardAgendaItem = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  related_module: RelatedModule | string | null;
  related_record_id: string | null;
  priority: string;
  status: string;
  assigned_admin: string | null;
  assigned_role: string | null;
  booking_reference: string | null;
  category: string | null;
  created_source: string;
  workflow_execution_id: string | null;
  order_index: number;
  task_template_key: string | null;
  activation_status: string | null;
  is_active: boolean;
  is_editable: boolean;
  can_complete: boolean;
};

export type DashboardUpcomingEvent = {
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
};

export type DashboardRecentActivity = {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  href: string;
};

export type DashboardWorkflowHealth = {
  successful_workflows_today: number;
  failed_workflows_today: number;
  failed_emails_today: number;
  pending_retries: number;
  last_workflow_run_at: string | null;
};

export type DashboardNotification = {
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
};

export type DashboardOverview = {
  generated_at: string;
  snapshot: DashboardSnapshot;
  assistant_summary: DashboardAssistantSummary;
  trends: DashboardTrends;
  needs_action: DashboardNeedAction[];
  calendar: DashboardCalendar;
  agenda: DashboardAgendaItem[];
  upcoming_events: DashboardUpcomingEvent[];
  recent_activity: DashboardRecentActivity[];
  workflow_health: DashboardWorkflowHealth;
  notifications: DashboardNotification[];
};

export type DashboardAgendaInput = {
  title?: unknown;
  description?: unknown;
  date?: unknown;
  time?: unknown;
  priority?: unknown;
  assignedTo?: unknown;
  relatedModule?: unknown;
  relatedRecordId?: unknown;
  source?: unknown;
  reminderOption?: unknown;
};

export type AdminTodoTaskInput = {
  orderIndex?: unknown;
  title?: unknown;
  description?: unknown;
  priority?: unknown;
  status?: unknown;
  activationStatus?: unknown;
  isActive?: unknown;
  isEditable?: unknown;
  category?: unknown;
  taskTemplateKey?: unknown;
  dueDate?: unknown;
  assignedToRole?: unknown;
};

export type AdminTodoBulkCreateInput = {
  relatedModule?: unknown;
  relatedRecordId?: unknown;
  bookingReference?: unknown;
  source?: unknown;
  workflowName?: unknown;
  workflowExecutionId?: unknown;
  eventType?: unknown;
  clientName?: unknown;
  categorization?: unknown;
  tasks?: unknown;
};

export type AdminTodoBulkCreateResult = {
  bookingReference: string;
  createdCount: number;
  taskIds: string[];
};

export type WorkflowLogInput = {
  workflowName?: unknown;
  workflowExecutionId?: unknown;
  relatedModule?: unknown;
  relatedRecordId?: unknown;
  triggerSource?: unknown;
  requestPayload?: unknown;
  responsePayload?: unknown;
  status?: unknown;
  errorMessage?: unknown;
  startedAt?: unknown;
  completedAt?: unknown;
};

export type NotificationInput = {
  bookingReference?: unknown;
  title?: unknown;
  message?: unknown;
  type?: unknown;
  priority?: unknown;
  relatedModule?: unknown;
  relatedRecordId?: unknown;
  audience?: unknown;
  payload?: unknown;
  createdFor?: unknown;
  createdBy?: unknown;
  source?: unknown;
};

export class DashboardServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'DashboardServiceError';
    this.status = status;
  }
}

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

function toDateOnly(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function toMonthKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
  ].join('-');
}

function parseDateInput(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new DashboardServiceError(`${label} is required.`);
  }

  const parsed = new Date(`${value.trim()}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    throw new DashboardServiceError(`${label} must be a valid date.`);
  }

  return parsed;
}

function parseOptionalDateInput(value: unknown, label: string) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = new Date(String(value));

  if (Number.isNaN(parsed.getTime())) {
    throw new DashboardServiceError(`${label} must be a valid date.`);
  }

  return parsed;
}

function trimText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function requiredText(value: unknown, label: string) {
  const text = trimText(value);

  if (!text) {
    throw new DashboardServiceError(`${label} is required.`);
  }

  return text;
}

function parseEnumValue<T extends string>(
  value: unknown,
  options: readonly T[],
  fallback: T,
) {
  return typeof value === 'string' && options.includes(value as T)
    ? value as T
    : fallback;
}

function parseOptionalJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    Array.isArray(value) ||
    typeof value === 'object'
  ) {
    return value as Prisma.InputJsonValue;
  }

  return undefined;
}

function parseJsonString(value: string, label: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new DashboardServiceError(`${label} must be valid JSON.`);
  }
}

function parseAdminTodoTasks(value: unknown) {
  const tasks = typeof value === 'string' && value.trim()
    ? parseJsonString(value, 'tasks')
    : value;

  if (tasks === undefined || tasks === null) {
    throw new DashboardServiceError('tasks is required.');
  }

  if (!Array.isArray(tasks)) {
    throw new DashboardServiceError('tasks must be an array.');
  }

  if (tasks.length === 0) {
    throw new DashboardServiceError('tasks must contain at least one task.');
  }

  return tasks.map((task, index) => {
    if (!task || typeof task !== 'object' || Array.isArray(task)) {
      throw new DashboardServiceError(`tasks[${index}] must be an object.`);
    }

    const record = task as AdminTodoTaskInput;

    return {
      orderIndex: parseAdminTodoOrderIndex(record.orderIndex, index),
      title: requiredText(record.title, `tasks[${index}].title`),
      description: requiredText(record.description, `tasks[${index}].description`),
      priority: parseAdminTodoPriority(record.priority, index),
      status: parseAdminTodoStatus(record.status, index),
      activationStatus: parseAdminTodoActivationStatus(record.activationStatus),
      isActive: parseOptionalBoolean(record.isActive, false),
      isEditable: parseOptionalBoolean(record.isEditable, true),
      category: requiredText(record.category, `tasks[${index}].category`).toLowerCase(),
      taskTemplateKey: trimText(record.taskTemplateKey),
      dueDate: parseAdminTodoDueDate(record.dueDate, index),
      assignedToRole: requiredText(record.assignedToRole, `tasks[${index}].assignedToRole`).toUpperCase(),
    };
  });
}

function uniqueAdminTodoTasks(tasks: ReturnType<typeof parseAdminTodoTasks>) {
  const seenKeys = new Set<string>();

  return tasks.filter((task) => {
    const key = `${task.title.toLowerCase()}|${task.orderIndex}|${task.taskTemplateKey ?? ''}`;

    if (seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
}

function parseOptionalBoolean(value: unknown, fallback: boolean) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  return fallback;
}

function parseAdminTodoOrderIndex(value: unknown, index: number) {
  if (value === undefined || value === null || value === '') {
    return index + 1;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new DashboardServiceError(`tasks[${index}].orderIndex must be a positive whole number.`);
  }

  return parsed;
}

function parseAdminTodoActivationStatus(value: unknown) {
  const status = trimText(value)?.toLowerCase();

  if (!status) {
    return 'pending_booking_approval';
  }

  if (status === 'pending_booking_approval' || status === 'active' || status === 'inactive') {
    return status;
  }

  throw new DashboardServiceError('activationStatus is invalid.');
}

function parseAdminTodoPriority(value: unknown, index: number) {
  const priority = requiredText(value, `tasks[${index}].priority`).toLowerCase();

  if (priority === 'low') return DashboardTaskPriority.LOW;
  if (priority === 'normal' || priority === 'medium') return DashboardTaskPriority.MEDIUM;
  if (priority === 'high') return DashboardTaskPriority.HIGH;
  if (priority === 'urgent' || priority === 'critical') return DashboardTaskPriority.CRITICAL;

  throw new DashboardServiceError(`tasks[${index}].priority is invalid.`);
}

function parseAdminTodoStatus(value: unknown, index: number) {
  const status = requiredText(value, `tasks[${index}].status`).toLowerCase();

  if (status === 'pending') return DashboardTaskStatus.PENDING;
  if (status === 'completed') return DashboardTaskStatus.COMPLETED;
  if (status === 'cancelled') return DashboardTaskStatus.CANCELLED;
  if (status === 'overdue') return DashboardTaskStatus.OVERDUE;

  throw new DashboardServiceError(`tasks[${index}].status is invalid.`);
}

function parseAdminTodoDueDate(value: unknown, index: number) {
  const rawDate = requiredText(value, `tasks[${index}].dueDate`);
  const parsed = new Date(rawDate);

  if (Number.isNaN(parsed.getTime())) {
    throw new DashboardServiceError(`tasks[${index}].dueDate must be a valid date.`);
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function normalizeTaskRelatedModule(value: unknown) {
  const relatedModule = requiredText(value, 'relatedModule').toLowerCase();

  if (relatedModule === 'booking' || relatedModule === 'bookings') {
    return 'bookings';
  }

  throw new DashboardServiceError('relatedModule must be booking.');
}

function normalizeNotificationModule(value: unknown) {
  const relatedModule = trimText(value);

  if (!relatedModule) {
    return null;
  }

  const normalized = relatedModule.toLowerCase();

  if (normalized === 'booking' || normalized === 'bookings') return 'bookings';
  if (normalized === 'payment' || normalized === 'payments') return 'payments';
  if (normalized === 'contract' || normalized === 'contracts') return 'contracts';
  if (normalized === 'inquiry' || normalized === 'inquiries') return 'inquiries';
  if (normalized === 'task' || normalized === 'tasks') return 'tasks';
  if (normalized === 'email' || normalized === 'email_logs') return 'email_logs';
  if (normalized === 'workflow' || normalized === 'workflow_logs') return 'workflow_logs';

  return normalized;
}

function parseNotificationType(value: unknown) {
  const raw = trimText(value)?.toUpperCase();

  if (raw === 'NEW_BOOKING_TASK_LIST_CREATED') {
    return NotificationType.TASK;
  }

  return parseEnumValue(raw, Object.values(NotificationType), NotificationType.SYSTEM);
}

function hrefFor(module: RelatedModule | string | null, recordId?: string | null) {
  switch (module) {
    case 'bookings':
      return recordId ? `/admin/bookings?selected=${encodeURIComponent(recordId)}` : '/admin/bookings';
    case 'payments':
      return '/admin/payments';
    case 'contracts':
      return '/admin/contracts';
    case 'inquiries':
      return recordId ? `/admin/inquiries?selected=${encodeURIComponent(recordId)}` : '/admin/inquiries';
    case 'testimonies':
      return recordId ? `/admin/testimonies?selected=${encodeURIComponent(recordId)}` : '/admin/testimonies';
    case 'calendar':
    case 'tasks':
      return '/admin/calendar';
    case 'audit':
    case 'email_logs':
    case 'workflow_logs':
      return '/admin/audit';
    case 'notifications':
      return '/admin/dashboard';
    default:
      return '/admin/dashboard';
  }
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function normalizePriority(priority: DashboardTaskPriority | NotificationPriority) {
  return priority.toLowerCase() as DashboardNeedAction['priority'];
}

function contractPendingWhere(): Prisma.BookingWhereInput {
  return {
    OR: [
      { contractStatus: { contains: 'pending', mode: 'insensitive' } },
      { contractStatus: { contains: 'review', mode: 'insensitive' } },
      { contractStatus: { contains: 'not_sent', mode: 'insensitive' } },
      { contractStatus: { contains: 'not signed', mode: 'insensitive' } },
      { contractStatus: { contains: 'unsigned', mode: 'insensitive' } },
      { contractStatus: { contains: 'awaiting', mode: 'insensitive' } },
      { contractStatus: { equals: 'ready_to_send', mode: 'insensitive' } },
      { contractStatus: { equals: 'sent', mode: 'insensitive' } },
      { contractStatus: { equals: 'viewed', mode: 'insensitive' } },
      { contractStatus: { equals: 'delivery_failed', mode: 'insensitive' } },
    ],
  };
}

function taskStatusForDate(task: { status: DashboardTaskStatus; taskDate: Date }) {
  if (
    task.status === DashboardTaskStatus.PENDING &&
    startOfDay(task.taskDate) < startOfDay(new Date())
  ) {
    return DashboardTaskStatus.OVERDUE;
  }

  return task.status;
}

function sortDashboardTasksForDisplay<T extends {
  orderIndex: number;
  status: DashboardTaskStatus;
  taskTime: string | null;
  createdAt: Date;
}>(tasks: T[]) {
  const allCompleted = tasks.length > 0 &&
    tasks.every((task) => task.status === DashboardTaskStatus.COMPLETED);

  return [...tasks].sort((a, b) => {
    if (!allCompleted) {
      const aGroup = a.status === DashboardTaskStatus.COMPLETED ? 1 : 0;
      const bGroup = b.status === DashboardTaskStatus.COMPLETED ? 1 : 0;

      if (aGroup !== bGroup) {
        return aGroup - bGroup;
      }
    }

    return a.orderIndex - b.orderIndex ||
      (a.taskTime ?? '').localeCompare(b.taskTime ?? '') ||
      a.createdAt.getTime() - b.createdAt.getTime();
  });
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

function notificationToDto(notification: {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  relatedModule: string | null;
  relatedRecordId: string | null;
  createdAt: Date;
}): DashboardNotification {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type.toLowerCase(),
    priority: notification.priority.toLowerCase(),
    is_read: notification.isRead,
    related_module: notification.relatedModule,
    related_record_id: notification.relatedRecordId,
    created_at: notification.createdAt.toISOString(),
    href: hrefFor(notification.relatedModule, notification.relatedRecordId),
  };
}

export class DashboardService {
  static async getOverview(actor: CurrentAdmin, options?: {
    range?: string;
    month?: string;
  }): Promise<DashboardOverview> {
    const generatedAt = new Date().toISOString();
    const month = options?.month ?? toMonthKey(new Date());
    const range = options?.range ?? 'this_year';

    const [
      needsAction,
      trends,
      calendar,
      agenda,
      upcomingEvents,
      recentActivity,
      workflowHealth,
      notifications,
    ] = await Promise.all([
      this.getNeedsAction(actor),
      this.getTrends(range),
      this.getCalendar(month, actor),
      this.getAgenda('today', actor),
      this.getUpcomingEvents(5),
      this.getRecentActivity(10),
      this.getWorkflowHealth(),
      this.getNotifications(actor, 8),
    ]);

    const snapshot = await this.getSnapshot(needsAction.length);
    const assistant = await this.getAssistantSummary(actor, snapshot, needsAction, workflowHealth);

    return {
      generated_at: generatedAt,
      snapshot,
      assistant_summary: assistant,
      trends,
      needs_action: needsAction,
      calendar,
      agenda,
      upcoming_events: upcomingEvents,
      recent_activity: recentActivity,
      workflow_health: workflowHealth,
      notifications,
    };
  }

  static async getSnapshot(needsActionCount?: number): Promise<DashboardSnapshot> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const nextMonthStart = startOfNextMonth(now);
    const today = startOfDay(now);

    const [
      totalBookings,
      confirmedEvents,
      pendingBookings,
      paidBookings,
      pendingPayments,
      contractsPending,
      unansweredInquiries,
      needsAction,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          createdAt: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
      }),
      prisma.booking.count({
        where: {
          status: { in: [...ACTIVE_EVENT_STATUSES] },
          eventDate: { gte: today },
        },
      }),
      prisma.booking.count({
        where: {
          status: { in: [...PENDING_BOOKING_STATUSES] },
        },
      }),
      prisma.booking.findMany({
        where: {
          paymentSummaryStatus: { in: [...REVENUE_PAYMENT_STATUSES] },
          paymentLastDate: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
        select: {
          paymentAmountPaid: true,
        },
      }),
      prisma.booking.count({
        where: {
          OR: [
            { paymentSummaryStatus: { in: [...PENDING_PAYMENT_STATUSES] } },
            { paymentRemainingBalance: { gt: 0 } },
          ],
        },
      }),
      prisma.booking.count({
        where: contractPendingWhere(),
      }),
      prisma.inquiry.count({
        where: {
          status: {
            in: [
              InquiryStatus.NEW,
              InquiryStatus.PENDING_RESPONSE,
              InquiryStatus.FOLLOW_UP,
            ],
          },
        },
      }),
      needsActionCount === undefined ? this.getNeedsActionCount() : Promise.resolve(needsActionCount),
    ]);

    return {
      total_bookings: totalBookings,
      confirmed_events: confirmedEvents,
      pending_bookings: pendingBookings,
      revenue_this_month: paidBookings.reduce(
        (total, booking) => total + (booking.paymentAmountPaid ?? 0),
        0,
      ),
      pending_payments: pendingPayments,
      contracts_pending: contractsPending,
      unanswered_inquiries: unansweredInquiries,
      needs_action: needsAction,
    };
  }

  static async getAssistantSummary(
    actor: CurrentAdmin,
    snapshot?: DashboardSnapshot,
    needsAction?: DashboardNeedAction[],
    workflowHealth?: DashboardWorkflowHealth,
  ): Promise<DashboardAssistantSummary> {
    const generatedAt = new Date();
    const facts = snapshot ?? await this.getSnapshot();
    const actionItems = needsAction ?? await this.getNeedsAction(actor);
    const health = workflowHealth ?? await this.getWorkflowHealth();
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const eventsToday = await prisma.booking.count({
      where: {
        status: { in: [...ACTIVE_EVENT_STATUSES] },
        eventDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const hour = generatedAt.getHours();
    const greetingWord = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const summary: DashboardAssistantSummary['summary'] = [];

    if (actionItems.length > 0) {
      summary.push({
        type: 'needs_action',
        message: `You have ${actionItems.length} dashboard item${actionItems.length === 1 ? '' : 's'} needing attention.`,
      });
    }

    if (facts.pending_payments > 0) {
      summary.push({
        type: 'payment',
        message: `${facts.pending_payments} payment record${facts.pending_payments === 1 ? ' is' : 's are'} due, unpaid, or partially paid.`,
      });
    }

    if (facts.contracts_pending > 0) {
      summary.push({
        type: 'contract',
        message: `${facts.contracts_pending} contract${facts.contracts_pending === 1 ? ' is' : 's are'} awaiting review, sending, or signing.`,
      });
    }

    if (facts.unanswered_inquiries > 0) {
      summary.push({
        type: 'inquiry',
        message: `${facts.unanswered_inquiries} inquiry message${facts.unanswered_inquiries === 1 ? ' is' : 's are'} still unanswered.`,
      });
    }

    if (eventsToday > 0) {
      summary.push({
        type: 'event',
        message: `${eventsToday} event${eventsToday === 1 ? ' is' : 's are'} scheduled for today.`,
      });
    }

    const workflowIssues = health.failed_workflows_today + health.failed_emails_today;
    if (workflowIssues > 0) {
      summary.push({
        type: 'workflow',
        message: `${workflowIssues} workflow or email issue${workflowIssues === 1 ? '' : 's'} were detected today.`,
      });
    }

    if (summary.length === 0) {
      summary.push({
        type: 'empty',
        message: 'No major activity has been recorded yet today.',
      });
    }

    const topPriority = actionItems.find((item) => (
      item.priority === 'critical' || item.priority === 'high'
    )) ?? actionItems[0];
    const priorityAction = topPriority
      ? `${topPriority.primary_action}: ${topPriority.title}.`
      : facts.unanswered_inquiries > 0
        ? 'Review unanswered inquiries first.'
        : facts.pending_payments > 0
          ? 'Review pending payment records first.'
          : 'No immediate priority is recorded right now.';

    return {
      greeting: `${greetingWord}, ${actor.username}!`,
      summary,
      priority_action: priorityAction,
      generated_at: generatedAt.toISOString(),
    };
  }

  static async getTrends(range = 'this_year'): Promise<DashboardTrends> {
    const now = new Date();
    const normalizedRange = range || 'this_year';
    const buckets = this.buildTrendBuckets(normalizedRange, now);
    const start = buckets[0]?.start ?? startOfMonth(now);
    const end = buckets[buckets.length - 1]?.end ?? startOfNextMonth(now);

    const [payments, bookings] = await Promise.all([
      prisma.booking.findMany({
        where: {
          paymentSummaryStatus: { in: [...REVENUE_PAYMENT_STATUSES] },
          paymentLastDate: {
            gte: start,
            lt: end,
          },
        },
        select: {
          paymentLastDate: true,
          paymentAmountPaid: true,
        },
      }),
      prisma.booking.findMany({
        where: {
          eventDate: {
            gte: start,
            lt: end,
          },
          status: {
            notIn: [BookingStatus.CANCELLED, BookingStatus.DECLINED, BookingStatus.EXPIRED],
          },
        },
        select: {
          eventDate: true,
          status: true,
        },
      }),
    ]);

    const revenue = buckets.map((bucket) => {
      return payments.reduce((total, payment) => {
        if (!payment.paymentLastDate) {
          return total;
        }

        return payment.paymentLastDate >= bucket.start && payment.paymentLastDate < bucket.end
          ? total + (payment.paymentAmountPaid ?? 0)
          : total;
      }, 0);
    });

    const confirmedBookings = buckets.map((bucket) => bookings.filter((booking) => (
      ACTIVE_EVENT_STATUSES.includes(booking.status as (typeof ACTIVE_EVENT_STATUSES)[number]) &&
      booking.eventDate >= bucket.start &&
      booking.eventDate < bucket.end
    )).length);

    const pendingBookings = buckets.map((bucket) => bookings.filter((booking) => (
      PENDING_BOOKING_STATUSES.includes(booking.status as (typeof PENDING_BOOKING_STATUSES)[number]) &&
      booking.eventDate >= bucket.start &&
      booking.eventDate < bucket.end
    )).length);

    return {
      range: normalizedRange,
      labels: buckets.map((bucket) => bucket.label),
      revenue,
      confirmed_bookings: confirmedBookings,
      pending_bookings: pendingBookings,
    };
  }

  static async getNeedsAction(actor: CurrentAdmin, limit = 20): Promise<DashboardNeedAction[]> {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    const nextThreeDays = addDays(today, 3);
    const nextSevenDays = addDays(today, 7);

    const [
      overduePayments,
      dueSoonPayments,
      failedEmails,
      failedWorkflows,
      conflicts,
      contracts,
      unansweredInquiries,
      ocularVisits,
      eventsWithoutCoordinator,
      unreadCriticalNotifications,
    ] = await Promise.all([
      prisma.booking.findMany({
        where: {
          paymentDueDate: { lt: today },
          OR: [
            { paymentSummaryStatus: { in: [...PENDING_PAYMENT_STATUSES] } },
            { paymentRemainingBalance: { gt: 0 } },
          ],
          status: { notIn: [BookingStatus.CANCELLED, BookingStatus.DECLINED, BookingStatus.EXPIRED] },
        },
        orderBy: { paymentDueDate: 'asc' },
        take: 5,
      }),
      prisma.booking.findMany({
        where: {
          paymentDueDate: {
            gte: today,
            lte: nextThreeDays,
          },
          OR: [
            { paymentSummaryStatus: { in: [...PENDING_PAYMENT_STATUSES] } },
            { paymentRemainingBalance: { gt: 0 } },
          ],
          status: { notIn: [BookingStatus.CANCELLED, BookingStatus.DECLINED, BookingStatus.EXPIRED] },
        },
        orderBy: { paymentDueDate: 'asc' },
        take: 5,
      }),
      prisma.emailLog.findMany({
        where: {
          status: { in: [EmailStatus.FAILED, EmailStatus.BOUNCED] },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.n8nWorkflowLog.findMany({
        where: {
          status: N8nWorkflowStatus.FAILED,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.booking.findMany({
        where: {
          syncStatus: SyncStatus.CONFLICT_DETECTED,
          status: { notIn: [BookingStatus.CANCELLED, BookingStatus.DECLINED, BookingStatus.EXPIRED] },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.booking.findMany({
        where: contractPendingWhere(),
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.inquiry.findMany({
        where: {
          status: {
            in: [
              InquiryStatus.NEW,
              InquiryStatus.PENDING_RESPONSE,
              InquiryStatus.FOLLOW_UP,
            ],
          },
        },
        orderBy: [{ priority: 'desc' }, { submittedAt: 'asc' }],
        take: 5,
      }),
      prisma.event.findMany({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
          eventType: { contains: 'ocular', mode: 'insensitive' },
        },
        orderBy: { date: 'asc' },
        take: 5,
      }),
      prisma.booking.findMany({
        where: {
          eventDate: {
            gte: today,
            lte: nextSevenDays,
          },
          status: { in: [...ACTIVE_EVENT_STATUSES] },
          assignedCoordinator: null,
        },
        orderBy: { eventDate: 'asc' },
        take: 5,
      }),
      prisma.notification.findMany({
        where: {
          ...notificationFilter(actor),
          isRead: false,
          priority: { in: [NotificationPriority.CRITICAL, NotificationPriority.HIGH] },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const actionItems: DashboardNeedAction[] = [
      ...overduePayments.map((booking) => ({
        id: `payment-overdue:${booking.id}`,
        type: 'payment_overdue',
        priority: 'critical' as const,
        title: 'Payment Overdue',
        description: `${booking.eventTitle} has a payment due date that has already passed.`,
        related_module: 'payments' as const,
        related_record_id: booking.paymentRecordId ?? booking.id,
        primary_action: 'View Payment',
        secondary_action: 'Send Reminder',
        href: hrefFor('payments', booking.paymentRecordId ?? booking.id),
        created_at: (booking.paymentDueDate ?? booking.updatedAt).toISOString(),
      })),
      ...dueSoonPayments.map((booking) => ({
        id: `payment-due:${booking.id}`,
        type: 'payment_due',
        priority: 'high' as const,
        title: 'Payment Due Soon',
        description: `${booking.eventTitle} has a payment due by ${booking.paymentDueDate ? formatShortDate(booking.paymentDueDate) : 'the recorded due date'}.`,
        related_module: 'payments' as const,
        related_record_id: booking.paymentRecordId ?? booking.id,
        primary_action: 'View Payment',
        secondary_action: 'Send Reminder',
        href: hrefFor('payments', booking.paymentRecordId ?? booking.id),
        created_at: (booking.paymentDueDate ?? booking.updatedAt).toISOString(),
      })),
      ...failedEmails.map((email) => ({
        id: `failed-email:${email.id}`,
        type: 'failed_email',
        priority: 'high' as const,
        title: 'Email Delivery Failed',
        description: `${email.subject} could not be delivered to ${email.recipientEmail}.`,
        related_module: 'email_logs' as const,
        related_record_id: email.id,
        primary_action: 'View Email Log',
        secondary_action: 'Resolve Fallback',
        href: hrefFor('email_logs', email.id),
        created_at: (email.failedAt ?? email.createdAt).toISOString(),
      })),
      ...failedWorkflows.map((workflow) => ({
        id: `failed-workflow:${workflow.id}`,
        type: 'workflow_failed',
        priority: 'high' as const,
        title: 'Workflow Failed',
        description: `${workflow.workflowName} failed${workflow.errorMessage ? `: ${workflow.errorMessage}` : '.'}`,
        related_module: 'workflow_logs' as const,
        related_record_id: workflow.id,
        primary_action: 'View Workflow Log',
        secondary_action: null,
        href: hrefFor('workflow_logs', workflow.id),
        created_at: (workflow.completedAt ?? workflow.createdAt).toISOString(),
      })),
      ...conflicts.map((booking) => ({
        id: `schedule-conflict:${booking.id}`,
        type: 'schedule_conflict',
        priority: 'critical' as const,
        title: 'Schedule Conflict',
        description: `${booking.eventTitle} has a detected calendar or booking conflict.`,
        related_module: 'bookings' as const,
        related_record_id: booking.id,
        primary_action: 'View Booking',
        secondary_action: null,
        href: hrefFor('bookings', booking.id),
        created_at: booking.updatedAt.toISOString(),
      })),
      ...contracts.map((booking) => ({
        id: `contract-pending:${booking.id}`,
        type: 'contract_pending',
        priority: 'medium' as const,
        title: 'Contract Pending',
        description: `${booking.eventTitle} has a contract status of ${booking.contractStatus ?? 'pending'}.`,
        related_module: 'contracts' as const,
        related_record_id: booking.contractRecordId ?? booking.id,
        primary_action: 'Review Contract',
        secondary_action: null,
        href: hrefFor('contracts', booking.contractRecordId ?? booking.id),
        created_at: booking.updatedAt.toISOString(),
      })),
      ...unansweredInquiries.map((inquiry) => ({
        id: `inquiry-unanswered:${inquiry.id}`,
        type: 'inquiry_unanswered',
        priority: inquiry.priority === InquiryPriority.HIGH
          ? 'high' as const
          : inquiry.status === InquiryStatus.FOLLOW_UP
            ? 'medium' as const
            : 'low' as const,
        title: 'Inquiry Unanswered',
        description: `${inquiry.fullName} has an inquiry awaiting a reply.`,
        related_module: 'inquiries' as const,
        related_record_id: inquiry.id,
        primary_action: 'Reply Now',
        secondary_action: null,
        href: hrefFor('inquiries', inquiry.id),
        created_at: inquiry.submittedAt.toISOString(),
      })),
      ...ocularVisits.map((event) => ({
        id: `ocular-today:${event.id}`,
        type: 'ocular_visit_today',
        priority: 'high' as const,
        title: 'Ocular Visit Today',
        description: `${event.title} is scheduled today${event.startTime ? ` at ${event.startTime}` : ''}.`,
        related_module: 'calendar' as const,
        related_record_id: event.id,
        primary_action: 'View Event',
        secondary_action: 'Acknowledge',
        href: hrefFor('calendar', event.id),
        created_at: event.date.toISOString(),
      })),
      ...eventsWithoutCoordinator.map((booking) => ({
        id: `coordinator-missing:${booking.id}`,
        type: 'event_without_coordinator',
        priority: 'medium' as const,
        title: 'Event Without Coordinator',
        description: `${booking.eventTitle} is upcoming and has no assigned coordinator.`,
        related_module: 'bookings' as const,
        related_record_id: booking.id,
        primary_action: 'View Booking',
        secondary_action: null,
        href: hrefFor('bookings', booking.id),
        created_at: booking.updatedAt.toISOString(),
      })),
      ...unreadCriticalNotifications.map((notification) => ({
        id: `notification:${notification.id}`,
        type: notification.type.toLowerCase(),
        priority: normalizePriority(notification.priority),
        title: notification.title,
        description: notification.message,
        related_module: 'notifications' as const,
        related_record_id: notification.id,
        primary_action: 'Acknowledge',
        secondary_action: notification.relatedModule ? 'Open Record' : null,
        href: hrefFor(notification.relatedModule, notification.relatedRecordId),
        created_at: notification.createdAt.toISOString(),
      })),
    ];

    return actionItems
      .sort((a, b) => {
        const priorityWeight = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityWeight[a.priority] - priorityWeight[b.priority] ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, limit);
  }

  static async getCalendar(month: string, actor: CurrentAdmin): Promise<DashboardCalendar> {
    const parsedMonth = /^\d{4}-\d{2}$/.test(month)
      ? new Date(`${month}-01T00:00:00`)
      : startOfMonth(new Date());
    const monthKey = toMonthKey(parsedMonth);
    const start = startOfMonth(parsedMonth);
    const end = startOfNextMonth(parsedMonth);

    const [bookings, paymentDeadlines, tasks, events] = await Promise.all([
      prisma.booking.findMany({
        where: {
          eventDate: {
            gte: start,
            lt: end,
          },
          status: {
            notIn: [BookingStatus.CANCELLED, BookingStatus.DECLINED, BookingStatus.EXPIRED],
          },
        },
        orderBy: { eventDate: 'asc' },
      }),
      prisma.booking.findMany({
        where: {
          paymentDueDate: {
            gte: start,
            lt: end,
          },
          OR: [
            { paymentSummaryStatus: { in: [...PENDING_PAYMENT_STATUSES] } },
            { paymentRemainingBalance: { gt: 0 } },
          ],
        },
        orderBy: { paymentDueDate: 'asc' },
      }),
      prisma.dashboardTask.findMany({
        where: {
          ...actorTaskFilter(actor),
          taskDate: {
            gte: start,
            lt: end,
          },
          status: { not: DashboardTaskStatus.CANCELLED },
        },
        orderBy: [{ taskDate: 'asc' }, { taskTime: 'asc' }],
      }),
      prisma.event.findMany({
        where: {
          date: {
            gte: start,
            lt: end,
          },
          bookingId: null,
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    const items: DashboardCalendarItem[] = [
      ...bookings.map((booking) => ({
        id: `booking:${booking.id}`,
        date: toDateOnly(booking.eventDate),
        type: 'event',
        title: booking.eventTitle,
        time: booking.startTime,
        related_module: 'bookings' as const,
        related_record_id: booking.id,
        status: booking.status.toLowerCase(),
      })),
      ...paymentDeadlines.map((booking) => ({
        id: `payment:${booking.id}`,
        date: toDateOnly(booking.paymentDueDate as Date),
        type: 'payment_due',
        title: `${booking.eventTitle} payment due`,
        time: null,
        related_module: 'payments' as const,
        related_record_id: booking.paymentRecordId ?? booking.id,
        status: booking.paymentSummaryStatus.toLowerCase(),
      })),
      ...tasks.map((task) => ({
        id: `task:${task.id}`,
        date: toDateOnly(task.taskDate),
        type: 'task',
        title: task.title,
        time: task.taskTime,
        related_module: 'tasks' as const,
        related_record_id: task.id,
        status: taskStatusForDate(task).toLowerCase(),
        priority: task.priority.toLowerCase(),
      })),
      ...events.map((event) => ({
        id: `event:${event.id}`,
        date: toDateOnly(event.date),
        type: event.eventType.toLowerCase().replace(/\s+/g, '_'),
        title: event.title,
        time: event.startTime,
        related_module: 'calendar' as const,
        related_record_id: event.id,
        status: event.status.toLowerCase(),
      })),
    ];

    return {
      month: monthKey,
      items: items.sort((a, b) => (
        a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '')
      )),
    };
  }

  static async getAgenda(date: string, actor: CurrentAdmin): Promise<DashboardAgendaItem[]> {
    const target = date === 'today' || !date
      ? startOfDay(new Date())
      : parseDateInput(date, 'date');
    const start = startOfDay(target);
    const end = addDays(start, 1);

    const [dashboardTasks, calendarTasks] = await Promise.all([
      prisma.dashboardTask.findMany({
        where: {
          ...actorTaskFilter(actor),
          taskDate: {
            gte: start,
            lt: end,
          },
          status: { not: DashboardTaskStatus.CANCELLED },
        },
        orderBy: [{ orderIndex: 'asc' }, { taskTime: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.task.findMany({
        where: {
          OR: [
            { dueDate: { gte: start, lt: end } },
            { startDate: { gte: start, lt: end } },
          ],
        },
        orderBy: [{ dueTime: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);
    const orderedDashboardTasks = sortDashboardTasksForDisplay(dashboardTasks);

    return [
      ...orderedDashboardTasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        date: toDateOnly(task.taskDate),
        time: task.taskTime,
        related_module: task.relatedModule,
        related_record_id: task.relatedRecordId,
        priority: task.priority.toLowerCase(),
        status: taskStatusForDate(task).toLowerCase(),
        assigned_admin: task.assignedTo,
        assigned_role: task.assignedToRole,
        booking_reference: task.bookingReference,
        category: task.category,
        created_source: task.source.toLowerCase(),
        workflow_execution_id: task.workflowExecutionId,
        order_index: task.orderIndex,
        task_template_key: task.taskTemplateKey,
        activation_status: task.activationStatus,
        is_active: task.isActive,
        is_editable: task.isEditable,
        can_complete: task.isActive && task.status !== DashboardTaskStatus.COMPLETED,
      })),
      ...calendarTasks.map((task) => ({
        id: `calendar-task:${task.id}`,
        title: task.title,
        description: task.details,
        date: toDateOnly(task.dueDate ?? task.startDate ?? target),
        time: task.dueTime,
        related_module: 'calendar',
        related_record_id: task.id,
        priority: 'medium',
        status: task.completed ? 'completed' : 'pending',
        assigned_admin: null,
        assigned_role: null,
        booking_reference: null,
        category: null,
        created_source: 'calendar',
        workflow_execution_id: null,
        order_index: 0,
        task_template_key: null,
        activation_status: 'active',
        is_active: true,
        is_editable: true,
        can_complete: false,
      })),
    ];
  }

  static async getUpcomingEvents(limit = 5): Promise<DashboardUpcomingEvent[]> {
    const today = startOfDay(new Date());
    const inThirtyDays = addDays(today, 30);

    const bookings = await prisma.booking.findMany({
      where: {
        eventDate: {
          gte: today,
          lte: inThirtyDays,
        },
        status: {
          in: [
            BookingStatus.CONFIRMED,
            BookingStatus.PENDING,
            BookingStatus.RESCHEDULED,
            BookingStatus.IN_PROGRESS,
          ],
        },
      },
      orderBy: { eventDate: 'asc' },
      take: limit,
    });

    return bookings.map((booking) => ({
      id: booking.id,
      title: booking.eventTitle,
      event_date: booking.eventDate.toISOString(),
      event_time: booking.startTime,
      event_type: booking.eventCategoryName ?? booking.eventType,
      client_name: booking.clientName,
      status: booking.status.toLowerCase(),
      assigned_coordinator: booking.assignedCoordinator,
      payment_status: booking.paymentSummaryStatus.toLowerCase(),
      href: hrefFor('bookings', booking.id),
    }));
  }

  static async getRecentActivity(limit = 10): Promise<DashboardRecentActivity[]> {
    const [auditLogs, failedEmails, workflowLogs] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
        select: {
          id: true,
          action: true,
          module: true,
          description: true,
          status: true,
          timestamp: true,
        },
      }),
      prisma.emailLog.findMany({
        where: { status: { in: [EmailStatus.FAILED, EmailStatus.BOUNCED] } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          subject: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.n8nWorkflowLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          workflowName: true,
          status: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
    ]);

    return [
      ...auditLogs.map((log) => ({
        id: `audit:${log.id}`,
        type: 'audit',
        title: `${log.module} ${log.action.toLowerCase()}`,
        description: log.description,
        status: log.status.toLowerCase(),
        created_at: log.timestamp.toISOString(),
        href: hrefFor('audit', log.id),
      })),
      ...failedEmails.map((email) => ({
        id: `email:${email.id}`,
        type: 'email',
        title: 'Email issue',
        description: `${email.subject} is ${email.status.toLowerCase()}.`,
        status: email.status.toLowerCase(),
        created_at: email.createdAt.toISOString(),
        href: hrefFor('email_logs', email.id),
      })),
      ...workflowLogs.map((workflow) => ({
        id: `workflow:${workflow.id}`,
        type: 'workflow',
        title: workflow.workflowName,
        description: workflow.errorMessage ?? `Workflow status is ${workflow.status.toLowerCase()}.`,
        status: workflow.status.toLowerCase(),
        created_at: workflow.createdAt.toISOString(),
        href: hrefFor('workflow_logs', workflow.id),
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  static async getWorkflowHealth(): Promise<DashboardWorkflowHealth> {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);

    const [
      successfulWorkflows,
      failedWorkflows,
      failedEmails,
      pendingRetries,
      lastWorkflow,
    ] = await Promise.all([
      prisma.n8nWorkflowLog.count({
        where: {
          status: N8nWorkflowStatus.SUCCESS,
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.n8nWorkflowLog.count({
        where: {
          status: N8nWorkflowStatus.FAILED,
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
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
      prisma.n8nWorkflowLog.findFirst({
        orderBy: [
          { completedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        select: {
          completedAt: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      successful_workflows_today: successfulWorkflows,
      failed_workflows_today: failedWorkflows,
      failed_emails_today: failedEmails,
      pending_retries: pendingRetries,
      last_workflow_run_at: (lastWorkflow?.completedAt ?? lastWorkflow?.createdAt)?.toISOString() ?? null,
    };
  }

  static async getNotifications(
    actor: CurrentAdmin,
    limit = 10,
  ): Promise<DashboardNotification[]> {
    const notifications = await prisma.notification.findMany({
      where: notificationFilter(actor),
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });

    return notifications.map(notificationToDto);
  }

  static async createAgendaTask(input: DashboardAgendaInput, actor: CurrentAdmin) {
    const title = requiredText(input.title, 'title');
    const taskDate = parseDateInput(input.date, 'date');
    const task = await prisma.dashboardTask.create({
      data: {
        title,
        description: trimText(input.description),
        taskDate,
        taskTime: trimText(input.time),
        priority: parseEnumValue(
          typeof input.priority === 'string' ? input.priority.toUpperCase() : input.priority,
          Object.values(DashboardTaskPriority),
          DashboardTaskPriority.MEDIUM,
        ),
        assignedTo: trimText(input.assignedTo),
        relatedModule: trimText(input.relatedModule),
        relatedRecordId: trimText(input.relatedRecordId),
        reminderOption: trimText(input.reminderOption),
        source: parseEnumValue(
          typeof input.source === 'string' ? input.source.toUpperCase() : input.source,
          Object.values(DashboardTaskSource),
          DashboardTaskSource.MANUAL,
        ),
        createdBy: actor.id,
      },
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.CREATE,
      module: 'Dashboard',
      description: `Created dashboard agenda task "${task.title}".`,
      status: AuditStatus.SUCCESS,
      newValues: {
        taskId: task.id,
        title: task.title,
        taskDate: task.taskDate.toISOString(),
      },
    });

    return task;
  }

  static async updateAgendaTask(id: string, input: DashboardAgendaInput, actor: CurrentAdmin) {
    const previous = await prisma.dashboardTask.findUnique({ where: { id } });

    if (!previous) {
      throw new DashboardServiceError('Agenda task not found.', 404);
    }

    const data: Prisma.DashboardTaskUpdateInput = {};

    if ('title' in input) data.title = requiredText(input.title, 'title');
    if ('description' in input) data.description = trimText(input.description);
    if ('date' in input) data.taskDate = parseDateInput(input.date, 'date');
    if ('time' in input) data.taskTime = trimText(input.time);
    if ('assignedTo' in input) data.assignedTo = trimText(input.assignedTo);
    if ('relatedModule' in input) data.relatedModule = trimText(input.relatedModule);
    if ('relatedRecordId' in input) data.relatedRecordId = trimText(input.relatedRecordId);
    if ('reminderOption' in input) data.reminderOption = trimText(input.reminderOption);
    if ('priority' in input) {
      data.priority = parseEnumValue(
        typeof input.priority === 'string' ? input.priority.toUpperCase() : input.priority,
        Object.values(DashboardTaskPriority),
        previous.priority,
      );
    }

    const next = await prisma.dashboardTask.update({
      where: { id },
      data,
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.UPDATE,
      module: 'Dashboard',
      description: `Updated dashboard agenda task "${next.title}".`,
      status: AuditStatus.SUCCESS,
      previousValues: {
        taskId: previous.id,
        title: previous.title,
        status: previous.status,
      },
      newValues: {
        taskId: next.id,
        title: next.title,
        status: next.status,
      },
    });

    return next;
  }

  static async completeAgendaTask(id: string, actor: CurrentAdmin) {
    const previous = await prisma.dashboardTask.findUnique({ where: { id } });

    if (!previous) {
      throw new DashboardServiceError('Agenda task not found.', 404);
    }

    const result = await prisma.$transaction(async (transaction) => {
      const task = await transaction.dashboardTask.update({
        where: { id },
        data: {
          status: DashboardTaskStatus.COMPLETED,
          completedAt: new Date(),
          completedBy: actor.id,
        },
      });
      let completedBooking: {
        id: string;
        bookingReference: string;
        bookingSource: string;
        n8nExecutionId: string | null;
      } | null = null;

      if (
        task.relatedModule === 'bookings' &&
        task.relatedRecordId &&
        task.source === DashboardTaskSource.N8N_WORKFLOW
      ) {
        const booking = await transaction.booking.findUnique({
          where: { id: task.relatedRecordId },
          select: {
            id: true,
            bookingReference: true,
            bookingSource: true,
            status: true,
            n8nExecutionId: true,
          },
        });

        if (
          booking &&
          booking.status !== BookingStatus.COMPLETED &&
          isBookingApprovedOrActive(booking.status)
        ) {
          const activeTasks = await transaction.dashboardTask.findMany({
            where: {
              relatedModule: 'bookings',
              relatedRecordId: booking.id,
              source: DashboardTaskSource.N8N_WORKFLOW,
              isActive: true,
              status: { not: DashboardTaskStatus.CANCELLED },
            },
            select: {
              id: true,
              status: true,
            },
          });
          const allActiveTasksCompleted = activeTasks.length > 0 &&
            activeTasks.every((item) => item.status === DashboardTaskStatus.COMPLETED);

          if (allActiveTasksCompleted) {
            const nextBooking = await transaction.booking.update({
              where: { id: booking.id },
              data: {
                status: BookingStatus.COMPLETED,
                automationStatus: AutomationStatus.COMPLETED,
                statusChangedAt: new Date(),
                statusChangedBy: actor.id,
                statusChangeReason: 'All activated admin tasks were completed.',
                lastWorkflowResult: 'Booking workflow completed after all activated admin tasks were completed.',
                lastSyncedAt: new Date(),
              },
              select: {
                id: true,
                bookingReference: true,
                bookingSource: true,
                n8nExecutionId: true,
              },
            });

            await transaction.bookingTimeline.create({
              data: {
                bookingId: booking.id,
                action: 'Booking Workflow Completed',
                source: 'System',
                performedBy: 'System',
                description: `All activated admin tasks were completed for booking ${booking.bookingReference}.`,
                metadata: {
                  completedTaskCount: activeTasks.length,
                },
              },
            });

            completedBooking = nextBooking;
          }
        }
      }

      return { task, completedBooking };
    });
    const { task, completedBooking } = result;

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.UPDATE,
      module: 'Dashboard',
      description: `Completed dashboard agenda task "${task.title}".`,
      status: AuditStatus.SUCCESS,
      previousValues: {
        taskId: previous.id,
        status: previous.status,
      },
      newValues: {
        taskId: task.id,
        status: task.status,
        completedAt: task.completedAt?.toISOString(),
      },
    });

    if (completedBooking) {
      await createAuditLog({
        ...auditActor(actor),
        action: AuditAction.UPDATE,
        module: 'Bookings',
        description: `Completed booking workflow for ${completedBooking.bookingReference}.`,
        status: AuditStatus.SUCCESS,
        metadata: {
          bookingId: completedBooking.id,
          bookingReference: completedBooking.bookingReference,
          n8nExecutionId: completedBooking.n8nExecutionId,
        },
      });
    }

    return task;
  }

  static async deleteAgendaTask(id: string, actor: CurrentAdmin) {
    const previous = await prisma.dashboardTask.findUnique({ where: { id } });

    if (!previous) {
      throw new DashboardServiceError('Agenda task not found.', 404);
    }

    await prisma.dashboardTask.delete({ where: { id } });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.DELETE,
      module: 'Dashboard',
      description: `Deleted dashboard agenda task "${previous.title}".`,
      status: AuditStatus.SUCCESS,
      previousValues: {
        taskId: previous.id,
        title: previous.title,
      },
    });
  }

  static async acknowledgeAlert(id: string, actor: CurrentAdmin) {
    const notificationId = id.startsWith('notification:')
      ? id.replace('notification:', '')
      : id;
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        ...notificationFilter(actor),
      },
    });

    if (!notification) {
      throw new DashboardServiceError('Alert can only be acknowledged after it is saved as a notification.', 404);
    }

    await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.UPDATE,
      module: 'Dashboard',
      description: `Acknowledged dashboard alert "${notification.title}".`,
      status: AuditStatus.SUCCESS,
      newValues: {
        notificationId: notification.id,
        isRead: true,
      },
    });
  }

  static async createWorkflowLog(input: WorkflowLogInput) {
    const workflowName = requiredText(input.workflowName, 'workflowName');
    const status = parseEnumValue(
      typeof input.status === 'string' ? input.status.toUpperCase() : input.status,
      Object.values(N8nWorkflowStatus),
      N8nWorkflowStatus.PROCESSING,
    );
    const startedAt = parseOptionalDateInput(input.startedAt, 'startedAt');
    const completedAt = parseOptionalDateInput(input.completedAt, 'completedAt');
    const workflowLog = await prisma.n8nWorkflowLog.create({
      data: {
        workflowName,
        workflowExecutionId: trimText(input.workflowExecutionId),
        relatedModule: trimText(input.relatedModule),
        relatedRecordId: trimText(input.relatedRecordId),
        triggerSource: trimText(input.triggerSource),
        requestPayload: parseOptionalJson(input.requestPayload),
        responsePayload: parseOptionalJson(input.responsePayload),
        status,
        errorMessage: trimText(input.errorMessage),
        startedAt,
        completedAt: completedAt ?? (status === N8nWorkflowStatus.SUCCESS || status === N8nWorkflowStatus.FAILED ? new Date() : null),
      },
    });

    await createAuditLog({
      ...systemAuditActor(),
      action: status === N8nWorkflowStatus.FAILED ? AuditAction.ERROR : AuditAction.SUBMISSION,
      module: 'Dashboard',
      description: `Saved n8n workflow log for ${workflowLog.workflowName}.`,
      status: status === N8nWorkflowStatus.FAILED ? AuditStatus.FAILED : AuditStatus.SUCCESS,
      metadata: {
        workflowLogId: workflowLog.id,
        workflowExecutionId: workflowLog.workflowExecutionId,
        relatedModule: workflowLog.relatedModule,
        relatedRecordId: workflowLog.relatedRecordId,
      },
    });

    return workflowLog;
  }

  static async createTaskFromOrchestration(input: DashboardAgendaInput) {
    const task = await prisma.dashboardTask.create({
      data: {
        title: requiredText(input.title, 'title'),
        description: trimText(input.description),
        taskDate: parseDateInput(input.date, 'date'),
        taskTime: trimText(input.time),
        priority: parseEnumValue(
          typeof input.priority === 'string' ? input.priority.toUpperCase() : input.priority,
          Object.values(DashboardTaskPriority),
          DashboardTaskPriority.MEDIUM,
        ),
        assignedTo: trimText(input.assignedTo),
        relatedModule: trimText(input.relatedModule),
        relatedRecordId: trimText(input.relatedRecordId),
        reminderOption: trimText(input.reminderOption),
        source: DashboardTaskSource.N8N_WORKFLOW,
        createdBy: trimText(input.source) ?? 'n8n',
      },
    });

    await createAuditLog({
      ...systemAuditActor(),
      action: AuditAction.CREATE,
      module: 'Dashboard',
      description: `n8n created dashboard agenda task "${task.title}".`,
      status: AuditStatus.SUCCESS,
      metadata: {
        taskId: task.id,
        relatedModule: task.relatedModule,
        relatedRecordId: task.relatedRecordId,
      },
    });

    return task;
  }

  static async bulkCreateAdminTodoList(
    input: AdminTodoBulkCreateInput,
  ): Promise<AdminTodoBulkCreateResult> {
    const relatedModule = normalizeTaskRelatedModule(input.relatedModule);
    const relatedRecordId = requiredText(input.relatedRecordId, 'relatedRecordId');
    const bookingReference = requiredText(input.bookingReference, 'bookingReference');
    const source = requiredText(input.source, 'source').toLowerCase();
    const workflowName = requiredText(input.workflowName, 'workflowName');
    const workflowExecutionId = requiredText(input.workflowExecutionId, 'workflowExecutionId');
    const tasks = uniqueAdminTodoTasks(parseAdminTodoTasks(input.tasks));
    const categorization = input.categorization &&
      typeof input.categorization === 'object' &&
      !Array.isArray(input.categorization)
      ? input.categorization as Record<string, unknown>
      : {};
    const bulkTaskTemplateKey = trimText(categorization.taskTemplateKey);

    if (source !== 'n8n_workflow') {
      throw new DashboardServiceError('source must be n8n_workflow.');
    }

    if (workflowName !== 'Zion - New Booking Orchestration') {
      throw new DashboardServiceError('workflowName is invalid.');
    }

    const booking = await prisma.booking.findUnique({
      where: {
        id: relatedRecordId,
      },
      select: {
        id: true,
        bookingReference: true,
        status: true,
      },
    });

    if (!booking) {
      throw new DashboardServiceError('Booking not found.', 404);
    }

    const resolvedBookingReference = booking.bookingReference || bookingReference;
    const shouldActivateTasks = booking.status === BookingStatus.CONFIRMED ||
      booking.status === BookingStatus.IN_PROGRESS;
    const taskTitles = tasks.map((task) => task.title);
    const existingTasks = await prisma.$queryRaw<Array<{
      title: string;
      orderIndex: number;
      taskTemplateKey: string | null;
    }>>`
      SELECT
        "title",
        "order_index" AS "orderIndex",
        "task_template_key" AS "taskTemplateKey"
      FROM "dashboard_tasks"
      WHERE "related_record_id" = ${relatedRecordId}
        AND "workflow_execution_id" = ${workflowExecutionId}
        AND "title" IN (${Prisma.join(taskTitles)})
    `;

    const existingKeys = new Set(existingTasks.map((task) => (
      `${task.title.toLowerCase()}|${task.orderIndex}|${task.taskTemplateKey ?? ''}`
    )));
    const tasksToCreate = tasks.filter((task) => {
      const taskTemplateKey = task.taskTemplateKey ?? bulkTaskTemplateKey;
      const key = `${task.title.toLowerCase()}|${task.orderIndex}|${taskTemplateKey ?? ''}`;

      return !existingKeys.has(key);
    });

    if (tasksToCreate.length === 0) {
      return {
        bookingReference: resolvedBookingReference,
        createdCount: 0,
        taskIds: [],
      };
    }

    const createdTaskIds = await prisma.$transaction(async (transaction) => {
      const taskIds: string[] = [];

      for (const task of tasksToCreate) {
        const taskId = randomUUID();
        const taskTemplateKey = task.taskTemplateKey ?? bulkTaskTemplateKey;
        const activationStatus = shouldActivateTasks ? 'active' : 'pending_booking_approval';
        const isActive = shouldActivateTasks ? true : false;
        const startedAt = shouldActivateTasks ? new Date() : null;
        const rows = await transaction.$queryRaw<Array<{ id: string }>>`
        INSERT INTO "dashboard_tasks" (
          "id",
          "title",
          "description",
          "task_date",
          "task_time",
          "priority",
          "status",
          "assigned_to",
          "assigned_to_role",
          "related_module",
          "related_record_id",
          "booking_reference",
          "category",
          "source",
          "workflow_name",
          "workflow_execution_id",
          "order_index",
          "task_template_key",
          "activation_status",
          "is_active",
          "is_editable",
          "started_at",
          "reminder_option",
          "created_by",
          "created_at",
          "updated_at"
        )
        VALUES (
          ${taskId},
          ${task.title},
          ${task.description},
          ${task.dueDate},
          ${null},
          ${task.priority}::"DashboardTaskPriority",
          ${task.status}::"DashboardTaskStatus",
          ${task.assignedToRole},
          ${task.assignedToRole},
          ${relatedModule},
          ${relatedRecordId},
          ${resolvedBookingReference},
          ${task.category},
          ${DashboardTaskSource.N8N_WORKFLOW}::"DashboardTaskSource",
          ${workflowName},
          ${workflowExecutionId},
          ${task.orderIndex},
          ${taskTemplateKey},
          ${activationStatus},
          ${isActive},
          ${task.isEditable},
          ${startedAt},
          ${taskTemplateKey ?? task.category},
          ${source},
          NOW(),
          NOW()
        )
        ON CONFLICT ("related_record_id", "workflow_execution_id", "title") DO NOTHING
        RETURNING "id"
      `;

        taskIds.push(...rows.map((row) => row.id));
      }

      if (taskIds.length > 0) {
        await transaction.bookingTimeline.create({
          data: {
            bookingId: booking.id,
            action: 'Admin To-Do List Created',
            source: 'n8n Workflow',
            performedBy: workflowName,
            description: `Admin To-Do list created for booking ${resolvedBookingReference}.`,
            metadata: {
              workflowExecutionId,
              taskCount: taskIds.length,
              taskIds,
              activationStatus: shouldActivateTasks ? 'active' : 'pending_booking_approval',
              taskTemplateKey: bulkTaskTemplateKey,
            },
          },
        });
      }

      return taskIds;
    });
    const createdCount = createdTaskIds.length;

    if (createdCount > 0) {
      await createAuditLog({
        ...systemAuditActor(),
        action: AuditAction.CREATE,
        module: 'Dashboard',
        description: `Created admin To-Do list for booking ${resolvedBookingReference}.`,
        status: AuditStatus.SUCCESS,
        metadata: {
          module: 'admin_tasks',
          action: 'admin_todo_list_created',
          bookingReference: resolvedBookingReference,
          taskCount: createdCount,
          source: 'n8n_workflow',
          workflowName,
          workflowExecutionId,
          relatedRecordId,
          taskIds: createdTaskIds,
        },
      });
    }

    return {
      bookingReference: resolvedBookingReference,
      createdCount,
      taskIds: createdTaskIds,
    };
  }

  static async createNotification(input: NotificationInput) {
    const notificationType = parseNotificationType(input.type);
    const relatedModule = normalizeNotificationModule(input.relatedModule);
    const relatedRecordId = trimText(input.relatedRecordId);

    if (
      trimText(input.type)?.toUpperCase() === 'NEW_BOOKING_TASK_LIST_CREATED' &&
      relatedRecordId
    ) {
      const taskCount = await prisma.dashboardTask.count({
        where: {
          relatedModule: 'bookings',
          relatedRecordId,
          source: DashboardTaskSource.N8N_WORKFLOW,
        },
      });

      if (taskCount === 0) {
        throw new DashboardServiceError(
          'Booking task list notification requires existing n8n tasks.',
          409,
        );
      }
    }

    const notification = await prisma.notification.create({
      data: {
        title: requiredText(input.title, 'title'),
        message: requiredText(input.message, 'message'),
        type: notificationType,
        priority: parseEnumValue(
          typeof input.priority === 'string' ? input.priority.toUpperCase() : input.priority,
          Object.values(NotificationPriority),
          NotificationPriority.MEDIUM,
        ),
        relatedModule,
        relatedRecordId,
        createdFor: trimText(input.createdFor),
        createdBy: trimText(input.createdBy) ?? 'n8n',
        source: trimText(input.source) ?? 'n8n_workflow',
      },
    });

    await createAuditLog({
      ...systemAuditActor(),
      action: AuditAction.CREATE,
      module: 'Dashboard',
      description: `Created dashboard notification "${notification.title}".`,
      status: AuditStatus.SUCCESS,
      metadata: {
        notificationId: notification.id,
        relatedModule: notification.relatedModule,
        relatedRecordId: notification.relatedRecordId,
      },
    });

    return notification;
  }

  private static async getNeedsActionCount() {
    const actionItems = await this.getNeedsAction({
      id: '',
      username: 'system',
      email: '',
      profileImage: null,
      role: Role.SUPERADMIN,
    });

    return actionItems.length;
  }

  private static buildTrendBuckets(range: string, now: Date) {
    if (range === 'last_7_days') {
      return Array.from({ length: 7 }, (_, index) => {
        const day = startOfDay(addDays(now, index - 6));
        return {
          label: formatDayLabel(day),
          start: day,
          end: addDays(day, 1),
        };
      });
    }

    const length = range === 'last_3_months'
      ? 3
      : range === 'last_6_months'
        ? 6
        : range === 'this_month'
          ? 1
          : 12;
    const lastBucket = range === 'this_year'
      ? new Date(now.getFullYear(), 11, 1)
      : startOfMonth(now);
    const firstBucket = addMonths(lastBucket, -(length - 1));

    return Array.from({ length }, (_, index) => {
      const monthStart = addMonths(firstBucket, index);
      return {
        label: formatMonthLabel(monthStart),
        start: monthStart,
        end: startOfNextMonth(monthStart),
      };
    });
  }
}
