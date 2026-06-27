import { randomUUID } from 'node:crypto';
import {
  AuditAction,
  AuditStatus,
  InquiryPriority,
  InquiryStatus,
  NotificationPriority,
  NotificationType,
  Prisma,
  Role,
} from '@prisma/client';
import { revalidatePath } from 'next/cache';
import {
  auditActor,
  createAuditLog,
  errorMetadata,
  getRequestContext,
} from '@/lib/audit';
import type { CurrentAdmin } from '@/lib/authorization';
import {
  createManualBooking,
  type ManualBookingInput,
} from '@/services/booking-orchestration';
import { BookingRequestError } from '@/lib/booking-validation';
import { prisma } from '@/lib/prisma';

const URGENT_PATTERN = /\b(asap|urgent|today|immediately|right away)\b/i;
const ACTIVE_INQUIRY_STATUSES = [
  InquiryStatus.NEW,
  InquiryStatus.PENDING_RESPONSE,
  InquiryStatus.FOLLOW_UP,
] as const;

export class InquiryError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'InquiryError';
    this.status = status;
  }
}

function requiredText(value: unknown, label: string, maxLength = 255) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new InquiryError(`${label} is required.`);
  }

  return value.trim().slice(0, maxLength);
}

function optionalText(value: unknown, maxLength = 255) {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, maxLength)
    : null;
}

function parseEnum<T extends string>(
  value: unknown,
  values: readonly T[],
  label: string,
  fallback?: T,
) {
  if ((value === null || value === undefined || value === '') && fallback) {
    return fallback;
  }

  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : value;
  if (!values.includes(normalized as T)) {
    throw new InquiryError(`${label} is not supported.`);
  }

  return normalized as T;
}

function parseDate(value: string | null, boundary: 'start' | 'end') {
  if (!value) return null;
  const parsed = new Date(`${value}${boundary === 'start' ? 'T00:00:00.000Z' : 'T23:59:59.999Z'}`);
  if (Number.isNaN(parsed.getTime())) throw new InquiryError('Date filters must be valid dates.');
  return parsed;
}

function reference() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `INQ-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function publicPriority(message: string) {
  return URGENT_PATTERN.test(message) ? InquiryPriority.HIGH : InquiryPriority.NORMAL;
}

function inquiryToListDto(inquiry: {
  id: string;
  inquiryReference: string;
  fullName: string;
  phoneNumber: string | null;
  email: string;
  preferredContactTime: string | null;
  message: string;
  eventInterest: string | null;
  packageInterest: string | null;
  sourcePage: string;
  status: InquiryStatus;
  priority: InquiryPriority;
  assignedTo: string | null;
  relatedBookingId: string | null;
  submittedAt: Date;
  answeredAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: inquiry.id,
    inquiryReference: inquiry.inquiryReference,
    fullName: inquiry.fullName,
    phoneNumber: inquiry.phoneNumber,
    email: inquiry.email,
    preferredContactTime: inquiry.preferredContactTime,
    message: inquiry.message,
    eventInterest: inquiry.eventInterest,
    packageInterest: inquiry.packageInterest,
    sourcePage: inquiry.sourcePage,
    status: inquiry.status.toLowerCase(),
    priority: inquiry.priority.toLowerCase(),
    assignedTo: inquiry.assignedTo,
    relatedBookingId: inquiry.relatedBookingId,
    submittedAt: inquiry.submittedAt.toISOString(),
    answeredAt: inquiry.answeredAt?.toISOString() ?? null,
    closedAt: inquiry.closedAt?.toISOString() ?? null,
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
  };
}

async function activity(
  db: Prisma.TransactionClient,
  input: {
    inquiryId: string;
    action: string;
    description: string;
    performedBy: string;
  },
) {
  return db.inquiryActivity.create({ data: input });
}

function adminLabel(actor: CurrentAdmin) {
  return `@${actor.username}`;
}

function revalidateInquirySurfaces() {
  revalidatePath('/admin/inquiries');
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/reports');
}

export async function submitInquiry(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const fullName = requiredText(body.fullName ?? body.name, 'Full name', 180);
  const phoneNumber = requiredText(body.phoneNumber ?? body.phone, 'Phone number', 40);
  const email = requiredText(body.email, 'Email', 255).toLowerCase();
  const preferredContactTime = optionalText(body.preferredContactTime, 100);
  const message = requiredText(body.message, 'Message', 3000);
  const eventInterest = optionalText(body.eventInterest, 180);
  const packageInterest = optionalText(body.packageInterest, 255);
  const sourcePage = optionalText(body.sourcePage, 80) ?? 'contact_us';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new InquiryError('Please enter a valid email address.');
  }
  if (message.length < 10) {
    throw new InquiryError('Please write your message before submitting.');
  }

  const inquiryReference = reference();
  const priority = publicPriority(message);
  const created = await prisma.$transaction(
    async (tx) => {
      const inquiry = await tx.inquiry.create({
        data: {
          inquiryReference,
          fullName,
          phoneNumber,
          email,
          preferredContactTime,
          message,
          eventInterest,
          packageInterest,
          sourcePage,
          priority,
        },
      });

      await activity(tx, {
        inquiryId: inquiry.id,
        action: 'submitted',
        description: `Inquiry ${inquiryReference} was submitted from ${sourcePage}.`,
        performedBy: fullName,
      });

      await tx.notification.create({
        data: {
          title: 'New inquiry submitted',
          message: `New inquiry submitted by ${fullName}.`,
          type: NotificationType.INQUIRY,
          priority: NotificationPriority.MEDIUM,
          relatedModule: 'inquiries',
          relatedRecordId: inquiry.id,
          source: sourcePage,
        },
      });

      return inquiry;
    },
    { maxWait: 10_000, timeout: 15_000 },
  );

  await createAuditLog({
    userId: null,
    userName: fullName,
    userRole: 'PUBLIC',
    action: AuditAction.SUBMISSION,
    module: 'Inquiries',
    description: `${fullName} submitted inquiry ${inquiryReference}.`,
    status: AuditStatus.SUCCESS,
    ...getRequestContext(request),
    newValues: {
      inquiryReference,
      email,
      phoneNumber,
      preferredContactTime,
      eventInterest,
      packageInterest,
      priority,
      sourcePage,
    },
  });

  revalidateInquirySurfaces();

  return {
    id: created.id,
    inquiryReference,
    message: 'Your inquiry has been submitted successfully. Our team will contact you soon.',
  };
}

function buildAdminWhere(url: URL): Prisma.InquiryWhereInput {
  const search = optionalText(url.searchParams.get('search'), 200);
  const statusParam = optionalText(url.searchParams.get('status'), 50);
  const priorityParam = optionalText(url.searchParams.get('priority'), 30);
  const eventInterest = optionalText(url.searchParams.get('eventInterest'), 180);
  const assignedTo = optionalText(url.searchParams.get('assignedTo'), 180);
  const preferredContactTime = optionalText(url.searchParams.get('preferredContactTime'), 100);
  const startDate = parseDate(url.searchParams.get('startDate'), 'start');
  const endDate = parseDate(url.searchParams.get('endDate'), 'end');
  const where: Prisma.InquiryWhereInput = {};

  if (search) {
    where.OR = [
      { inquiryReference: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phoneNumber: { contains: search, mode: 'insensitive' } },
      { message: { contains: search, mode: 'insensitive' } },
      { eventInterest: { contains: search, mode: 'insensitive' } },
      { packageInterest: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (statusParam) {
    where.status = parseEnum(statusParam, Object.values(InquiryStatus), 'status');
  }
  if (priorityParam) {
    where.priority = parseEnum(priorityParam, Object.values(InquiryPriority), 'priority');
  }
  if (eventInterest) where.eventInterest = eventInterest;
  if (assignedTo === 'unassigned') where.assignedTo = null;
  else if (assignedTo) where.assignedTo = assignedTo;
  if (preferredContactTime) {
    where.preferredContactTime = { contains: preferredContactTime, mode: 'insensitive' };
  }
  if (startDate || endDate) {
    where.submittedAt = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }

  return where;
}

export async function getInquiryPage(url: URL) {
  const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 10, 5), 50);
  const where = buildAdminWhere(url);
  const [inquiries, totalRecords, eventInterests, preferredTimes, admins] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { submittedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inquiry.count({ where }),
    prisma.inquiry.findMany({
      where: { eventInterest: { not: null } },
      distinct: ['eventInterest'],
      orderBy: { eventInterest: 'asc' },
      select: { eventInterest: true },
    }),
    prisma.inquiry.findMany({
      where: { preferredContactTime: { not: null } },
      distinct: ['preferredContactTime'],
      orderBy: { preferredContactTime: 'asc' },
      select: { preferredContactTime: true },
    }),
    prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.SUPERADMIN] } },
      orderBy: [{ fullName: 'asc' }, { username: 'asc' }],
      select: { id: true, username: true, fullName: true, role: true },
    }),
  ]);

  return {
    inquiries: inquiries.map(inquiryToListDto),
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
    },
    filterOptions: {
      eventInterests: eventInterests.flatMap((item) => item.eventInterest ? [item.eventInterest] : []),
      preferredTimes: preferredTimes.flatMap((item) => item.preferredContactTime ? [item.preferredContactTime] : []),
      admins: admins.map((admin) => ({
        id: admin.id,
        username: admin.username,
        label: admin.fullName || `@${admin.username}`,
        role: admin.role,
      })),
    },
  };
}

export async function getInquiryDetail(
  id: string,
  actor: CurrentAdmin,
  request?: Request,
) {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { createdAt: 'desc' } },
      activity: { orderBy: { createdAt: 'desc' } },
      relatedBooking: {
        select: {
          id: true,
          bookingReference: true,
          eventTitle: true,
          eventDate: true,
          status: true,
        },
      },
    },
  });

  if (!inquiry) throw new InquiryError('Inquiry not found.', 404);

  await createAuditLog({
    ...auditActor(actor),
    action: AuditAction.READ,
    module: 'Inquiries',
    description: `${actor.username} viewed inquiry ${inquiry.inquiryReference}.`,
    status: AuditStatus.SUCCESS,
    ...(request ? getRequestContext(request) : {}),
    metadata: { inquiryId: inquiry.id },
  });

  return {
    ...inquiryToListDto(inquiry),
    notes: inquiry.notes.map((note) => ({
      id: note.id,
      note: note.note,
      createdBy: note.createdBy,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    })),
    activity: inquiry.activity.map((entry) => ({
      id: entry.id,
      action: entry.action,
      description: entry.description,
      performedBy: entry.performedBy,
      createdAt: entry.createdAt.toISOString(),
    })),
    relatedBooking: inquiry.relatedBooking
      ? {
          ...inquiry.relatedBooking,
          eventDate: inquiry.relatedBooking.eventDate.toISOString(),
          status: inquiry.relatedBooking.status.toLowerCase(),
        }
      : null,
  };
}

export async function getInquirySummary() {
  const [
    total,
    newCount,
    pending,
    followUp,
    answered,
    converted,
    highPriority,
  ] = await Promise.all([
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: InquiryStatus.NEW } }),
    prisma.inquiry.count({ where: { status: InquiryStatus.PENDING_RESPONSE } }),
    prisma.inquiry.count({ where: { status: InquiryStatus.FOLLOW_UP } }),
    prisma.inquiry.count({ where: { status: InquiryStatus.ANSWERED } }),
    prisma.inquiry.count({ where: { status: InquiryStatus.CONVERTED_TO_BOOKING } }),
    prisma.inquiry.count({
      where: {
        priority: InquiryPriority.HIGH,
        status: { in: [...ACTIVE_INQUIRY_STATUSES] },
      },
    }),
  ]);

  return { total, new: newCount, pending, followUp, answered, converted, highPriority };
}

export async function getInquiryAnalytics() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const inquiries = await prisma.inquiry.findMany({
    where: { submittedAt: { gte: start } },
    select: {
      submittedAt: true,
      answeredAt: true,
      status: true,
      eventInterest: true,
    },
  });
  const total = inquiries.length;
  const converted = inquiries.filter((item) => item.status === InquiryStatus.CONVERTED_TO_BOOKING).length;
  const answeredWithTime = inquiries.filter((item) => item.answeredAt);
  const averageResponseHours = answeredWithTime.length
    ? answeredWithTime.reduce((sum, item) => (
        sum + ((item.answeredAt!.getTime() - item.submittedAt.getTime()) / 3_600_000)
      ), 0) / answeredWithTime.length
    : 0;
  const eventCounts = new Map<string, number>();
  inquiries.forEach((item) => {
    const key = item.eventInterest?.trim() || 'Not specified';
    eventCounts.set(key, (eventCounts.get(key) ?? 0) + 1);
  });
  const eventInterests = Array.from(eventCounts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const monthly = Array.from({ length: 6 }, (_, index) => {
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
    const nextMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));
    const records = inquiries.filter((item) => item.submittedAt >= month && item.submittedAt < nextMonth);
    return {
      label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(month),
      inquiries: records.length,
      converted: records.filter((item) => item.status === InquiryStatus.CONVERTED_TO_BOOKING).length,
    };
  });

  return {
    total,
    converted,
    conversionRate: total ? (converted / total) * 100 : 0,
    averageResponseHours,
    unanswered: inquiries.filter((item) => (
      item.status === InquiryStatus.NEW || item.status === InquiryStatus.PENDING_RESPONSE
    )).length,
    followUp: inquiries.filter((item) => item.status === InquiryStatus.FOLLOW_UP).length,
    mostAskedEventType: eventInterests[0] ?? null,
    eventInterests,
    monthly,
  };
}

async function updateWithActivity(input: {
  inquiryId: string;
  actor: CurrentAdmin;
  data: Prisma.InquiryUpdateInput;
  action: string;
  description: string;
  request: Request;
  auditAction?: AuditAction;
  previousValues?: Record<string, unknown>;
}) {
  const existing = await prisma.inquiry.findUnique({ where: { id: input.inquiryId } });
  if (!existing) throw new InquiryError('Inquiry not found.', 404);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.inquiry.update({
      where: { id: input.inquiryId },
      data: input.data,
    });
    await activity(tx, {
      inquiryId: input.inquiryId,
      action: input.action,
      description: input.description,
      performedBy: adminLabel(input.actor),
    });
    return result;
  });

  await createAuditLog({
    ...auditActor(input.actor),
    action: input.auditAction ?? AuditAction.UPDATE,
    module: 'Inquiries',
    description: input.description,
    status: AuditStatus.SUCCESS,
    ...getRequestContext(input.request),
    previousValues: input.previousValues,
    newValues: {
      status: updated.status,
      priority: updated.priority,
      assignedTo: updated.assignedTo,
      relatedBookingId: updated.relatedBookingId,
    },
    metadata: {
      inquiryId: updated.id,
      inquiryReference: updated.inquiryReference,
    },
  });

  revalidateInquirySurfaces();
  return inquiryToListDto(updated);
}

export async function updateInquiry(
  id: string,
  body: Record<string, unknown>,
  actor: CurrentAdmin,
  request: Request,
) {
  const existing = await prisma.inquiry.findUnique({ where: { id } });
  if (!existing) throw new InquiryError('Inquiry not found.', 404);
  const data: Prisma.InquiryUpdateInput = {};

  if ('status' in body) {
    const status = parseEnum(body.status, Object.values(InquiryStatus), 'status');
    if (status === InquiryStatus.CONVERTED_TO_BOOKING && !existing.relatedBookingId) {
      throw new InquiryError('Use Convert to Booking so the inquiry remains linked to a booking.');
    }
    data.status = status;
    data.answeredAt = status === InquiryStatus.ANSWERED
      ? (existing.answeredAt ?? new Date())
      : existing.answeredAt;
    data.closedAt = status === InquiryStatus.CLOSED
      ? (existing.closedAt ?? new Date())
      : existing.closedAt;
  }
  if ('priority' in body) {
    data.priority = parseEnum(body.priority, Object.values(InquiryPriority), 'priority');
  }
  if ('eventInterest' in body) data.eventInterest = optionalText(body.eventInterest, 180);
  if ('packageInterest' in body) data.packageInterest = optionalText(body.packageInterest, 255);
  if ('preferredContactTime' in body) {
    data.preferredContactTime = optionalText(body.preferredContactTime, 100);
  }

  if (!Object.keys(data).length) throw new InquiryError('No supported inquiry changes were provided.');

  return updateWithActivity({
    inquiryId: id,
    actor,
    data,
    action: 'updated',
    description: `${actor.username} updated inquiry ${existing.inquiryReference}.`,
    request,
    previousValues: {
      status: existing.status,
      priority: existing.priority,
      eventInterest: existing.eventInterest,
      packageInterest: existing.packageInterest,
      preferredContactTime: existing.preferredContactTime,
    },
  });
}

export async function setInquiryStatus(
  id: string,
  statusValue: unknown,
  actor: CurrentAdmin,
  request: Request,
) {
  const existing = await prisma.inquiry.findUnique({ where: { id } });
  if (!existing) throw new InquiryError('Inquiry not found.', 404);
  const status = parseEnum(statusValue, Object.values(InquiryStatus), 'status');
  if (status === InquiryStatus.CONVERTED_TO_BOOKING && !existing.relatedBookingId) {
    throw new InquiryError('Use Convert to Booking so the inquiry remains linked to a booking.');
  }

  return updateWithActivity({
    inquiryId: id,
    actor,
    data: {
      status,
      answeredAt: status === InquiryStatus.ANSWERED
        ? (existing.answeredAt ?? new Date())
        : existing.answeredAt,
      closedAt: status === InquiryStatus.CLOSED
        ? (existing.closedAt ?? new Date())
        : existing.closedAt,
    },
    action: status.toLowerCase(),
    description: `${actor.username} changed inquiry ${existing.inquiryReference} from ${existing.status.toLowerCase()} to ${status.toLowerCase()}.`,
    request,
    previousValues: { status: existing.status },
  });
}

export async function assignInquiry(
  id: string,
  assignedToValue: unknown,
  actor: CurrentAdmin,
  request: Request,
) {
  const existing = await prisma.inquiry.findUnique({ where: { id } });
  if (!existing) throw new InquiryError('Inquiry not found.', 404);
  const assignedTo = optionalText(assignedToValue, 180);

  if (assignedTo) {
    const admin = await prisma.user.findFirst({
      where: {
        OR: [{ id: assignedTo }, { username: assignedTo.replace(/^@/, '') }, { fullName: assignedTo }],
        role: { in: [Role.ADMIN, Role.SUPERADMIN] },
      },
      select: { username: true, fullName: true },
    });
    if (!admin) throw new InquiryError('Assigned administrator was not found.');
    const label = admin.fullName || `@${admin.username}`;
    return updateWithActivity({
      inquiryId: id,
      actor,
      data: { assignedTo: label },
      action: 'assigned',
      description: `${actor.username} assigned inquiry ${existing.inquiryReference} to ${label}.`,
      request,
      previousValues: { assignedTo: existing.assignedTo },
    });
  }

  return updateWithActivity({
    inquiryId: id,
    actor,
    data: { assignedTo: null },
    action: 'unassigned',
    description: `${actor.username} removed the assignment from inquiry ${existing.inquiryReference}.`,
    request,
    previousValues: { assignedTo: existing.assignedTo },
  });
}

export async function addInquiryNote(
  id: string,
  noteValue: unknown,
  actor: CurrentAdmin,
  request: Request,
) {
  const note = requiredText(noteValue, 'Internal note', 2000);
  const existing = await prisma.inquiry.findUnique({ where: { id } });
  if (!existing) throw new InquiryError('Inquiry not found.', 404);

  const created = await prisma.$transaction(async (tx) => {
    const result = await tx.inquiryNote.create({
      data: {
        inquiryId: id,
        note,
        createdBy: adminLabel(actor),
      },
    });
    await activity(tx, {
      inquiryId: id,
      action: 'note_added',
      description: `${actor.username} added an internal note.`,
      performedBy: adminLabel(actor),
    });
    await tx.inquiry.update({ where: { id }, data: { updatedAt: new Date() } });
    return result;
  });

  await createAuditLog({
    ...auditActor(actor),
    action: AuditAction.CREATE,
    module: 'Inquiries',
    description: `${actor.username} added an internal note to inquiry ${existing.inquiryReference}.`,
    status: AuditStatus.SUCCESS,
    ...getRequestContext(request),
    metadata: { inquiryId: id, inquiryReference: existing.inquiryReference, noteId: created.id },
  });

  revalidateInquirySurfaces();
  return {
    id: created.id,
    note: created.note,
    createdBy: created.createdBy,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function convertInquiryToBooking(
  id: string,
  body: Record<string, unknown>,
  actor: CurrentAdmin,
  request: Request,
) {
  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry) throw new InquiryError('Inquiry not found.', 404);
  if (inquiry.relatedBookingId) {
    throw new InquiryError('This inquiry is already linked to a booking.', 409);
  }

  const bookingInput: ManualBookingInput = {
    clientName: inquiry.fullName,
    clientEmail: inquiry.email,
    clientPhone: inquiry.phoneNumber,
    eventTitle: requiredText(body.eventTitle, 'Event title', 255),
    eventType: requiredText(body.eventType ?? inquiry.eventInterest, 'Event type', 180),
    eventDate: requiredText(body.eventDate, 'Event date', 40),
    startTime: optionalText(body.startTime, 10),
    endTime: optionalText(body.endTime, 10),
    venue: requiredText(body.venue, 'Venue', 255),
    guestCount: Number(body.guestCount ?? 0),
    packageId: optionalText(body.packageId, 255),
    packageSelected: optionalText(body.packageSelected ?? inquiry.packageInterest, 255),
    specialRequests: optionalText(body.specialRequests, 2000),
    assignedCoordinator: optionalText(body.assignedCoordinator, 180),
    internalNotes: [
      `Converted from inquiry ${inquiry.inquiryReference}.`,
      `Original inquiry: ${inquiry.message}`,
      optionalText(body.internalNotes, 2000),
    ].filter(Boolean).join('\n\n'),
    conflictOverrideReason: optionalText(body.conflictOverrideReason, 1000),
  };

  const result = await createManualBooking(bookingInput, actor);
  await prisma.$transaction(async (tx) => {
    await tx.inquiry.update({
      where: { id },
      data: {
        status: InquiryStatus.CONVERTED_TO_BOOKING,
        relatedBookingId: result.booking.id,
      },
    });
    await activity(tx, {
      inquiryId: id,
      action: 'converted_to_booking',
      description: `Inquiry ${inquiry.inquiryReference} was converted to booking ${result.booking.bookingReference}.`,
      performedBy: adminLabel(actor),
    });
  });

  await createAuditLog({
    ...auditActor(actor),
    action: AuditAction.CREATE,
    module: 'Inquiries',
    description: `${actor.username} converted inquiry ${inquiry.inquiryReference} to booking ${result.booking.bookingReference}.`,
    status: AuditStatus.SUCCESS,
    ...getRequestContext(request),
    previousValues: { status: inquiry.status, relatedBookingId: null },
    newValues: {
      status: InquiryStatus.CONVERTED_TO_BOOKING,
      relatedBookingId: result.booking.id,
      bookingReference: result.booking.bookingReference,
    },
  });

  revalidateInquirySurfaces();
  return {
    bookingId: result.booking.id,
    bookingReference: result.booking.bookingReference,
    conflicts: result.conflicts,
  };
}

export function inquiryErrorResponse(error: unknown, fallback = 'Unable to process inquiry.') {
  if (error instanceof InquiryError || error instanceof BookingRequestError) {
    return Response.json(
      {
        error: error.message,
        ...('conflicts' in error ? { conflicts: error.conflicts } : {}),
      },
      { status: error.status },
    );
  }
  if (error instanceof Error && error.message.startsWith('Unauthorized')) {
    return Response.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof Error && error.message.startsWith('Forbidden')) {
    return Response.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof SyntaxError) {
    return Response.json({ error: 'The request body is invalid.' }, { status: 400 });
  }

  console.error(fallback, errorMetadata(error));
  return Response.json({ error: fallback }, { status: 500 });
}
