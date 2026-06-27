import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authorization';
import {
  createManualBooking,
  type ManualBookingInput,
} from '@/services/booking-orchestration';
import { getBookingPage, BookingQueryError } from '@/lib/booking-query';
import { BookingRequestError } from '@/lib/booking-validation';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const result = await getBookingPage(new URL(request.url).searchParams);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BookingQueryError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Unable to load bookings.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const body = await request.json() as ManualBookingInput;
    const result = await createManualBooking(body, actor);

    return NextResponse.json({
      bookingId: result.booking.id,
      conflicts: result.conflicts,
    }, { status: 201 });
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

    return NextResponse.json({ error: 'Unable to create booking.' }, { status: 500 });
  }
}
