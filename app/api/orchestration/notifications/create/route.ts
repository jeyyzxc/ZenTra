import {
  enforceOrchestrationRateLimit,
  requireBookingOrchestrationKey,
  requireBookingReferenceHeader,
  requireN8nWorkflowHeaders,
} from '@/services/booking-orchestration';
import { dashboardCreated, dashboardError } from '@/lib/dashboard-api';
import {
  DashboardService,
  DashboardServiceError,
  type NotificationInput,
} from '@/lib/dashboard-service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    requireN8nWorkflowHeaders(request);
    const body = await request.json() as NotificationInput;
    const bookingReference = requireBookingReferenceHeader(
      request,
      typeof body.bookingReference === 'string' ? body.bookingReference : null,
    );
    const relatedRecordId = typeof body.relatedRecordId === 'string'
      ? body.relatedRecordId.trim()
      : '';
    const booking = await prisma.booking.findFirst({
      where: { id: relatedRecordId, bookingReference },
      select: { id: true },
    });

    if (!booking) {
      throw new DashboardServiceError('Booking reference does not match the notification booking.', 403);
    }

    await enforceOrchestrationRateLimit({
      request,
      scope: 'booking-notification-write',
    });

    const notification = await DashboardService.createNotification(body);

    return dashboardCreated({ id: notification.id }, 'Dashboard notification created successfully.');
  } catch (error) {
    return dashboardError(error, 'Unable to create dashboard notification.');
  }
}
