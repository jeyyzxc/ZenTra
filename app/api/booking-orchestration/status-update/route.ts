import { NextResponse } from 'next/server';
import {
  changeBookingStatus,
  parseBookingStatus,
  requireBookingOrchestrationKey,
  workflowActor,
} from '@/services/booking-orchestration';
import { BookingRequestError } from '@/lib/booking-validation';

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    const body = await request.json() as {
      bookingReference?: unknown;
      newStatus?: unknown;
      reason?: unknown;
      n8nExecutionId?: unknown;
    };
    const bookingReference = typeof body.bookingReference === 'string'
      ? body.bookingReference
      : '';
    const booking = await changeBookingStatus({
      bookingReference,
      newStatus: parseBookingStatus(body.newStatus),
      reason: typeof body.reason === 'string' ? body.reason : '',
      actor: workflowActor('n8n status workflow'),
      n8nExecutionId: typeof body.n8nExecutionId === 'string' ? body.n8nExecutionId : null,
    });

    return NextResponse.json({ bookingId: booking.id });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Booking status update failed.' }, { status: 500 });
  }
}
