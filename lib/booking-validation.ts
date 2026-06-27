import { BookingStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const TERMINAL_BOOKING_STATUSES = [
  BookingStatus.COMPLETED,
  BookingStatus.DECLINED,
  BookingStatus.CANCELLED,
  BookingStatus.EXPIRED,
] as const;

export const VALID_BOOKING_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  [BookingStatus.PENDING]: [
    BookingStatus.CONFIRMED,
    BookingStatus.DECLINED,
    BookingStatus.CANCELLED,
    BookingStatus.ON_HOLD,
    BookingStatus.EXPIRED,
  ],
  [BookingStatus.CONFIRMED]: [
    BookingStatus.IN_PROGRESS,
    BookingStatus.RESCHEDULED,
    BookingStatus.CANCELLED,
    BookingStatus.ON_HOLD,
  ],
  [BookingStatus.RESCHEDULED]: [
    BookingStatus.CONFIRMED,
    BookingStatus.CANCELLED,
    BookingStatus.DECLINED,
  ],
  [BookingStatus.IN_PROGRESS]: [
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.ON_HOLD]: [
    BookingStatus.PENDING,
    BookingStatus.CONFIRMED,
    BookingStatus.CANCELLED,
    BookingStatus.DECLINED,
  ],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.DECLINED]: [],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.EXPIRED]: [],
};

export type BookingConflict = {
  id: string;
  bookingReference: string;
  clientName: string;
  eventTitle: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  venue: string;
  status: BookingStatus;
};

export class BookingRequestError extends Error {
  constructor(
    message: string,
    public status = 400,
    public conflicts: BookingConflict[] = [],
  ) {
    super(message);
  }
}

function timeToMinutes(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

  if (!match) {
    throw new BookingRequestError('Time values must use the HH:mm 24-hour format.');
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

export function validateTimeRange(startTime?: string | null, endTime?: string | null) {
  if (!startTime && !endTime) {
    return;
  }

  if (!startTime || !endTime) {
    throw new BookingRequestError('Start time and end time must be provided together.');
  }

  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    throw new BookingRequestError('End time must be later than start time.');
  }
}

export function parseBookingDate(value: unknown, label = 'eventDate') {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    throw new BookingRequestError(`${label} is required.`);
  }

  const parsed = value instanceof Date
    ? new Date(value)
    : /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00.000Z`)
      : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new BookingRequestError(`${label} must be a valid date.`);
  }

  return parsed;
}

export function validateStatusTransition(input: {
  currentStatus: BookingStatus;
  newStatus: BookingStatus;
  actorRole: string;
  overrideReason?: string | null;
}) {
  if (input.currentStatus === input.newStatus) {
    throw new BookingRequestError('The booking already has the requested status.');
  }

  const isExpiredReopen =
    input.currentStatus === BookingStatus.EXPIRED &&
    input.newStatus === BookingStatus.PENDING;
  const isNormallyAllowed = VALID_BOOKING_TRANSITIONS[input.currentStatus].includes(input.newStatus);

  if (isNormallyAllowed && !isExpiredReopen) {
    return { overridden: false };
  }

  if (input.actorRole !== Role.SUPERADMIN) {
    throw new BookingRequestError(
      `Status cannot change from ${input.currentStatus} to ${input.newStatus}.`,
    );
  }

  if (!input.overrideReason || input.overrideReason.trim().length < 10) {
    throw new BookingRequestError(
      'A Super Admin override reason of at least 10 characters is required.',
    );
  }

  return { overridden: true };
}

export async function findBookingConflicts(input: {
  eventDate: Date;
  startTime?: string | null;
  endTime?: string | null;
  venue: string;
  excludeBookingId?: string;
}): Promise<BookingConflict[]> {
  validateTimeRange(input.startTime, input.endTime);

  if (!input.startTime || !input.endTime) {
    return [];
  }

  const dayStart = new Date(input.eventDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const candidates = await prisma.booking.findMany({
    where: {
      ...(input.excludeBookingId ? { id: { not: input.excludeBookingId } } : {}),
      venue: {
        equals: input.venue.trim(),
        mode: 'insensitive',
      },
      eventDate: {
        gte: dayStart,
        lt: dayEnd,
      },
      status: {
        notIn: [...TERMINAL_BOOKING_STATUSES],
      },
      startTime: { not: null },
      endTime: { not: null },
    },
    select: {
      id: true,
      bookingReference: true,
      clientName: true,
      eventTitle: true,
      eventDate: true,
      startTime: true,
      endTime: true,
      venue: true,
      status: true,
    },
  });

  const requestedStart = timeToMinutes(input.startTime);
  const requestedEnd = timeToMinutes(input.endTime);

  return candidates
    .filter((candidate) => {
      if (!candidate.startTime || !candidate.endTime) {
        return false;
      }

      return requestedStart < timeToMinutes(candidate.endTime) &&
        requestedEnd > timeToMinutes(candidate.startTime);
    })
    .map((candidate) => ({
      ...candidate,
      eventDate: candidate.eventDate.toISOString(),
    }));
}

export function assertConflictOverride(input: {
  conflicts: BookingConflict[];
  actorRole: string;
  overrideReason?: string | null;
}) {
  if (input.conflicts.length === 0) {
    return false;
  }

  if (input.actorRole !== Role.SUPERADMIN) {
    throw new BookingRequestError(
      `Schedule conflict detected with booking ${input.conflicts[0].bookingReference}.`,
      409,
      input.conflicts,
    );
  }

  if (!input.overrideReason || input.overrideReason.trim().length < 10) {
    throw new BookingRequestError(
      `Schedule conflict detected with booking ${input.conflicts[0].bookingReference}. A Super Admin override reason of at least 10 characters is required to proceed.`,
      409,
      input.conflicts,
    );
  }

  return true;
}
