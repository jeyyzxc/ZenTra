import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authorization';
import {
  type BookingEditInput,
  updateManualBooking,
} from '@/services/booking-orchestration';
import { getBookingDetail } from '@/lib/booking-query';
import { BookingRequestError } from '@/lib/booking-validation';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const booking = await getBookingDetail(id);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Unable to load this booking.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await context.params;
    const body = await request.json() as BookingEditInput;
    const result = await updateManualBooking(id, body, actor);

    return NextResponse.json({
      bookingId: result.booking.id,
      conflicts: result.conflicts,
    });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return NextResponse.json({
        error: error.message,
        conflicts: error.conflicts,
      }, { status: error.status });
    }

    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Unable to update booking.' }, { status: 500 });
  }
}
