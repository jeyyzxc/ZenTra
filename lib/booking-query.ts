import {
  AutomationStatus,
  Booking,
  BookingSource,
  BookingStatus,
  BookingTimeline,
  PaymentSummaryStatus,
  Prisma,
  SyncStatus,
} from '@prisma/client';
import { findBookingConflicts } from '@/lib/booking-validation';
import { prisma } from '@/lib/prisma';

export const BOOKING_STATUSES = Object.values(BookingStatus);
export const BOOKING_SOURCES: BookingSource[] = Object.values(BookingSource).filter(
  (source) => source !== BookingSource.DEMO_CLIENT_ADMIN_BRIDGE,
);
export const BOOKING_SYNC_STATUSES = Object.values(SyncStatus);
export const BOOKING_AUTOMATION_STATUSES: AutomationStatus[] = Object.values(AutomationStatus).filter(
  (status) => status !== AutomationStatus.DEMO_MODE,
);
export const BOOKING_PAYMENT_STATUSES = Object.values(PaymentSummaryStatus);

const SORT_FIELDS = [
  'bookingReference',
  'clientName',
  'eventTitle',
  'eventDate',
  'status',
  'paymentSummaryStatus',
  'bookingSource',
  'syncStatus',
  'automationStatus',
  'assignedCoordinator',
  'updatedAt',
] as const;

export type BookingSortField = (typeof SORT_FIELDS)[number];

export type BookingTimelineDto = {
  id: string;
  action: string;
  source: string;
  performedBy: string;
  description: string;
  metadata: unknown;
  createdAt: string;
};

export type BookingDto = Omit<
  Booking,
  'eventDate' | 'statusChangedAt' | 'paymentDueDate' | 'paymentLastDate' |
  'lastSyncedAt' | 'createdAt' | 'updatedAt'
> & {
  eventDate: string;
  statusChangedAt: string | null;
  paymentDueDate: string | null;
  paymentLastDate: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  timeline?: BookingTimelineDto[];
  conflicts?: Awaited<ReturnType<typeof findBookingConflicts>>;
  latestEmail?: {
    id: string;
    emailType: string;
    status: string;
    lastAttemptAt: string | null;
    createdAt: string;
  } | null;
};

export class BookingQueryError extends Error {
  status = 400;
}

function readParam(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key)?.trim();
  return value || undefined;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseDate(value: string | undefined, label: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new BookingQueryError(`${label} must be a valid ISO 8601 date.`);
  }

  return parsed;
}

function parseEnum<T extends string>(value: string | undefined, options: readonly T[], label: string) {
  if (!value) {
    return undefined;
  }

  if (!options.includes(value as T)) {
    throw new BookingQueryError(`${label} is not supported.`);
  }

  return value as T;
}

export function serializeBooking(
  booking: Booking & { timeline?: BookingTimeline[] },
): BookingDto {
  const { timeline, ...record } = booking;
  const bookingSource = booking.bookingSource === BookingSource.DEMO_CLIENT_ADMIN_BRIDGE
    ? BookingSource.ADMIN_MANUAL
    : booking.bookingSource;
  const automationStatus = booking.automationStatus === AutomationStatus.DEMO_MODE
    ? AutomationStatus.NOT_STARTED
    : booking.automationStatus;

  return {
    ...record,
    bookingSource,
    automationStatus,
    eventDate: booking.eventDate.toISOString(),
    statusChangedAt: booking.statusChangedAt?.toISOString() ?? null,
    paymentDueDate: booking.paymentDueDate?.toISOString() ?? null,
    paymentLastDate: booking.paymentLastDate?.toISOString() ?? null,
    lastSyncedAt: booking.lastSyncedAt?.toISOString() ?? null,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    ...(timeline
      ? {
          timeline: timeline.map((entry) => ({
            id: entry.id,
            action: entry.action,
            source: entry.source,
            performedBy: entry.performedBy,
            description: entry.description,
            metadata: entry.metadata,
            createdAt: entry.createdAt.toISOString(),
          })),
        }
      : {}),
  };
}

export function buildBookingQuery(searchParams: URLSearchParams) {
  const search = readParam(searchParams, 'search');
  const startDate = parseDate(readParam(searchParams, 'startDate'), 'startDate');
  const endDate = parseDate(readParam(searchParams, 'endDate'), 'endDate');
  const status = parseEnum(readParam(searchParams, 'status'), BOOKING_STATUSES, 'status');
  const paymentStatus = parseEnum(
    readParam(searchParams, 'paymentStatus'),
    BOOKING_PAYMENT_STATUSES,
    'paymentStatus',
  );
  const source = parseEnum(readParam(searchParams, 'source'), BOOKING_SOURCES, 'source');
  const syncStatus = parseEnum(
    readParam(searchParams, 'syncStatus'),
    BOOKING_SYNC_STATUSES,
    'syncStatus',
  );
  const automationStatus = parseEnum(
    readParam(searchParams, 'automationStatus'),
    BOOKING_AUTOMATION_STATUSES,
    'automationStatus',
  );
  const coordinator = readParam(searchParams, 'coordinator');
  const eventType = readParam(searchParams, 'eventType');
  const sortByParam = readParam(searchParams, 'sortBy');
  const sortBy = sortByParam && SORT_FIELDS.includes(sortByParam as BookingSortField)
    ? sortByParam as BookingSortField
    : 'updatedAt';
  const sortOrder = readParam(searchParams, 'sortOrder') === 'asc' ? 'asc' : 'desc';

  if (startDate && endDate && startDate > endDate) {
    throw new BookingQueryError('startDate must be earlier than or equal to endDate.');
  }

  const where: Prisma.BookingWhereInput = {
    ...(search
      ? {
          OR: [
            { bookingReference: { contains: search, mode: 'insensitive' } },
            { clientName: { contains: search, mode: 'insensitive' } },
            { clientEmail: { contains: search, mode: 'insensitive' } },
            { eventTitle: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(startDate || endDate
      ? {
          eventDate: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {}),
    ...(status ? { status } : {}),
    ...(paymentStatus ? { paymentSummaryStatus: paymentStatus } : {}),
    ...(source ? { bookingSource: source } : {}),
    ...(syncStatus ? { syncStatus } : {}),
    ...(automationStatus ? { automationStatus } : {}),
    ...(coordinator ? { assignedCoordinator: coordinator } : {}),
    ...(eventType ? { eventType } : {}),
  };

  const statusGroupOrder: Prisma.BookingOrderByWithRelationInput = { status: 'asc' };
  const requestedOrder: Prisma.BookingOrderByWithRelationInput = { [sortBy]: sortOrder };

  return {
    where,
    orderBy: sortBy === 'status'
      ? [requestedOrder, { updatedAt: 'desc' } as Prisma.BookingOrderByWithRelationInput]
      : [statusGroupOrder, requestedOrder],
  };
}

export async function getBookingPage(searchParams: URLSearchParams) {
  const page = parsePositiveInt(readParam(searchParams, 'page'), 1);
  const limit = Math.min(parsePositiveInt(readParam(searchParams, 'limit'), 10), 100);
  const query = buildBookingQuery(searchParams);

  const [bookings, totalRecords] = await prisma.$transaction([
    prisma.booking.findMany({
      where: query.where,
      orderBy: query.orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where: query.where }),
  ]);

  return {
    bookings: bookings.map(serializeBooking),
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
    },
  };
}

export async function getBookingDetail(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      timeline: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!booking) {
    return null;
  }

  const [conflicts, latestEmail] = await Promise.all([
    findBookingConflicts({
      eventDate: booking.eventDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      venue: booking.venue,
      excludeBookingId: booking.id,
    }),
    prisma.emailLog.findFirst({
      where: {
        OR: [
          ...(booking.emailLogReferenceId ? [{ id: booking.emailLogReferenceId }] : []),
          {
            relatedModule: 'BOOKING',
            relatedRecordId: booking.id,
          },
          {
            relatedModule: 'BOOKING',
            relatedRecordId: booking.bookingReference,
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        emailType: true,
        status: true,
        relatedRecordId: true,
        lastAttemptAt: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    ...serializeBooking(booking),
    conflicts,
    latestEmail: latestEmail
      ? {
          ...latestEmail,
          lastAttemptAt: latestEmail.lastAttemptAt?.toISOString() ?? null,
          createdAt: latestEmail.createdAt.toISOString(),
        }
      : null,
  };
}

export async function getBookingFilterOptions() {
  const [coordinators, eventTypes] = await Promise.all([
    prisma.booking.findMany({
      where: { assignedCoordinator: { not: null } },
      distinct: ['assignedCoordinator'],
      select: { assignedCoordinator: true },
      orderBy: { assignedCoordinator: 'asc' },
    }),
    prisma.booking.findMany({
      distinct: ['eventType'],
      select: { eventType: true },
      orderBy: { eventType: 'asc' },
    }),
  ]);

  return {
    coordinators: coordinators
      .map((item) => item.assignedCoordinator)
      .filter((value): value is string => Boolean(value)),
    eventTypes: eventTypes.map((item) => item.eventType),
  };
}
