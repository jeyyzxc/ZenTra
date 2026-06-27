import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authorization';
import {
  adminActor,
  changeBookingStatus,
  parseBookingStatus,
} from '@/services/booking-orchestration';
import { BookingRequestError } from '@/lib/booking-validation';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const body = await request.json() as {
      newStatus?: unknown;
      reason?: unknown;
      overrideReason?: unknown;
    };
    const booking = await changeBookingStatus({
      id,
      newStatus: parseBookingStatus(body.newStatus),
      reason: typeof body.reason === 'string' ? body.reason : '',
      overrideReason: typeof body.overrideReason === 'string' ? body.overrideReason : null,
      actor: adminActor(admin),
    });

    return NextResponse.json({ bookingId: booking.id });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Unable to update booking status.' }, { status: 500 });
  }
}
