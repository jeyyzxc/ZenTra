import { BookingStatus, EventStatus } from '@prisma/client';
import { BookingRequestError, parseBookingDate } from '@/lib/booking-validation';
import { prisma } from '@/lib/prisma';

const ACTIVE_BOOKING_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.RESCHEDULED,
  BookingStatus.ON_HOLD,
] as const;

const ACTIVE_EVENT_STATUSES = [
  EventStatus.PENDING,
  EventStatus.CONFIRMED,
] as const;

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseMonth(value: string | null) {
  const month = value?.trim();

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw new BookingRequestError('month must use YYYY-MM format.');
  }

  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;

  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    throw new BookingRequestError('month must be a valid calendar month.');
  }

  return {
    month,
    start: new Date(Date.UTC(year, monthIndex, 1)),
    end: new Date(Date.UTC(year, monthIndex + 1, 1)),
  };
}

function dayRange(value: string | Date) {
  const date = parseBookingDate(value, 'eventDate');
  const dateKey = toDateKey(date);
  const start = new Date(`${dateKey}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

export async function getClientCalendarAvailability(monthValue: string | null) {
  const { month, start, end } = parseMonth(monthValue);
  const [bookings, events] = await Promise.all([
    prisma.booking.findMany({
      where: {
        eventDate: {
          gte: start,
          lt: end,
        },
        status: {
          in: [...ACTIVE_BOOKING_STATUSES],
        },
      },
      select: {
        eventDate: true,
      },
    }),
    prisma.event.findMany({
      where: {
        date: {
          gte: start,
          lt: end,
        },
        status: {
          in: [...ACTIVE_EVENT_STATUSES],
        },
      },
      select: {
        date: true,
      },
    }),
  ]);

  const bookedDateSet = new Set([
    ...bookings.map((booking) => toDateKey(booking.eventDate)),
    ...events.map((event) => toDateKey(event.date)),
  ]);

  return {
    month,
    bookedDates: [...bookedDateSet].sort(),
  };
}

export async function assertClientBookingDateAvailable(eventDate: string | Date) {
  const { start, end } = dayRange(eventDate);
  const [bookingCount, eventCount] = await Promise.all([
    prisma.booking.count({
      where: {
        eventDate: {
          gte: start,
          lt: end,
        },
        status: {
          in: [...ACTIVE_BOOKING_STATUSES],
        },
      },
    }),
    prisma.event.count({
      where: {
        date: {
          gte: start,
          lt: end,
        },
        status: {
          in: [...ACTIVE_EVENT_STATUSES],
        },
      },
    }),
  ]);

  if (bookingCount > 0 || eventCount > 0) {
    throw new BookingRequestError(
      'This date already has an active event in the admin calendar. Please choose another available date.',
      409,
    );
  }
}
