import 'server-only';

import { timingSafeEqual } from 'node:crypto';
import {
  AuditAction,
  AuditStatus,
  AutomationStatus,
  BookingOrchestrationContext,
  BookingSource,
  BookingStatus,
  DashboardTaskSource,
  EmailStatus,
  EmailType,
  EventStatus,
  N8nWorkflowStatus,
  NotificationPriority,
  NotificationType,
  PaymentSummaryStatus,
  Prisma,
  RelatedModule,
  Role,
  SyncStatus,
  TriggerSource,
} from '@prisma/client';
import { createAuditLog } from '@/lib/audit';
import { assertClientBookingDateAvailable } from '@/lib/client-calendar-availability';

import type { CurrentAdmin } from '@/lib/authorization';
import {
  assertConflictOverride,
  BookingRequestError,
  findBookingConflicts,
  parseBookingDate,
  validateStatusTransition,
  validateTimeRange,
} from '@/lib/booking-validation';
import { prisma } from '@/lib/prisma';
import { taskTemplateKeyForCategory } from '@/services/event-category';
import {
  recordTemplateFallback,
  resolvePublishedTaskTemplate,
} from '@/services/task-template';
import { attachPackageSnapshotToBooking } from '@/lib/services-packages';
import {
  buildBookingReceiptEmail,
  type BookingReceiptEmailPayload,
} from './receipt-email';
import {
  categorizeBooking,
  type BookingCategorizationInput,
  type BookingCategorizationResult,
} from './booking-categorization.service';
import { enforceOrchestrationRateLimit } from './orchestration-rate-limit.service';

type JsonObject = Record<string, unknown>;

export type BookingActor = {
  id: string | null;
  name: string;
  role: string;
  source: 'Admin' | 'System' | 'n8n Workflow' | 'Payment Management' | 'Contract Management';
};

export type BookingUpsertInput = {
  bookingReference?: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  eventTitle: string;
  eventType: string;
  eventDate: string | Date;
  startTime?: string | null;
  endTime?: string | null;
  venue: string;
  guestCount?: number;
  packageId?: string | null;
  packageVersion?: number | null;
  packageSelected?: string | null;
  theme?: string | null;
  colors?: string | null;
  specialRequests?: string | null;
  assignedCoordinator?: string | null;
  bookingSource?: BookingSource;
  n8nWorkflowId?: string | null;
  n8nExecutionId?: string | null;
};

export type ManualBookingInput = BookingUpsertInput & {
  internalNotes?: string | null;
  conflictOverrideReason?: string | null;
};

export type ClientBookingInput = {
  clientName?: unknown;
  clientEmail?: unknown;
  clientPhone?: unknown;
  clientAddress?: unknown;
  facebook?: unknown;
  preferredContactMethod?: unknown;
  eventType?: unknown;
  eventTitle?: unknown;
  eventCategoryId?: unknown;
  eventCategorySlug?: unknown;
  eventDate?: unknown;
  preferredTime?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  alternativeDate?: unknown;
  guestCount?: unknown;
  packageId?: unknown;
  packageVersion?: unknown;
  packageSelected?: unknown;
  theme?: unknown;
  budget?: unknown;
  addOns?: unknown;
  specialRequests?: unknown;
};

export type BookingEditInput = Partial<Omit<
  ManualBookingInput,
  'bookingReference' | 'bookingSource' | 'n8nWorkflowId' | 'n8nExecutionId'
>> & {
  conflictOverrideReason?: string | null;
};

export type PaymentSyncInput = {
  bookingReference: string;
  paymentRecordId?: string | null;
  paymentSummaryStatus: PaymentSummaryStatus;
  totalAmount?: number | null;
  amountPaid?: number | null;
  remainingBalance?: number | null;
  dueDate?: string | Date | null;
  lastPaymentDate?: string | Date | null;
  paymentReference?: string | null;
};

export type WorkflowResultInput = {
  bookingReference: string;
  automationStatus: AutomationStatus;
  workflowResult?: string | null;
  n8nWorkflowId?: string | null;
  n8nExecutionId?: string | null;
};

export type EmailResultInput = {
  bookingReference: string;
  emailType: EmailType;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  status: EmailStatus;
  workflowName?: string | null;
  n8nExecutionId?: string | null;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  failureReason?: string | null;
};

export type BookingEmailStatusUpdateInput = {
  bookingId: string;
  bookingReference: string;
  emailStatus: unknown;
  emailType: unknown;
  lastEmailSentAt?: unknown;
  workflowExecutionId: unknown;
  emailLogReference?: unknown;
};

export type BookingEmailStatusUpdateResult = {
  id: string;
  bookingReference: string;
  emailStatus: string;
  emailType: string;
  lastEmailSentAt: string | null;
};

export type TimelineEntryInput = {
  bookingId: string;
  action: string;
  source: string;
  performedBy: string;
  description: string;
  metadata?: JsonObject | null;
};

type BookingCreatedWorkflowBooking = {
  id?: string | null;
  bookingReference?: string | null;
  eventType?: string | null;
  categorization?: BookingCategorizationResult | null;
};

type ValidBookingCreatedWorkflowBooking = {
  id: string;
  bookingReference: string;
  eventType: string;
  categorization: BookingCategorizationResult;
};

type BookingWebhookPayload = {
  booking_id: string;
  booking_reference: string;
  event_type: string;
  triggered_at: string;
  categorization: BookingCategorizationResult;
};

export type OrchestrationBookingDetails = {
  booking_id: string;
  booking_reference: string;
  client_name: string;
  client_email: string | null;
  client_contact: string | null;
  event_type: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  guest_count: number;
  package_name: string | null;
  package_price: number;
  down_payment: number;
  remaining_balance: number;
  theme: string | null;
  colors: string | null;
  special_requests: string | null;
  booking_status: string;
  receipt_link: string;
};

export type OrchestrationBookingDetailsResponse = {
  booking: OrchestrationBookingDetails;
  categorization: BookingCategorizationResult | null;
};

export type OrchestrationBookingReceiptEmail = {
  booking: OrchestrationBookingDetails;
  categorization: BookingCategorizationResult | null;
  email: BookingReceiptEmailPayload;
};

type BookingDetailsRecord = Prisma.BookingGetPayload<{
  include: {
    package: {
      select: {
        packageName: true;
        price: true;
        reservationFee: true;
        downPaymentAmount: true;
      };
    };
    packageSnapshot: {
      select: {
        snapshotData: true;
      };
    };
    paymentRecord: {
      select: {
        totalAmount: true;
        amountPaid: true;
        remainingBalance: true;
        packageName: true;
      };
    };
    orchestrationContext: true;
  };
}>;

const BOOKING_CREATED_WORKFLOW_NAME = 'Zion - New Booking Orchestration';
const BOOKING_CREATED_EVENT = 'booking.created';
const DEFAULT_N8N_WEBHOOK_TIMEOUT_MS = 8000;
const PRODUCTION_BOOKING_SOURCES: readonly BookingSource[] = Object.values(BookingSource).filter(
  (source) => source !== BookingSource.DEMO_CLIENT_ADMIN_BRIDGE,
);
const PRODUCTION_AUTOMATION_STATUSES: readonly AutomationStatus[] = Object.values(AutomationStatus).filter(
  (status) => status !== AutomationStatus.DEMO_MODE,
);
const PRODUCTION_EMAIL_STATUSES: readonly EmailStatus[] = Object.values(EmailStatus).filter(
  (status) => status !== EmailStatus.PENDING_DEMO && status !== EmailStatus.SENT_DEMO,
);
const BOOKING_EMAIL_STATUSES = ['pending', 'sent', 'failed', 'skipped'] as const;
const BOOKING_EMAIL_TYPES = [
  'booking_receipt',
  'booking_update',
  'contract_notice',
  'payment_reminder',
] as const;

type BookingEmailStatusValue = typeof BOOKING_EMAIL_STATUSES[number];
type BookingEmailTypeValue = typeof BOOKING_EMAIL_TYPES[number];

const EDITABLE_FIELDS = [
  'clientName',
  'clientEmail',
  'clientPhone',
  'clientAddress',
  'eventTitle',
  'eventType',
  'eventDate',
  'startTime',
  'endTime',
  'venue',
  'guestCount',
  'packageSelected',
  'theme',
  'colors',
  'specialRequests',
  'assignedCoordinator',
  'internalNotes',
] as const;

function adminActor(admin: CurrentAdmin): BookingActor {
  return {
    id: admin.id,
    name: `@${admin.username}`,
    role: admin.role,
    source: 'Admin',
  };
}

function workflowActor(name = 'n8n Workflow'): BookingActor {
  return {
    id: null,
    name,
    role: 'SYSTEM',
    source: 'n8n Workflow',
  };
}

function requireText(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BookingRequestError(`${label} is required.`);
  }

  return value.trim();
}

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseBookingEmailStatus(value: unknown): BookingEmailStatusValue {
  const emailStatus = optionalText(value)?.toLowerCase();

  if (!emailStatus) {
    throw new BookingRequestError('emailStatus is required.', 400);
  }

  if (!BOOKING_EMAIL_STATUSES.includes(emailStatus as BookingEmailStatusValue)) {
    throw new BookingRequestError('Invalid emailStatus value.', 400);
  }

  return emailStatus as BookingEmailStatusValue;
}

function parseBookingEmailType(value: unknown): BookingEmailTypeValue {
  const emailType = optionalText(value)?.toLowerCase();

  if (!emailType) {
    throw new BookingRequestError('emailType is required.', 400);
  }

  if (!BOOKING_EMAIL_TYPES.includes(emailType as BookingEmailTypeValue)) {
    throw new BookingRequestError('Invalid emailType value.', 400);
  }

  return emailType as BookingEmailTypeValue;
}

function parseWorkflowExecutionId(value: unknown) {
  const workflowExecutionId = optionalText(value);

  if (!workflowExecutionId) {
    throw new BookingRequestError('workflowExecutionId is required.', 400);
  }

  return workflowExecutionId;
}

function parseOptionalEmailSentDate(value: unknown) {
  const rawValue = optionalText(value);

  if (!rawValue) {
    return null;
  }

  const date = new Date(rawValue);

  if (Number.isNaN(date.getTime())) {
    throw new BookingRequestError('lastEmailSentAt must be a valid date.', 400);
  }

  return date;
}

function optionalMoney(value: unknown, label: string) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new BookingRequestError(`${label} must be a non-negative number.`);
  }

  return amount;
}

function parseGuestCount(value: unknown) {
  const parsed = Number(value ?? 0);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new BookingRequestError('guestCount must be a non-negative whole number.');
  }

  return parsed;
}

function parseClientGuestCount(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  const text = optionalText(value);
  if (!text) {
    return 0;
  }

  const wholeNumber = /^\+?(\d+)\+?$/.exec(text);
  if (wholeNumber) {
    return Number(wholeNumber[1]);
  }

  const range = /^(\d+)\s*-\s*(\d+)\+?$/.exec(text);
  if (range) {
    const lowerBound = Number(range[1]);
    const upperBound = Number(range[2]);

    if (upperBound >= lowerBound) {
      return upperBound;
    }
  }

  return Number(text);
}

function parseOptionalDate(value: unknown, label: string) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return parseBookingDate(value, label);
}

function optionalPositiveInteger(value: unknown, label: string) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new BookingRequestError(`${label} must be a positive whole number.`);
  }

  return parsed;
}

function isEnumValue<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function bookingMetadata(booking: {
  id: string;
  bookingReference: string;
  bookingSource: BookingSource;
  n8nExecutionId: string | null;
}) {
  return {
    bookingReference: booking.bookingReference,
    bookingId: booking.id,
    bookingSource: booking.bookingSource,
    n8nExecutionId: booking.n8nExecutionId,
  };
}

function mapBookingStatusToEventStatus(status: BookingStatus): EventStatus {
  if (status === BookingStatus.COMPLETED) {
    return EventStatus.COMPLETED;
  }

  if (
    status === BookingStatus.DECLINED ||
    status === BookingStatus.CANCELLED ||
    status === BookingStatus.EXPIRED
  ) {
    return EventStatus.DECLINED;
  }

  if (status === BookingStatus.CONFIRMED || status === BookingStatus.IN_PROGRESS) {
    return EventStatus.CONFIRMED;
  }

  return EventStatus.PENDING;
}

function isBookingApprovedOrActive(status: BookingStatus) {
  return status === BookingStatus.CONFIRMED || status === BookingStatus.IN_PROGRESS;
}

async function syncBookingToCalendar(
  transaction: Prisma.TransactionClient,
  booking: {
    id: string;
    bookingReference: string;
    clientName: string;
    eventTitle: string;
    eventDate: Date;
    startTime: string | null;
    endTime: string | null;
    status: BookingStatus;
    eventType: string;
    venue: string;
    guestCount: number;
    specialRequests: string | null;
  },
) {
  await transaction.event.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      title: booking.eventTitle,
      clientName: booking.clientName,
      date: booking.eventDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: mapBookingStatusToEventStatus(booking.status),
      eventType: booking.eventType,
      venue: booking.venue,
      pax: booking.guestCount,
      notes: [`Booking ${booking.bookingReference}`, booking.specialRequests]
        .filter(Boolean)
        .join('\n'),
    },
    update: {
      title: booking.eventTitle,
      clientName: booking.clientName,
      date: booking.eventDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: mapBookingStatusToEventStatus(booking.status),
      eventType: booking.eventType,
      venue: booking.venue,
      pax: booking.guestCount,
      notes: [`Booking ${booking.bookingReference}`, booking.specialRequests]
        .filter(Boolean)
        .join('\n'),
    },
  });
}

async function generateBookingReference(transaction: Prisma.TransactionClient) {
  const year = new Date().getUTCFullYear();
  const prefix = `ZION-BKG-${year}-`;

  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('zion_booking_reference_sequence'))`;

  const references = await transaction.booking.findMany({
    where: {
      bookingReference: {
        startsWith: prefix,
      },
    },
    select: { bookingReference: true },
  });
  const highest = references.reduce((current, item) => {
    const match = new RegExp(`^${prefix}(\\d{6})$`).exec(item.bookingReference);
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);

  return `${prefix}${String(highest + 1).padStart(6, '0')}`;
}

function normalizeCoreBookingInput(data: BookingUpsertInput) {
  const startTime = optionalText(data.startTime);
  const endTime = optionalText(data.endTime);
  validateTimeRange(startTime, endTime);

  return {
    clientName: requireText(data.clientName, 'clientName'),
    clientEmail: optionalText(data.clientEmail)?.toLowerCase() ?? null,
    clientPhone: optionalText(data.clientPhone),
    clientAddress: optionalText(data.clientAddress),
    eventTitle: requireText(data.eventTitle, 'eventTitle'),
    eventType: requireText(data.eventType, 'eventType'),
    eventDate: parseBookingDate(data.eventDate),
    startTime,
    endTime,
    venue: requireText(data.venue, 'venue'),
    guestCount: parseGuestCount(data.guestCount),
    packageId: optionalText(data.packageId),
    packageVersion: optionalPositiveInteger(data.packageVersion, 'packageVersion'),
    packageSelected: optionalText(data.packageSelected),
    theme: optionalText(data.theme),
    colors: optionalText(data.colors),
    specialRequests: optionalText(data.specialRequests),
    assignedCoordinator: optionalText(data.assignedCoordinator),
  };
}

function normalizeClientBookingInput(data: ClientBookingInput): BookingUpsertInput {
  const clientName = requireText(data.clientName, 'clientName');
  const eventType = requireText(data.eventType, 'eventType');
  const eventTitle = optionalText(data.eventTitle) ?? `${clientName} - ${eventType}`;
  const preferredTime = optionalText(data.preferredTime);
  const preferredContactMethod = optionalText(data.preferredContactMethod);
  const alternativeDate = optionalText(data.alternativeDate);
  const budget = optionalText(data.budget);
  const facebook = optionalText(data.facebook);
  const notes = optionalText(data.specialRequests);
  const guestCount = parseClientGuestCount(data.guestCount);
  const guestCountLabel = optionalText(data.guestCount);
  const addOns = Array.isArray(data.addOns)
    ? data.addOns.map((item) => optionalText(item)).filter((item): item is string => Boolean(item))
    : [];
  const specialRequests = [
    preferredTime ? `Preferred time: ${preferredTime}` : null,
    alternativeDate ? `Alternative date: ${alternativeDate}` : null,
    preferredContactMethod ? `Preferred contact method: ${preferredContactMethod}` : null,
    budget ? `Estimated budget: ${budget}` : null,
    guestCountLabel && guestCountLabel !== String(guestCount)
      ? `Estimated guest count: ${guestCountLabel}`
      : null,
    facebook ? `Facebook: ${facebook}` : null,
    addOns.length ? `Requested add-ons: ${addOns.join(', ')}` : null,
    notes,
  ].filter(Boolean).join('\n');

  return {
    clientName,
    clientEmail: optionalText(data.clientEmail),
    clientPhone: optionalText(data.clientPhone),
    clientAddress: optionalText(data.clientAddress),
    eventTitle,
    eventType,
    eventDate: requireText(data.eventDate, 'eventDate'),
    startTime: optionalText(data.startTime),
    endTime: optionalText(data.endTime),
    venue: 'Zion Events Place',
    guestCount,
    packageId: optionalText(data.packageId),
    packageVersion: data.packageVersion === undefined || data.packageVersion === null
      ? null
      : Number(data.packageVersion),
    packageSelected: optionalText(data.packageSelected),
    theme: optionalText(data.theme),
    specialRequests: specialRequests || null,
    bookingSource: BookingSource.ONLINE_FORM,
  };
}

async function auditBooking(input: {
  actor: BookingActor;
  booking: {
    id: string;
    bookingReference: string;
    bookingSource: BookingSource;
    n8nExecutionId: string | null;
  };
  action: AuditAction;
  description: string;
  status?: AuditStatus;
  previousValues?: JsonObject | null;
  newValues?: JsonObject | null;
  metadata?: JsonObject;
}) {
  await createAuditLog({
    userId: input.actor.id,
    userName: input.actor.name,
    userRole: input.actor.role,
    action: input.action,
    module: 'Bookings',
    description: input.description,
    status: input.status ?? AuditStatus.SUCCESS,
    previousValues: input.previousValues,
    newValues: input.newValues,
    metadata: {
      ...bookingMetadata(input.booking),
      ...input.metadata,
    },
  });
}

function parseWebhookTimeoutMs() {
  const parsed = Number(process.env.N8N_WEBHOOK_TIMEOUT_MS);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_N8N_WEBHOOK_TIMEOUT_MS;
  }

  return Math.round(parsed);
}

function bookingWebhookPayload(booking: ValidBookingCreatedWorkflowBooking): BookingWebhookPayload {
  return {
    booking_id: booking.id,
    booking_reference: booking.bookingReference,
    event_type: booking.eventType,
    triggered_at: new Date().toISOString(),
    categorization: booking.categorization,
  };
}

function timingSafeTextEqual(expected: string, supplied: string) {
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);

  return expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function jsonRecord(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function stringArray(value: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()));
}

function safeRiskLevel(value: string): BookingCategorizationResult['riskLevel'] {
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value;
  }

  return 'medium';
}

function safeSuggestedAdminRole(value: string): BookingCategorizationResult['suggestedAdminRole'] {
  return value === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN';
}

function categorizationFromContext(
  context: BookingOrchestrationContext | null | undefined,
): BookingCategorizationResult | null {
  if (!context) {
    return null;
  }

  return {
    eventCategory: context.eventCategory,
    eventCategoryKey: context.eventCategoryKey,
    packageCategory: context.packageCategory,
    packageTier: context.packageTier,
    taskTemplateKey: context.taskTemplateKey,
    requestedTaskTemplateKey: context.requestedTaskTemplateKey,
    taskTemplateId: context.taskTemplateId,
    taskTemplateVersion: context.taskTemplateVersion,
    templateFallbackUsed: context.templateFallbackUsed,
    templateFallbackReason: context.templateFallbackReason,
    riskLevel: safeRiskLevel(context.riskLevel),
    hasScheduleConflict: context.hasScheduleConflict,
    requiresManualReview: context.requiresManualReview,
    suggestedAdminRole: safeSuggestedAdminRole(context.suggestedAdminRole),
    tags: stringArray(context.tags),
    reasonCodes: stringArray(context.reasonCodes),
  };
}

function categorizationDbData(result: BookingCategorizationResult, bookingReference: string) {
  if (!result.taskTemplateId || !result.taskTemplateVersion) {
    throw new BookingRequestError('Booking task template resolution is incomplete.', 503);
  }

  return {
    bookingReference,
    eventCategory: result.eventCategory,
    eventCategoryKey: result.eventCategoryKey,
    packageCategory: result.packageCategory,
    packageTier: result.packageTier,
    taskTemplateKey: result.taskTemplateKey,
    requestedTaskTemplateKey: result.requestedTaskTemplateKey,
    taskTemplateId: result.taskTemplateId,
    taskTemplateVersion: result.taskTemplateVersion,
    templateFallbackUsed: result.templateFallbackUsed,
    templateFallbackReason: result.templateFallbackReason,
    riskLevel: result.riskLevel,
    hasScheduleConflict: result.hasScheduleConflict,
    requiresManualReview: result.requiresManualReview,
    suggestedAdminRole: result.suggestedAdminRole,
    tags: result.tags as Prisma.InputJsonValue,
    reasonCodes: result.reasonCodes as Prisma.InputJsonValue,
  };
}

function snapshotText(snapshot: Record<string, unknown>, key: string) {
  return optionalText(snapshot[key]);
}

function moneyValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function firstMoneyValue(...values: unknown[]) {
  for (const value of values) {
    const amount = moneyValue(value);

    if (amount !== null) {
      return amount;
    }
  }

  return 0;
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function bookingStatusForOrchestration(status: BookingStatus) {
  if (status === BookingStatus.PENDING) {
    return 'pending_review';
  }

  return status.toLowerCase();
}

function requestBaseUrl(request: Request) {
  const configuredBaseUrl = optionalText(process.env.NEXTAUTH_URL);

  return (configuredBaseUrl ?? new URL(request.url).origin).replace(/\/+$/, '');
}

function receiptLink(request: Request, bookingReference: string) {
  return `${requestBaseUrl(request)}/booking-receipt/${encodeURIComponent(bookingReference)}`;
}

function zionLogoUrl(request: Request) {
  return optionalText(process.env.ZION_LOGO_URL) ?? `${requestBaseUrl(request)}/zion-logo.png`;
}

function bookingDetailsPayload(
  booking: BookingDetailsRecord,
  request: Request,
): OrchestrationBookingDetails {
  const snapshot = jsonRecord(booking.packageSnapshot?.snapshotData);
  const eventType = optionalText(booking.eventCategoryName) ??
    snapshotText(snapshot, 'eventCategoryName') ??
    booking.eventType;
  const packageName = snapshotText(snapshot, 'packageName') ??
    optionalText(booking.packageSelected) ??
    optionalText(booking.paymentRecord?.packageName) ??
    optionalText(booking.package?.packageName);
  const packagePrice = firstMoneyValue(
    snapshot.price,
    booking.paymentTotalAmount,
    booking.paymentRecord?.totalAmount,
    booking.package?.price,
  );
  const downPayment = firstMoneyValue(
    snapshot.downPaymentAmount,
    booking.package?.downPaymentAmount,
    snapshot.reservationFee,
    booking.package?.reservationFee,
    booking.paymentAmountPaid,
    booking.paymentRecord?.amountPaid,
  );
  const remainingBalance = Math.max(packagePrice - downPayment, 0);

  return {
    booking_id: booking.id,
    booking_reference: booking.bookingReference,
    client_name: booking.clientName,
    client_email: optionalText(booking.clientEmail),
    client_contact: optionalText(booking.clientPhone),
    event_type: eventType,
    event_date: dateOnly(booking.eventDate),
    start_time: optionalText(booking.startTime) ?? snapshotText(snapshot, 'checkInTime'),
    end_time: optionalText(booking.endTime) ?? snapshotText(snapshot, 'checkOutTime'),
    guest_count: booking.guestCount,
    package_name: packageName,
    package_price: packagePrice,
    down_payment: downPayment,
    remaining_balance: remainingBalance,
    theme: optionalText(booking.theme),
    colors: optionalText(booking.colors),
    special_requests: optionalText(booking.specialRequests),
    booking_status: bookingStatusForOrchestration(booking.status),
    receipt_link: receiptLink(request, booking.bookingReference),
  };
}

type BookingCategorizationSourceRecord = {
  id: string;
  bookingReference: string;
  eventType: string;
  eventCategoryName: string | null;
  eventCategoryId: string | null;
  packageId: string | null;
  packageSelected: string | null;
  guestCount: number;
  eventDate: Date;
  startTime: string | null;
  endTime: string | null;
  paymentSummaryStatus?: PaymentSummaryStatus | null;
  paymentTotalAmount?: number | null;
  paymentAmountPaid?: number | null;
  paymentRemainingBalance?: number | null;
  package?: {
    packageName: string;
  } | null;
  packageSnapshot?: {
    snapshotData: Prisma.JsonValue;
  } | null;
  paymentRecord?: {
    totalAmount: number;
    amountPaid: number;
    remainingBalance: number;
    packageName: string | null;
  } | null;
};

function bookingCategorizationInput(
  booking: BookingCategorizationSourceRecord,
  conflicts: unknown[],
): BookingCategorizationInput {
  const snapshot = jsonRecord(booking.packageSnapshot?.snapshotData);

  return {
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    eventType: booking.eventType,
    eventCategoryName: booking.eventCategoryName,
    packageId: booking.packageId,
    packageName: optionalText(booking.packageSelected) ??
      snapshotText(snapshot, 'packageName') ??
      optionalText(booking.paymentRecord?.packageName) ??
      optionalText(booking.package?.packageName),
    packageSnapshot: booking.packageSnapshot?.snapshotData ?? null,
    guestCount: booking.guestCount,
    eventDate: booking.eventDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    conflicts,
    paymentSummary: {
      status: booking.paymentSummaryStatus ?? null,
      totalAmount: booking.paymentTotalAmount ?? booking.paymentRecord?.totalAmount ?? null,
      amountPaid: booking.paymentAmountPaid ?? booking.paymentRecord?.amountPaid ?? null,
      remainingBalance: booking.paymentRemainingBalance ?? booking.paymentRecord?.remainingBalance ?? null,
    },
  };
}

async function persistBookingCategorization(input: {
  transaction: Prisma.TransactionClient;
  booking: BookingCategorizationSourceRecord;
  conflicts: unknown[];
  writeTimeline?: boolean;
}) {
  const ruleResult = categorizeBooking(bookingCategorizationInput(input.booking, input.conflicts));
  const category = input.booking.eventCategoryId
    ? await input.transaction.eventCategory.findUnique({
        where: { id: input.booking.eventCategoryId },
        select: { name: true, categoryKey: true },
      })
    : null;
  const eventCategory = category?.name ?? ruleResult.eventCategory;
  const eventCategoryKey = category?.categoryKey ?? ruleResult.eventCategoryKey;
  const requestedTaskTemplateKey = category
    ? taskTemplateKeyForCategory(category.categoryKey)
    : ruleResult.requestedTaskTemplateKey;
  const resolution = await resolvePublishedTaskTemplate(
    requestedTaskTemplateKey,
    input.transaction,
  );
  const result: BookingCategorizationResult = {
    ...ruleResult,
    eventCategory,
    eventCategoryKey,
    taskTemplateKey: resolution.templateKey,
    requestedTaskTemplateKey: resolution.requestedTemplateKey,
    taskTemplateId: resolution.taskTemplateId,
    taskTemplateVersion: resolution.taskTemplateVersion,
    templateFallbackUsed: resolution.templateFallbackUsed,
    templateFallbackReason: resolution.templateFallbackReason,
  };
  const data = categorizationDbData(result, input.booking.bookingReference);

  await input.transaction.bookingOrchestrationContext.upsert({
    where: { bookingId: input.booking.id },
    create: {
      bookingId: input.booking.id,
      ...data,
    },
    update: data,
  });

  if (result.templateFallbackUsed) {
    await recordTemplateFallback({
      db: input.transaction,
      bookingId: input.booking.id,
      bookingReference: input.booking.bookingReference,
      eventCategoryKey: result.eventCategoryKey,
      requestedTemplateKey: result.requestedTaskTemplateKey,
      appliedTemplateKey: result.taskTemplateKey,
    });
  }

  if (input.writeTimeline !== false) {
    await input.transaction.bookingTimeline.create({
      data: {
        bookingId: input.booking.id,
        action: 'Booking Categorized',
        source: 'System',
        performedBy: 'System',
        description: `Booking categorized as ${result.eventCategory} with ${result.riskLevel} risk.`,
        metadata: {
          eventCategoryKey: result.eventCategoryKey,
          taskTemplateKey: result.taskTemplateKey,
          requestedTaskTemplateKey: result.requestedTaskTemplateKey,
          taskTemplateId: result.taskTemplateId,
          taskTemplateVersion: result.taskTemplateVersion,
          templateFallbackUsed: result.templateFallbackUsed,
          templateFallbackReason: result.templateFallbackReason,
          riskLevel: result.riskLevel,
          requiresManualReview: result.requiresManualReview,
          reasonCodes: result.reasonCodes,
        },
      },
    });
  }

  return result;
}

async function ensureBookingCategorization(
  bookingId: string,
  existing?: BookingCategorizationResult | null,
): Promise<BookingCategorizationResult | null> {
  if (existing) {
    return existing;
  }

  const context = await prisma.bookingOrchestrationContext.findUnique({
    where: { bookingId },
  });
  const fromContext = categorizationFromContext(context);

  if (fromContext) {
    return fromContext;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      package: {
        select: {
          packageName: true,
        },
      },
      packageSnapshot: {
        select: {
          snapshotData: true,
        },
      },
      paymentRecord: {
        select: {
          totalAmount: true,
          amountPaid: true,
          remainingBalance: true,
          packageName: true,
        },
      },
    },
  });

  if (!booking) {
    return null;
  }

  const conflicts = await findBookingConflicts({
    eventDate: booking.eventDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    venue: booking.venue,
    excludeBookingId: booking.id,
  });

  return prisma.$transaction((transaction) => persistBookingCategorization({
    transaction,
    booking,
    conflicts,
  }));
}

function safeWebhookLog(input: {
  bookingId?: string | null;
  bookingReference?: string | null;
  errorMessage?: string | null;
  event: string;
  status: string;
}) {
  return {
    event: input.event,
    booking_id: input.bookingId ?? null,
    booking_reference: input.bookingReference ?? null,
    workflow: BOOKING_CREATED_WORKFLOW_NAME,
    status: input.status,
    error_message_safe: input.errorMessage ?? null,
    created_at: new Date().toISOString(),
  };
}

function writeWebhookLog(
  level: 'info' | 'warn',
  input: Parameters<typeof safeWebhookLog>[0],
) {
  const log = safeWebhookLog(input);

  if (level === 'warn') {
    console.warn('[n8n] Booking webhook.', log);
  } else {
    console.info('[n8n] Booking webhook.', log);
  }
}

function writeBookingDetailsLog(
  level: 'info' | 'warn',
  input: Parameters<typeof safeWebhookLog>[0],
) {
  const log = safeWebhookLog(input);

  if (level === 'warn') {
    console.warn('[n8n] Booking details.', log);
  } else {
    console.info('[n8n] Booking details.', log);
  }
}

async function createWebhookLog(input: {
  booking: ValidBookingCreatedWorkflowBooking;
  errorMessage?: string | null;
  payload: BookingWebhookPayload;
  responseStatus?: number | null;
  status: N8nWorkflowStatus;
  startedAt?: Date | null;
}) {
  try {
    const completed = input.status !== N8nWorkflowStatus.PROCESSING;

    return await prisma.n8nWorkflowLog.create({
      data: {
        workflowName: BOOKING_CREATED_WORKFLOW_NAME,
        relatedModule: 'booking',
        relatedRecordId: input.booking.id,
        triggerSource: BOOKING_CREATED_EVENT,
        requestPayload: input.payload as Prisma.InputJsonValue,
        responsePayload: input.responseStatus
          ? { http_status: input.responseStatus }
          : undefined,
        status: input.status,
        errorMessage: input.errorMessage,
        startedAt: input.startedAt ?? new Date(),
        completedAt: completed ? new Date() : null,
      },
    });
  } catch (error) {
    writeWebhookLog('warn', {
      event: 'booking.webhook_log_failed',
      bookingId: input.booking.id,
      bookingReference: input.booking.bookingReference,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unable to save webhook log.',
    });
    return null;
  }
}

async function updateWebhookLog(input: {
  errorMessage?: string | null;
  id: string | null;
  responseStatus?: number | null;
  status: N8nWorkflowStatus;
}) {
  if (!input.id) {
    return;
  }

  try {
    await prisma.n8nWorkflowLog.update({
      where: { id: input.id },
      data: {
        responsePayload: input.responseStatus
          ? { http_status: input.responseStatus }
          : undefined,
        status: input.status,
        errorMessage: input.errorMessage,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    writeWebhookLog('warn', {
      event: 'booking.webhook_log_update_failed',
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unable to update webhook log.',
    });
  }
}

function bookingWebhookErrorMessage(error: unknown, timeoutMs: number) {
  if (
    error instanceof Error &&
    (error.name === 'AbortError' || error.message.toLowerCase().includes('aborted'))
  ) {
    return `n8n booking webhook timed out after ${timeoutMs}ms.`;
  }

  return error instanceof Error
    ? error.message
    : 'n8n booking webhook trigger failed.';
}

export async function triggerBookingCreatedWorkflow(
  booking: BookingCreatedWorkflowBooking,
): Promise<void> {
  const normalizedBooking = {
    id: optionalText(booking?.id),
    bookingReference: optionalText(booking?.bookingReference),
    eventType: optionalText(booking?.eventType),
    categorization: booking?.categorization ?? null,
  };

  if (!normalizedBooking.id || !normalizedBooking.bookingReference || !normalizedBooking.eventType) {
    writeWebhookLog('warn', {
      event: 'booking.webhook_invalid_booking',
      bookingId: normalizedBooking.id,
      bookingReference: normalizedBooking.bookingReference,
      status: 'skipped',
      errorMessage: 'Invalid booking object. Webhook skipped.',
    });
    return;
  }

  const validBookingBase = {
    id: normalizedBooking.id,
    bookingReference: normalizedBooking.bookingReference,
    eventType: normalizedBooking.eventType,
  };

  const categorization = await ensureBookingCategorization(
    validBookingBase.id,
    normalizedBooking.categorization,
  );

  if (!categorization) {
    const message = 'Booking categorization is required before n8n trigger.';
    writeWebhookLog('warn', {
      event: 'booking.webhook_missing_categorization',
      bookingId: validBookingBase.id,
      bookingReference: validBookingBase.bookingReference,
      status: 'skipped',
      errorMessage: message,
    });
    await prisma.n8nWorkflowLog.create({
      data: {
        workflowName: BOOKING_CREATED_WORKFLOW_NAME,
        relatedModule: 'booking',
        relatedRecordId: validBookingBase.id,
        triggerSource: BOOKING_CREATED_EVENT,
        requestPayload: {
          booking_id: validBookingBase.id,
          booking_reference: validBookingBase.bookingReference,
          event_type: validBookingBase.eventType,
        },
        status: N8nWorkflowStatus.FAILED,
        errorMessage: message,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });
    return;
  }

  const validBooking: ValidBookingCreatedWorkflowBooking = {
    ...validBookingBase,
    categorization,
  };
  const payload = bookingWebhookPayload(validBooking);
  const enabled = process.env.N8N_WEBHOOK_ENABLED === 'true';
  const webhookUrl = optionalText(process.env.N8N_BOOKING_WEBHOOK_URL);
  const webhookSecret = optionalText(process.env.N8N_WEBHOOK_SECRET);
  const timeoutMs = parseWebhookTimeoutMs();

  if (!enabled) {
    const message = 'n8n booking webhook disabled by N8N_WEBHOOK_ENABLED.';
    writeWebhookLog('info', {
      event: 'booking.webhook_disabled',
      bookingId: payload.booking_id,
      bookingReference: payload.booking_reference,
      status: 'skipped',
      errorMessage: message,
    });
    await createWebhookLog({
      booking: validBooking,
      errorMessage: message,
      payload,
      status: N8nWorkflowStatus.CANCELLED,
    });
    return;
  }

  if (!webhookUrl) {
    const message = 'Missing N8N_BOOKING_WEBHOOK_URL.';
    writeWebhookLog('warn', {
      event: 'booking.webhook_missing_url',
      bookingId: payload.booking_id,
      bookingReference: payload.booking_reference,
      status: 'skipped',
      errorMessage: message,
    });
    await createWebhookLog({
      booking: validBooking,
      errorMessage: message,
      payload,
      status: N8nWorkflowStatus.FAILED,
    });
    return;
  }

  if (!webhookSecret) {
    const message = 'Missing N8N_WEBHOOK_SECRET.';
    writeWebhookLog('warn', {
      event: 'booking.webhook_missing_secret',
      bookingId: payload.booking_id,
      bookingReference: payload.booking_reference,
      status: 'skipped',
      errorMessage: message,
    });
    await createWebhookLog({
      booking: validBooking,
      errorMessage: message,
      payload,
      status: N8nWorkflowStatus.FAILED,
    });
    return;
  }

  writeWebhookLog('info', {
    event: 'booking.webhook_attempted',
    bookingId: payload.booking_id,
    bookingReference: payload.booking_reference,
    status: 'processing',
  });

  const startedAt = new Date();
  const workflowLog = await createWebhookLog({
    booking: validBooking,
    payload,
    startedAt,
    status: N8nWorkflowStatus.PROCESSING,
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-zion-source': 'backend',
        'x-zion-workflow-secret': webhookSecret,
        'x-zion-idempotency-key': payload.booking_reference,
        'x-zion-event': BOOKING_CREATED_EVENT,
        'x-zion-triggered-at': payload.triggered_at,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = `n8n booking webhook returned HTTP ${response.status}.`;
      writeWebhookLog('warn', {
        event: 'booking.webhook_failed',
        bookingId: payload.booking_id,
        bookingReference: payload.booking_reference,
        status: 'failed',
        errorMessage: message,
      });
      await updateWebhookLog({
        id: workflowLog?.id ?? null,
        responseStatus: response.status,
        status: N8nWorkflowStatus.FAILED,
        errorMessage: message,
      });
      return;
    }

    writeWebhookLog('info', {
      event: 'booking.webhook_successful',
      bookingId: payload.booking_id,
      bookingReference: payload.booking_reference,
      status: 'success',
    });
    await updateWebhookLog({
      id: workflowLog?.id ?? null,
      responseStatus: response.status,
      status: N8nWorkflowStatus.SUCCESS,
    });
  } catch (error) {
    const message = bookingWebhookErrorMessage(error, timeoutMs);
    writeWebhookLog('warn', {
      event: message.includes('timed out')
        ? 'booking.webhook_timeout'
        : 'booking.webhook_failed',
      bookingId: payload.booking_id,
      bookingReference: payload.booking_reference,
      status: 'failed',
      errorMessage: message,
    });
    await updateWebhookLog({
      id: workflowLog?.id ?? null,
      status: N8nWorkflowStatus.FAILED,
      errorMessage: message,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function appendBookingTimelineEntry(data: TimelineEntryInput): Promise<void> {
  await prisma.bookingTimeline.create({
    data: {
      bookingId: data.bookingId,
      action: data.action,
      source: data.source,
      performedBy: data.performedBy,
      description: data.description,
      metadata: data.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function createManualBooking(data: ManualBookingInput, admin: CurrentAdmin) {
  const actor = adminActor(admin);
  const normalized = normalizeCoreBookingInput(data);
  const conflicts = await findBookingConflicts(normalized);
  const overridden = assertConflictOverride({
    conflicts,
    actorRole: actor.role,
    overrideReason: data.conflictOverrideReason,
  });

  const booking = await prisma.$transaction(async (transaction) => {
    const bookingReference = await generateBookingReference(transaction);
    const created = await transaction.booking.create({
      data: {
        bookingReference,
        ...normalized,
        internalNotes: optionalText(data.internalNotes),
        bookingSource: BookingSource.ADMIN_MANUAL,
        syncStatus: SyncStatus.MANUAL_UPDATE,
        automationStatus: AutomationStatus.NOT_STARTED,
      },
    });

    if (normalized.packageId) {
      await attachPackageSnapshotToBooking({
        bookingId: created.id,
        packageId: normalized.packageId,
        packageVersion: normalized.packageVersion,
        db: transaction,
      });
    }

    await transaction.bookingTimeline.create({
      data: {
        bookingId: created.id,
        action: 'Booking Created',
        source: actor.source,
        performedBy: actor.name,
        description: `Booking ${created.bookingReference} was manually created.`,
        metadata: {
          bookingReference: created.bookingReference,
        },
      },
    });

    if (overridden) {
      await transaction.bookingTimeline.create({
        data: {
          bookingId: created.id,
          action: 'Conflict Override',
          source: actor.source,
          performedBy: actor.name,
          description: `Schedule conflict override used. Reason: ${data.conflictOverrideReason?.trim()}`,
          metadata: {
            conflicts: conflicts.map((conflict) => conflict.bookingReference),
            reason: data.conflictOverrideReason?.trim(),
          },
        },
      });
    }

    const saved = normalized.packageId
      ? await transaction.booking.findUniqueOrThrow({ where: { id: created.id } })
      : created;

    await syncBookingToCalendar(transaction, saved);
    return saved;
  });

  await auditBooking({
    actor,
    booking,
    action: AuditAction.CREATE,
    description: `Created booking ${booking.bookingReference} for ${booking.clientName}.`,
    status: overridden ? AuditStatus.WARNING : AuditStatus.SUCCESS,
    newValues: booking as unknown as JsonObject,
    metadata: overridden
      ? {
          conflictOverrideReason: data.conflictOverrideReason?.trim(),
          conflicts: conflicts.map((conflict) => conflict.bookingReference),
        }
      : undefined,
  });

  return { booking, conflicts };
}

export async function createClientBooking(data: ClientBookingInput) {
  const normalized = normalizeCoreBookingInput(normalizeClientBookingInput(data));

  if (!normalized.clientEmail) {
    throw new BookingRequestError('clientEmail is required.');
  }

  if (!normalized.clientPhone) {
    throw new BookingRequestError('clientPhone is required.');
  }

  if (!normalized.packageId) {
    throw new BookingRequestError('packageId is required.');
  }

  await assertClientBookingDateAvailable(normalized.eventDate);

  const conflicts = await findBookingConflicts(normalized);
  const result = await prisma.$transaction(async (transaction) => {
    const bookingReference = await generateBookingReference(transaction);
    const created = await transaction.booking.create({
      data: {
        bookingReference,
        ...normalized,
        bookingSource: BookingSource.ONLINE_FORM,
        syncStatus: conflicts.length > 0
          ? SyncStatus.CONFLICT_DETECTED
          : SyncStatus.PENDING_SYNC,
        automationStatus: AutomationStatus.TRIGGERED,
        lastSyncedAt: new Date(),
      },
    });

    await attachPackageSnapshotToBooking({
      bookingId: created.id,
      packageId: normalized.packageId!,
      packageVersion: normalized.packageVersion,
      db: transaction,
    });

    const saved = await transaction.booking.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        package: {
          select: {
            packageName: true,
          },
        },
        packageSnapshot: {
          select: {
            snapshotData: true,
          },
        },
        paymentRecord: {
          select: {
            totalAmount: true,
            amountPaid: true,
            remainingBalance: true,
            packageName: true,
          },
        },
      },
    });

    await transaction.bookingTimeline.create({
      data: {
        bookingId: saved.id,
        action: 'Booking Submitted',
        source: 'Client Panel',
        performedBy: saved.clientName,
        description: `Client booking ${saved.bookingReference} was submitted from the booking form.`,
        metadata: {
          bookingReference: saved.bookingReference,
          source: 'client_panel',
          eventCategoryId: optionalText(data.eventCategoryId),
          eventCategorySlug: optionalText(data.eventCategorySlug),
        },
      },
    });

    if (conflicts.length > 0) {
      await transaction.bookingTimeline.create({
        data: {
          bookingId: saved.id,
          action: 'Schedule Conflict Detected',
          source: 'System',
          performedBy: 'System',
          description: `Conflict detected with ${conflicts.map((item) => item.bookingReference).join(', ')}.`,
          metadata: {
            conflicts: conflicts.map((item) => item.bookingReference),
          },
        },
      });
    }

    const categorization = await persistBookingCategorization({
      transaction,
      booking: saved,
      conflicts,
    });

    await syncBookingToCalendar(transaction, saved);
    return { booking: saved, categorization };
  });
  const { booking, categorization } = result;

  await auditBooking({
    actor: {
      id: null,
      name: 'Client Panel',
      role: 'CLIENT',
      source: 'System',
    },
    booking,
    action: AuditAction.CREATE,
    description: `Client submitted booking ${booking.bookingReference} for ${booking.clientName}.`,
    status: conflicts.length > 0 ? AuditStatus.WARNING : AuditStatus.SUCCESS,
    newValues: booking as unknown as JsonObject,
    metadata: {
      source: 'client_panel',
      conflicts: conflicts.map((conflict) => conflict.bookingReference),
    },
  });

  await triggerBookingCreatedWorkflow({
    id: booking.id,
    bookingReference: booking.bookingReference,
    eventType: booking.eventType,
    categorization,
  });

  return { booking, conflicts, categorization };
}

export async function updateManualBooking(id: string, data: BookingEditInput, admin: CurrentAdmin) {
  const actor = adminActor(admin);
  const previous = await prisma.booking.findUnique({ where: { id } });

  if (!previous) {
    throw new BookingRequestError('Booking not found.', 404);
  }

  const updates: Prisma.BookingUpdateInput = {};
  const changedFields: (typeof EDITABLE_FIELDS)[number][] = [];

  for (const field of EDITABLE_FIELDS) {
    if (!(field in data)) {
      continue;
    }

    let value: unknown = data[field];

    if (field === 'eventDate') {
      value = parseBookingDate(value);
    } else if (field === 'guestCount') {
      value = parseGuestCount(value);
    } else if (
      field === 'clientName' ||
      field === 'eventTitle' ||
      field === 'eventType' ||
      field === 'venue'
    ) {
      value = requireText(value, field);
    } else {
      value = optionalText(value);
    }

    if (field === 'clientEmail' && typeof value === 'string') {
      value = value.toLowerCase();
    }

    const previousValue = previous[field];
    const comparablePrevious = previousValue instanceof Date
      ? previousValue.toISOString()
      : previousValue;
    const comparableNext = value instanceof Date ? value.toISOString() : value;

    if (comparablePrevious !== comparableNext) {
      (updates as Record<string, unknown>)[field] = value;
      changedFields.push(field);
    }
  }

  if (changedFields.length === 0) {
    return { booking: previous, conflicts: [] };
  }

  const nextSchedule = {
    eventDate: (updates.eventDate as Date | undefined) ?? previous.eventDate,
    startTime: 'startTime' in updates ? updates.startTime as string | null : previous.startTime,
    endTime: 'endTime' in updates ? updates.endTime as string | null : previous.endTime,
    venue: (updates.venue as string | undefined) ?? previous.venue,
  };
  validateTimeRange(nextSchedule.startTime, nextSchedule.endTime);

  const scheduleChanged = changedFields.some((field) => (
    field === 'eventDate' || field === 'startTime' || field === 'endTime' || field === 'venue'
  ));
  const conflicts = scheduleChanged
    ? await findBookingConflicts({ ...nextSchedule, excludeBookingId: previous.id })
    : [];
  const overridden = assertConflictOverride({
    conflicts,
    actorRole: actor.role,
    overrideReason: data.conflictOverrideReason,
  });

  updates.syncStatus = SyncStatus.MANUAL_UPDATE;

  const booking = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.booking.update({
      where: { id },
      data: updates,
    });

    for (const field of changedFields) {
      await transaction.bookingTimeline.create({
        data: {
          bookingId: updated.id,
          action: 'Manually Edited',
          source: actor.source,
          performedBy: actor.name,
          description: `${actor.name} manually updated ${field}.`,
          metadata: {
            field,
            previousValue: previous[field] instanceof Date
              ? previous[field].toISOString()
              : previous[field],
            newValue: updated[field] instanceof Date
              ? updated[field].toISOString()
              : updated[field],
          },
        },
      });
    }

    if (overridden) {
      await transaction.bookingTimeline.create({
        data: {
          bookingId: updated.id,
          action: 'Conflict Override',
          source: actor.source,
          performedBy: actor.name,
          description: `Schedule conflict override used. Reason: ${data.conflictOverrideReason?.trim()}`,
          metadata: {
            conflicts: conflicts.map((conflict) => conflict.bookingReference),
            reason: data.conflictOverrideReason?.trim(),
          },
        },
      });
    }

    await syncBookingToCalendar(transaction, updated);
    return updated;
  });

  await auditBooking({
    actor,
    booking,
    action: AuditAction.UPDATE,
    description: `Updated booking ${booking.bookingReference}.`,
    status: overridden ? AuditStatus.WARNING : AuditStatus.SUCCESS,
    previousValues: previous as unknown as JsonObject,
    newValues: booking as unknown as JsonObject,
    metadata: {
      changedFields,
      ...(overridden
        ? {
            conflictOverrideReason: data.conflictOverrideReason?.trim(),
            conflicts: conflicts.map((conflict) => conflict.bookingReference),
          }
        : {}),
    },
  });

  return { booking, conflicts };
}

export async function changeBookingStatus(input: {
  id?: string;
  bookingReference?: string;
  newStatus: BookingStatus;
  reason: string;
  overrideReason?: string | null;
  actor: BookingActor;
  n8nExecutionId?: string | null;
}) {
  const booking = await prisma.booking.findFirst({
    where: input.id ? { id: input.id } : { bookingReference: input.bookingReference },
  });

  if (!booking) {
    throw new BookingRequestError('Booking not found.', 404);
  }

  const reason = requireText(input.reason, 'reason');
  const transition = validateStatusTransition({
    currentStatus: booking.status,
    newStatus: input.newStatus,
    actorRole: input.actor.role,
    overrideReason: input.overrideReason,
  });
  const shouldActivateTasks = isBookingApprovedOrActive(input.newStatus) &&
    !isBookingApprovedOrActive(booking.status);

  let activatedTaskCount = 0;
  const updated = await prisma.$transaction(async (transaction) => {
    const next = await transaction.booking.update({
      where: { id: booking.id },
      data: {
        status: input.newStatus,
        statusChangedAt: new Date(),
        statusChangedBy: input.actor.id ?? input.actor.name,
        statusChangeReason: transition.overridden
          ? input.overrideReason?.trim()
          : reason,
        ...(input.n8nExecutionId ? { n8nExecutionId: input.n8nExecutionId } : {}),
      },
    });

    if (shouldActivateTasks) {
      const activation = await transaction.dashboardTask.updateMany({
        where: {
          relatedModule: 'bookings',
          relatedRecordId: booking.id,
          source: DashboardTaskSource.N8N_WORKFLOW,
          isActive: false,
        },
        data: {
          isActive: true,
          activationStatus: 'active',
          startedAt: new Date(),
        },
      });
      activatedTaskCount = activation.count;
    }

    await transaction.bookingTimeline.create({
      data: {
        bookingId: next.id,
        action: transition.overridden ? 'Status Override' : 'Status Changed',
        source: input.actor.source,
        performedBy: input.actor.name,
        description: transition.overridden
          ? `Status overridden from ${booking.status} to ${input.newStatus}. Reason: ${input.overrideReason?.trim()}`
          : `Status changed from ${booking.status} to ${input.newStatus}. Reason: ${reason}`,
        metadata: {
          previousStatus: booking.status,
          newStatus: input.newStatus,
          reason,
          overrideReason: input.overrideReason?.trim() ?? null,
        },
      },
    });

    if (shouldActivateTasks) {
      await transaction.bookingTimeline.create({
        data: {
          bookingId: next.id,
          action: 'Booking Approved',
          source: input.actor.source,
          performedBy: input.actor.name,
          description: `Booking ${next.bookingReference} was approved for operations preparation.`,
          metadata: {
            previousStatus: booking.status,
            newStatus: input.newStatus,
          },
        },
      });

      if (activatedTaskCount > 0) {
        await transaction.bookingTimeline.create({
          data: {
            bookingId: next.id,
            action: 'Admin To-Do List Activated',
            source: 'System',
            performedBy: 'System',
            description: `${activatedTaskCount} admin task(s) activated after booking approval.`,
            metadata: {
              activatedTaskCount,
            },
          },
        });

        await transaction.notification.create({
          data: {
            title: 'Booking task list activated',
            message: `${activatedTaskCount} task(s) for ${next.bookingReference} are now active.`,
            type: NotificationType.TASK,
            priority: NotificationPriority.HIGH,
            relatedModule: 'bookings',
            relatedRecordId: next.id,
            createdFor: null,
            createdBy: input.actor.id ?? input.actor.name,
            source: 'booking_approval',
          },
        });
      }
    }

    await syncBookingToCalendar(transaction, next);
    return next;
  });

  const auditAction = input.newStatus === BookingStatus.CONFIRMED
    ? AuditAction.APPROVAL
    : input.newStatus === BookingStatus.DECLINED
      ? AuditAction.REJECTION
      : AuditAction.UPDATE;

  await auditBooking({
    actor: input.actor,
    booking: updated,
    action: auditAction,
    description: transition.overridden
      ? `Overrode booking ${updated.bookingReference} status from ${booking.status} to ${input.newStatus}.`
      : `Changed booking ${updated.bookingReference} status from ${booking.status} to ${input.newStatus}.`,
    status: transition.overridden ? AuditStatus.WARNING : AuditStatus.SUCCESS,
    previousValues: { status: booking.status },
    newValues: { status: input.newStatus },
    metadata: {
      event: shouldActivateTasks ? 'BOOKING_TASK_LIST_ACTIVATED' : 'BOOKING_STATUS_CHANGED',
      activatedTaskCount,
      reason,
      overrideReason: input.overrideReason?.trim() ?? null,
    },
  });

  return updated;
}

export async function overrideBookingPaymentStatus(input: {
  bookingId: string;
  paymentSummaryStatus: PaymentSummaryStatus;
  reason: string;
  admin: CurrentAdmin;
}) {
  if (input.admin.role !== Role.SUPERADMIN) {
    throw new BookingRequestError('Only a Super Admin can override payment summaries.', 403);
  }

  if (input.reason.trim().length < 10) {
    throw new BookingRequestError('Override reason must contain at least 10 characters.');
  }

  const previous = await prisma.booking.findUnique({ where: { id: input.bookingId } });

  if (!previous) {
    throw new BookingRequestError('Booking not found.', 404);
  }

  const actor = adminActor(input.admin);
  const booking = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.booking.update({
      where: { id: input.bookingId },
      data: {
        paymentSummaryStatus: input.paymentSummaryStatus,
        syncStatus: SyncStatus.MANUAL_UPDATE,
      },
    });

    await transaction.bookingTimeline.create({
      data: {
        bookingId: updated.id,
        action: 'Payment Summary Override',
        source: actor.source,
        performedBy: actor.name,
        description: `Payment summary changed from ${previous.paymentSummaryStatus} to ${input.paymentSummaryStatus}. Reason: ${input.reason.trim()}`,
        metadata: {
          reason: input.reason.trim(),
          previousStatus: previous.paymentSummaryStatus,
          newStatus: input.paymentSummaryStatus,
        },
      },
    });

    return updated;
  });

  await auditBooking({
    actor,
    booking,
    action: AuditAction.UPDATE,
    description: `Overrode payment summary for booking ${booking.bookingReference}.`,
    status: AuditStatus.WARNING,
    previousValues: { paymentSummaryStatus: previous.paymentSummaryStatus },
    newValues: { paymentSummaryStatus: booking.paymentSummaryStatus },
    metadata: { overrideReason: input.reason.trim() },
  });

  return booking;
}

export async function upsertBookingFromWorkflow(data: BookingUpsertInput) {
  const normalized = normalizeCoreBookingInput(data);
  const bookingSource = data.bookingSource &&
    isEnumValue(data.bookingSource, PRODUCTION_BOOKING_SOURCES)
    ? data.bookingSource
    : BookingSource.N8N_WORKFLOW;
  const bookingReference = optionalText(data.bookingReference);
  const existing = await prisma.booking.findFirst({
    where: bookingReference
      ? {
          OR: [
            { bookingReference },
            ...(normalized.clientEmail
              ? [{
                  clientEmail: normalized.clientEmail,
                  eventDate: normalized.eventDate,
                  eventType: { equals: normalized.eventType, mode: 'insensitive' as const },
                }]
              : []),
          ],
        }
      : normalized.clientEmail
        ? {
            clientEmail: normalized.clientEmail,
            eventDate: normalized.eventDate,
            eventType: { equals: normalized.eventType, mode: 'insensitive' },
          }
        : { id: '__no_secondary_match__' },
  });
  const conflicts = await findBookingConflicts({
    ...normalized,
    excludeBookingId: existing?.id,
  });
  const syncStatus = conflicts.length > 0
    ? SyncStatus.CONFLICT_DETECTED
    : SyncStatus.SYNCED;

  const booking = await prisma.$transaction(async (transaction) => {
    const reference = existing?.bookingReference ??
      bookingReference ??
      await generateBookingReference(transaction);
    const saved = existing
      ? await transaction.booking.update({
          where: { id: existing.id },
          data: {
            ...normalized,
            syncStatus,
            automationStatus: AutomationStatus.PROCESSING,
            lastSyncedAt: new Date(),
            n8nWorkflowId: optionalText(data.n8nWorkflowId),
            n8nExecutionId: optionalText(data.n8nExecutionId),
          },
        })
      : await transaction.booking.create({
          data: {
            bookingReference: reference,
            ...normalized,
            bookingSource,
            syncStatus,
            automationStatus: AutomationStatus.PROCESSING,
            lastSyncedAt: new Date(),
            n8nWorkflowId: optionalText(data.n8nWorkflowId),
            n8nExecutionId: optionalText(data.n8nExecutionId),
          },
        });

    await transaction.bookingTimeline.create({
      data: {
        bookingId: saved.id,
        action: existing ? 'Booking Synced' : 'Booking Created',
        source: 'n8n Workflow',
        performedBy: optionalText(data.n8nWorkflowId) ?? 'n8n Workflow',
        description: existing
          ? `Booking ${saved.bookingReference} was updated by automation.`
          : `Booking ${saved.bookingReference} was created by automation.`,
        metadata: {
          n8nExecutionId: optionalText(data.n8nExecutionId),
        },
      },
    });

    if (conflicts.length > 0) {
      await transaction.bookingTimeline.create({
        data: {
          bookingId: saved.id,
          action: 'Schedule Conflict Detected',
          source: 'System',
          performedBy: 'System',
          description: `Conflict detected with ${conflicts.map((item) => item.bookingReference).join(', ')}.`,
          metadata: {
            conflicts: conflicts.map((item) => item.bookingReference),
          },
        },
      });
    }

    await syncBookingToCalendar(transaction, saved);
    return saved;
  });

  const actor = workflowActor(optionalText(data.n8nWorkflowId) ?? 'n8n Workflow');
  await auditBooking({
    actor,
    booking,
    action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
    description: `${existing ? 'Updated' : 'Created'} booking ${booking.bookingReference} from n8n.`,
    newValues: booking as unknown as JsonObject,
  });

  if (conflicts.length > 0) {
    await auditBooking({
      actor,
      booking,
      action: AuditAction.ERROR,
      description: `Schedule conflict detected for booking ${booking.bookingReference}.`,
      status: AuditStatus.FAILED,
      metadata: {
        conflicts: conflicts.map((item) => item.bookingReference),
      },
    });
  }

  return { booking, conflicts, created: !existing };
}

export async function syncBookingPaymentSummary(data: PaymentSyncInput): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { bookingReference: requireText(data.bookingReference, 'bookingReference') },
  });

  if (!booking) {
    throw new BookingRequestError('Booking not found.', 404);
  }

  if (!isEnumValue(data.paymentSummaryStatus, Object.values(PaymentSummaryStatus))) {
    throw new BookingRequestError('paymentSummaryStatus is not supported.');
  }

  const updated = await prisma.$transaction(async (transaction) => {
    const next = await transaction.booking.update({
      where: { id: booking.id },
      data: {
        paymentRecordId: optionalText(data.paymentRecordId),
        paymentSummaryStatus: data.paymentSummaryStatus,
        paymentTotalAmount: optionalMoney(data.totalAmount, 'totalAmount'),
        paymentAmountPaid: optionalMoney(data.amountPaid, 'amountPaid'),
        paymentRemainingBalance: optionalMoney(data.remainingBalance, 'remainingBalance'),
        paymentDueDate: parseOptionalDate(data.dueDate, 'dueDate'),
        paymentLastDate: parseOptionalDate(data.lastPaymentDate, 'lastPaymentDate'),
        paymentReference: optionalText(data.paymentReference),
        syncStatus: SyncStatus.SYNCED,
        lastSyncedAt: new Date(),
      },
    });

    await transaction.bookingTimeline.create({
      data: {
        bookingId: next.id,
        action: 'Payment Synced',
        source: 'Payment Management',
        performedBy: 'System',
        description: 'Payment summary synced from Payment Management.',
        metadata: {
          paymentSummaryStatus: data.paymentSummaryStatus,
          amountPaid: data.amountPaid ?? null,
          remainingBalance: data.remainingBalance ?? null,
        },
      },
    });

    return next;
  });

  await auditBooking({
    actor: {
      id: null,
      name: 'Payment Management',
      role: 'SYSTEM',
      source: 'Payment Management',
    },
    booking: updated,
    action: AuditAction.UPDATE,
    description: `Synced payment summary for booking ${updated.bookingReference}.`,
    previousValues: {
      paymentSummaryStatus: booking.paymentSummaryStatus,
      paymentAmountPaid: booking.paymentAmountPaid,
      paymentRemainingBalance: booking.paymentRemainingBalance,
    },
    newValues: {
      paymentSummaryStatus: updated.paymentSummaryStatus,
      paymentAmountPaid: updated.paymentAmountPaid,
      paymentRemainingBalance: updated.paymentRemainingBalance,
    },
  });
}

export async function updateBookingAutomationStatus(data: WorkflowResultInput): Promise<void> {
  if (!isEnumValue(data.automationStatus, PRODUCTION_AUTOMATION_STATUSES)) {
    throw new BookingRequestError('automationStatus is not supported.');
  }

  const booking = await prisma.booking.findUnique({
    where: { bookingReference: requireText(data.bookingReference, 'bookingReference') },
  });

  if (!booking) {
    throw new BookingRequestError('Booking not found.', 404);
  }

  const updated = await prisma.$transaction(async (transaction) => {
    const next = await transaction.booking.update({
      where: { id: booking.id },
      data: {
        automationStatus: data.automationStatus,
        lastWorkflowResult: optionalText(data.workflowResult),
        n8nWorkflowId: optionalText(data.n8nWorkflowId),
        n8nExecutionId: optionalText(data.n8nExecutionId),
        lastSyncedAt: new Date(),
      },
    });

    await transaction.bookingTimeline.create({
      data: {
        bookingId: next.id,
        action: 'Workflow Result',
        source: 'n8n Workflow',
        performedBy: optionalText(data.n8nWorkflowId) ?? 'n8n Workflow',
        description: data.workflowResult?.trim() ||
          `Automation status changed to ${data.automationStatus}.`,
        metadata: {
          automationStatus: data.automationStatus,
          n8nExecutionId: optionalText(data.n8nExecutionId),
        },
      },
    });

    return next;
  });

  await auditBooking({
    actor: workflowActor(optionalText(data.n8nWorkflowId) ?? 'n8n Workflow'),
    booking: updated,
    action: data.automationStatus === AutomationStatus.FAILED
      ? AuditAction.ERROR
      : AuditAction.UPDATE,
    description: `Updated workflow status for booking ${updated.bookingReference} to ${data.automationStatus}.`,
    status: data.automationStatus === AutomationStatus.FAILED
      ? AuditStatus.FAILED
      : AuditStatus.SUCCESS,
  });
}

export async function saveBookingEmailResult(data: EmailResultInput): Promise<void> {
  if (!isEnumValue(data.emailType, Object.values(EmailType))) {
    throw new BookingRequestError('emailType is not supported.');
  }

  if (!isEnumValue(data.status, PRODUCTION_EMAIL_STATUSES)) {
    throw new BookingRequestError('status is not supported.');
  }

  const booking = await prisma.booking.findUnique({
    where: { bookingReference: requireText(data.bookingReference, 'bookingReference') },
  });

  if (!booking) {
    throw new BookingRequestError('Booking not found.', 404);
  }

  const now = new Date();
  const isSent = data.status === EmailStatus.SENT || data.status === EmailStatus.DELIVERED;
  const isFailed = data.status === EmailStatus.FAILED || data.status === EmailStatus.BOUNCED;
  const emailLog = await prisma.emailLog.create({
    data: {
      recipientEmail: requireText(data.recipientEmail, 'recipientEmail').toLowerCase(),
      recipientName: optionalText(data.recipientName) ?? booking.clientName,
      emailType: data.emailType,
      relatedModule: RelatedModule.BOOKING,
      relatedRecordId: booking.id,
      subject: requireText(data.subject, 'subject'),
      triggerSource: TriggerSource.N8N_WORKFLOW,
      workflowName: optionalText(data.workflowName),
      workflowExecutionId: optionalText(data.n8nExecutionId),
      providerMessageId: optionalText(data.providerMessageId),
      status: data.status,
      lastAttemptAt: now,
      sentAt: isSent ? now : null,
      deliveredAt: data.status === EmailStatus.DELIVERED ? now : null,
      failedAt: isFailed ? now : null,
      errorMessage: optionalText(data.errorMessage),
      failureReason: optionalText(data.failureReason),
      payloadSummary: {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
      },
    },
  });

  const updated = await prisma.$transaction(async (transaction) => {
    const next = await transaction.booking.update({
      where: { id: booking.id },
      data: {
        emailLogReferenceId: emailLog.id,
        n8nExecutionId: optionalText(data.n8nExecutionId) ?? booking.n8nExecutionId,
      },
    });

    await transaction.bookingTimeline.create({
      data: {
        bookingId: next.id,
        action: data.status === EmailStatus.DELIVERED ? 'Email Sent' : 'Email Result',
        source: 'n8n Workflow',
        performedBy: optionalText(data.workflowName) ?? 'n8n Workflow',
        description: `${data.emailType} email status: ${data.status}.`,
        metadata: {
          emailLogId: emailLog.id,
          emailType: data.emailType,
          status: data.status,
        },
      },
    });

    return next;
  });

  const failed = isFailed;
  await auditBooking({
    actor: workflowActor(optionalText(data.workflowName) ?? 'n8n Workflow'),
    booking: updated,
    action: failed ? AuditAction.ERROR : AuditAction.SUBMISSION,
    description: failed
      ? `Email delivery failed for booking ${updated.bookingReference}.`
      : `Saved email delivery result for booking ${updated.bookingReference}.`,
    status: failed ? AuditStatus.FAILED : AuditStatus.SUCCESS,
    metadata: {
      emailLogId: emailLog.id,
      emailType: data.emailType,
      emailStatus: data.status,
    },
  });
}

export async function updateBookingEmailStatus(
  data: BookingEmailStatusUpdateInput,
): Promise<BookingEmailStatusUpdateResult> {
  const bookingId = requireText(data.bookingId, 'bookingId');
  const bookingReference = requireText(data.bookingReference, 'bookingReference');
  const emailStatus = parseBookingEmailStatus(data.emailStatus);
  const emailType = parseBookingEmailType(data.emailType);
  const workflowExecutionId = parseWorkflowExecutionId(data.workflowExecutionId);
  const suppliedLastEmailSentAt = parseOptionalEmailSentDate(data.lastEmailSentAt);
  const lastEmailSentAt = suppliedLastEmailSentAt ??
    (emailStatus === 'sent' ? new Date() : null);
  const emailLogReference = optionalText(data.emailLogReference);
  const existing = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      bookingReference: true,
      bookingSource: true,
      n8nExecutionId: true,
      emailStatus: true,
      emailType: true,
      lastEmailSentAt: true,
      emailLogReferenceId: true,
    },
  });

  if (!existing) {
    throw new BookingRequestError('Booking not found.', 404);
  }

  if (existing.bookingReference !== bookingReference) {
    throw new BookingRequestError('Booking reference does not match the booking record.', 403);
  }

  const updated = await prisma.$transaction(async (transaction) => {
    const next = await transaction.booking.update({
      where: { id: bookingId },
      data: {
        emailStatus,
        emailType,
        ...(lastEmailSentAt ? { lastEmailSentAt } : {}),
        n8nExecutionId: workflowExecutionId,
        ...(emailLogReference ? { emailLogReferenceId: emailLogReference } : {}),
        lastSyncedAt: new Date(),
      },
      select: {
        id: true,
        bookingReference: true,
        bookingSource: true,
        n8nExecutionId: true,
        emailStatus: true,
        emailType: true,
        lastEmailSentAt: true,
        emailLogReferenceId: true,
      },
    });

    await transaction.bookingTimeline.create({
      data: {
        bookingId,
        action: 'booking_email_status_updated',
        source: 'n8n Workflow',
        performedBy: BOOKING_CREATED_WORKFLOW_NAME,
        description: `Booking email status updated to ${emailStatus} for ${emailType}.`,
        metadata: {
          module: 'booking_email',
          action: 'booking_email_status_updated',
          bookingId,
          bookingReference: next.bookingReference,
          emailStatus,
          emailType,
          source: 'n8n_workflow',
          workflowExecutionId,
          emailLogReference: emailLogReference ?? null,
        },
      },
    });

    return next;
  });

  await auditBooking({
    actor: workflowActor(BOOKING_CREATED_WORKFLOW_NAME),
    booking: updated,
    action: emailStatus === 'failed' ? AuditAction.ERROR : AuditAction.UPDATE,
    status: emailStatus === 'failed' ? AuditStatus.FAILED : AuditStatus.SUCCESS,
    description: `Updated booking email status for ${updated.bookingReference} to ${emailStatus}.`,
    previousValues: {
      emailStatus: existing.emailStatus,
      emailType: existing.emailType,
      lastEmailSentAt: existing.lastEmailSentAt?.toISOString() ?? null,
      emailLogReferenceId: existing.emailLogReferenceId,
      n8nExecutionId: existing.n8nExecutionId,
    },
    newValues: {
      emailStatus: updated.emailStatus,
      emailType: updated.emailType,
      lastEmailSentAt: updated.lastEmailSentAt?.toISOString() ?? null,
      emailLogReferenceId: updated.emailLogReferenceId,
      n8nExecutionId: updated.n8nExecutionId,
    },
    metadata: {
      module: 'booking_email',
      action: 'booking_email_status_updated',
      source: 'n8n_workflow',
      workflowExecutionId,
    },
  });

  return {
    id: updated.id,
    bookingReference: updated.bookingReference,
    emailStatus: updated.emailStatus ?? emailStatus,
    emailType: updated.emailType ?? emailType,
    lastEmailSentAt: updated.lastEmailSentAt?.toISOString() ?? null,
  };
}

async function recordWorkflowRequest(
  bookingId: string,
  workflowName: string,
  description: string,
  admin: CurrentAdmin,
) {
  if (admin.role !== Role.SUPERADMIN) {
    throw new BookingRequestError('Only a Super Admin can trigger booking workflows.', 403);
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (!booking) {
    throw new BookingRequestError('Booking not found.', 404);
  }

  const actor = adminActor(admin);
  const updated = await prisma.$transaction(async (transaction) => {
    const next = await transaction.booking.update({
      where: { id: booking.id },
      data: {
        automationStatus: AutomationStatus.TRIGGERED,
        n8nWorkflowId: workflowName,
        lastWorkflowResult: 'Manual workflow request recorded for operations follow-up.',
      },
    });

    await transaction.bookingTimeline.create({
      data: {
        bookingId: next.id,
        action: 'Workflow Triggered',
        source: actor.source,
        performedBy: actor.name,
        description,
        metadata: {
          workflowName,
          recordedLocally: true,
        },
      },
    });

    return next;
  });

  await auditBooking({
    actor,
    booking: updated,
    action: AuditAction.SUBMISSION,
    description,
    metadata: {
      workflowName,
      recordedLocally: true,
    },
  });
}

export async function triggerBookingConfirmationWorkflow(
  bookingId: string,
  admin: CurrentAdmin,
): Promise<void> {
  await recordWorkflowRequest(
    bookingId,
    'booking-confirmation-flow',
    'Recorded booking confirmation workflow request.',
    admin,
  );
}

export async function triggerPaymentReminderWorkflow(
  bookingId: string,
  admin: CurrentAdmin,
): Promise<void> {
  await recordWorkflowRequest(
    bookingId,
    'payment-reminder-flow',
    'Recorded payment reminder workflow request.',
    admin,
  );
}

export async function triggerContractPreparationWorkflow(
  bookingId: string,
  admin: CurrentAdmin,
): Promise<void> {
  await recordWorkflowRequest(
    bookingId,
    'contract-preparation-flow',
    'Recorded contract preparation workflow request.',
    admin,
  );
}

export async function resyncBooking(bookingId: string, admin: CurrentAdmin): Promise<void> {
  if (admin.role !== Role.SUPERADMIN) {
    throw new BookingRequestError('Only a Super Admin can re-sync bookings.', 403);
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (!booking) {
    throw new BookingRequestError('Booking not found.', 404);
  }

  const actor = adminActor(admin);
  const updated = await prisma.$transaction(async (transaction) => {
    const next = await transaction.booking.update({
      where: { id: bookingId },
      data: {
        syncStatus: SyncStatus.PENDING_SYNC,
        automationStatus: AutomationStatus.TRIGGERED,
        lastWorkflowResult: 'Manual re-sync requested. Awaiting n8n integration.',
      },
    });

    await transaction.bookingTimeline.create({
      data: {
        bookingId,
        action: 'Re-sync Requested',
        source: actor.source,
        performedBy: actor.name,
        description: 'Manual booking re-sync was requested.',
        metadata: { recordedLocally: true },
      },
    });

    return next;
  });

  await auditBooking({
    actor,
    booking: updated,
    action: AuditAction.SUBMISSION,
    description: `Requested re-sync for booking ${updated.bookingReference}.`,
    metadata: { recordedLocally: true },
  });
}

export function requireBackendOrchestrationSecret(request: Request) {
  const configuredSecret = optionalText(process.env.BACKEND_ORCHESTRATION_SECRET);

  if (!configuredSecret) {
    throw new BookingRequestError(
      'Backend orchestration secret is not configured.',
      503,
    );
  }

  const suppliedSecret = optionalText(request.headers.get('x-n8n-secret'));

  if (!suppliedSecret) {
    throw new BookingRequestError('Missing backend orchestration secret.', 401);
  }

  if (!timingSafeTextEqual(configuredSecret, suppliedSecret)) {
    throw new BookingRequestError('Invalid backend orchestration secret.', 401);
  }
}

function requireBookingDetailsHeaders(request: Request) {
  requireBackendOrchestrationSecret(request);

  const source = optionalText(request.headers.get('x-zion-source'))?.toLowerCase();
  const workflow = optionalText(request.headers.get('x-zion-workflow'));
  const bookingReference = optionalText(request.headers.get('x-zion-booking-reference'));

  if (source !== 'n8n') {
    throw new BookingRequestError('Invalid orchestration source.', 401);
  }

  if (workflow !== BOOKING_CREATED_WORKFLOW_NAME) {
    throw new BookingRequestError('Invalid orchestration workflow.', 401);
  }

  if (!bookingReference) {
    throw new BookingRequestError('Missing booking reference.', 400);
  }

  return { bookingReference, workflow };
}

export async function getBookingDetailsForOrchestration(input: {
  bookingId: string;
  request: Request;
  auditEndpoint?: string;
  rateLimitScope?: string;
}): Promise<OrchestrationBookingDetailsResponse | null> {
  const bookingId = requireText(input.bookingId, 'bookingId');
  const headers = requireBookingDetailsHeaders(input.request);
  await enforceOrchestrationRateLimit({
    request: input.request,
    scope: input.rateLimitScope ?? 'booking-details-read',
    limit: 240,
  });
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      bookingReference: headers.bookingReference,
    },
    include: {
      package: {
        select: {
          packageName: true,
          price: true,
          reservationFee: true,
          downPaymentAmount: true,
        },
      },
      packageSnapshot: {
        select: {
          snapshotData: true,
        },
      },
      paymentRecord: {
        select: {
          totalAmount: true,
          amountPaid: true,
          remainingBalance: true,
          packageName: true,
        },
      },
      orchestrationContext: true,
    },
  });

  if (!booking) {
    writeBookingDetailsLog('warn', {
      event: 'booking.details_not_found',
      bookingId,
      bookingReference: headers.bookingReference,
      status: 'not_found',
    });
    return null;
  }

  const details = bookingDetailsPayload(booking, input.request);
  const categorization = await ensureBookingCategorization(
    booking.id,
    categorizationFromContext(booking.orchestrationContext),
  );

  writeBookingDetailsLog('info', {
    event: 'booking.details_fetched',
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    status: 'success',
  });

  await auditBooking({
    actor: workflowActor(BOOKING_CREATED_WORKFLOW_NAME),
    booking,
    action: AuditAction.READ,
    description: `n8n fetched orchestration details for booking ${booking.bookingReference}.`,
    metadata: {
      workflow: headers.workflow,
      endpoint: input.auditEndpoint ?? '/api/orchestration/bookings/:bookingId/details',
    },
  });

  return {
    booking: details,
    categorization,
  };
}

export async function getBookingReceiptEmailForOrchestration(input: {
  bookingId: string;
  request: Request;
}): Promise<OrchestrationBookingReceiptEmail | null> {
  const details = await getBookingDetailsForOrchestration({
    ...input,
    auditEndpoint: '/api/orchestration/bookings/:bookingId/receipt-email',
    rateLimitScope: 'booking-receipt-email-read',
  });

  if (!details) {
    return null;
  }

  if (!optionalText(details.booking.client_email)) {
    throw new BookingRequestError('Client email is required to prepare booking receipt email.', 422);
  }

  return {
    booking: details.booking,
    categorization: details.categorization,
    email: buildBookingReceiptEmail(details.booking, {
      logoUrl: zionLogoUrl(input.request),
      supportEmail: optionalText(process.env.ZION_SUPPORT_EMAIL),
      supportPhone: optionalText(process.env.ZION_SUPPORT_PHONE),
      socialLink: optionalText(process.env.ZION_SOCIAL_LINK),
    }),
  };
}

export function requireBookingOrchestrationKey(request: Request) {
  const configuredKey = process.env.BOOKING_ORCHESTRATION_API_KEY;

  if (!configuredKey) {
    throw new BookingRequestError(
      'Booking orchestration API key is not configured.',
      503,
    );
  }

  const suppliedKey = request.headers.get('x-api-key') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!suppliedKey) {
    throw new BookingRequestError('Missing orchestration API key.', 401);
  }

  if (!timingSafeTextEqual(configuredKey, suppliedKey)) {
    throw new BookingRequestError('Invalid orchestration API key.', 401);
  }
}

export function requireN8nWorkflowHeaders(
  request: Request,
  expectedWorkflow = BOOKING_CREATED_WORKFLOW_NAME,
) {
  const source = optionalText(request.headers.get('x-zion-source'))?.toLowerCase();
  const workflow = optionalText(request.headers.get('x-zion-workflow'));

  if (source !== 'n8n') {
    throw new BookingRequestError('Invalid orchestration source.', 401);
  }

  if (workflow !== expectedWorkflow) {
    throw new BookingRequestError('Invalid orchestration workflow.', 401);
  }

  return { source, workflow };
}

export function requireBookingReferenceHeader(request: Request, expected?: string | null) {
  const bookingReference = optionalText(request.headers.get('x-zion-booking-reference'));

  if (!bookingReference) {
    throw new BookingRequestError('Missing booking reference header.', 400);
  }

  if (expected && bookingReference !== expected.trim()) {
    throw new BookingRequestError('Booking reference header does not match the request.', 403);
  }

  return bookingReference;
}

export function parseBookingStatus(value: unknown) {
  if (!isEnumValue(value, Object.values(BookingStatus))) {
    throw new BookingRequestError('newStatus is not supported.');
  }

  return value;
}

export function parsePaymentSummaryStatus(value: unknown) {
  if (!isEnumValue(value, Object.values(PaymentSummaryStatus))) {
    throw new BookingRequestError('paymentSummaryStatus is not supported.');
  }

  return value;
}

export function parseAutomationStatus(value: unknown) {
  const normalizedValue = typeof value === 'string' ? value.toUpperCase() : value;

  if (normalizedValue === 'PARTIAL_FAILED') {
    return AutomationStatus.FAILED;
  }

  if (!isEnumValue(value, PRODUCTION_AUTOMATION_STATUSES)) {
    throw new BookingRequestError('automationStatus is not supported.');
  }

  return value;
}

export function parseEmailType(value: unknown) {
  if (!isEnumValue(value, Object.values(EmailType))) {
    throw new BookingRequestError('emailType is not supported.');
  }

  return value;
}

export function parseEmailStatus(value: unknown) {
  if (!isEnumValue(value, PRODUCTION_EMAIL_STATUSES)) {
    throw new BookingRequestError('status is not supported.');
  }

  return value;
}

export function parseBookingSource(value: unknown) {
  if (!isEnumValue(value, PRODUCTION_BOOKING_SOURCES)) {
    throw new BookingRequestError('bookingSource is not supported.');
  }

  return value;
}

export { adminActor, workflowActor };
