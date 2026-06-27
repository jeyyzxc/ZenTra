import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authorization';
import { triggerPaymentReminderWorkflow } from '@/services/booking-orchestration';
import { dashboardError, dashboardSuccess } from '@/lib/dashboard-api';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const body = await request.json() as { bookingId?: string; paymentRecordId?: string };
    const booking = await prisma.booking.findFirst({
      where: body.bookingId
        ? { id: body.bookingId }
        : body.paymentRecordId
          ? { paymentRecordId: body.paymentRecordId }
          : { id: '__missing_booking__' },
      select: { id: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found.' }, { status: 404 });
    }

    await triggerPaymentReminderWorkflow(booking.id, actor);

    return dashboardSuccess({ bookingId: booking.id }, 'Payment reminder workflow triggered.');
  } catch (error) {
    return dashboardError(error, 'Unable to trigger payment reminder.');
  }
}
