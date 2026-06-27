import { NextResponse } from 'next/server';
import {
  parseBookingSource,
  requireBookingOrchestrationKey,
  type BookingUpsertInput,
  upsertBookingFromWorkflow,
} from '@/services/booking-orchestration';
import { BookingRequestError } from '@/lib/booking-validation';

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    const body = await request.json() as BookingUpsertInput & { bookingSource?: unknown };
    const result = await upsertBookingFromWorkflow({
      ...body,
      ...(body.bookingSource ? { bookingSource: parseBookingSource(body.bookingSource) } : {}),
    });

    return NextResponse.json({
      bookingId: result.booking.id,
      bookingReference: result.booking.bookingReference,
      created: result.created,
      conflicts: result.conflicts,
      syncStatus: result.booking.syncStatus,
    }, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return NextResponse.json({
        error: error.message,
        conflicts: error.conflicts,
      }, { status: error.status });
    }

    return NextResponse.json({ error: 'Booking upsert failed.' }, { status: 500 });
  }
}
