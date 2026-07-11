import { NextResponse } from 'next/server';
import {
  createClientBooking,
  type ClientBookingInput,
} from '@/services/booking-orchestration';
import { BookingRequestError } from '@/lib/booking-validation';
import { requireClientFeature, settingsErrorResponse } from '@/lib/system-settings';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await requireClientFeature('bookingRequests');
    const body = await request.json() as ClientBookingInput;
    const result = await createClientBooking(body);

    return NextResponse.json({
      bookingId: result.booking.id,
      bookingReference: result.booking.bookingReference,
      conflicts: result.conflicts,
      message: 'Your booking request has been submitted successfully. Please wait for confirmation from Zion Events Place.',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return NextResponse.json({
        error: error.message,
        conflicts: error.conflicts,
      }, { status: error.status });
    }

    return settingsErrorResponse(error, 'Unable to submit your booking request.');
  }
}
