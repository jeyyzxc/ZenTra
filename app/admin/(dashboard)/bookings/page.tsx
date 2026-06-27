import { Role } from '@prisma/client';
import { requireAdmin } from '@/lib/authorization';
import {
  BOOKING_AUTOMATION_STATUSES,
  BOOKING_PAYMENT_STATUSES,
  BOOKING_SOURCES,
  BOOKING_STATUSES,
  BOOKING_SYNC_STATUSES,
  getBookingFilterOptions,
} from '@/lib/booking-query';
import { prisma } from '@/lib/prisma';
import BookingsClient from './components/BookingsClient';

export const dynamic = 'force-dynamic';

export default async function BookingManagement() {
  const currentAdmin = await requireAdmin();
  const [filterOptions, admins] = await Promise.all([
    getBookingFilterOptions(),
    prisma.user.findMany({
      where: {
        role: { in: [Role.SUPERADMIN, Role.ADMIN] },
      },
      select: {
        username: true,
        fullName: true,
      },
      orderBy: { username: 'asc' },
    }),
  ]);
  const coordinatorOptions = Array.from(new Set([
    ...filterOptions.coordinators,
    ...admins.map((admin) => admin.fullName || `@${admin.username}`),
  ]));
  const eventTypeOptions = Array.from(new Set([
    'Wedding',
    'Debut',
    'Christening',
    'Party',
    'Corporate',
    ...filterOptions.eventTypes,
  ]));

  return (
    <BookingsClient
      automationOptions={BOOKING_AUTOMATION_STATUSES}
      coordinatorOptions={coordinatorOptions}
      currentUserRole={currentAdmin.role}
      eventTypeOptions={eventTypeOptions}
      paymentOptions={BOOKING_PAYMENT_STATUSES}
      sourceOptions={BOOKING_SOURCES}
      statusOptions={BOOKING_STATUSES}
      syncOptions={BOOKING_SYNC_STATUSES}
    />
  );
}
