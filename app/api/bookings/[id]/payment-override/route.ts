import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authorization';
import {
  overrideBookingPaymentStatus,
  parsePaymentSummaryStatus,
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
      paymentSummaryStatus?: unknown;
      reason?: unknown;
    };
    const booking = await overrideBookingPaymentStatus({
      bookingId: id,
      paymentSummaryStatus: parsePaymentSummaryStatus(body.paymentSummaryStatus),
      reason: typeof body.reason === 'string' ? body.reason : '',
      admin,
    });

    return NextResponse.json({ bookingId: booking.id });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Unable to override payment summary.' }, { status: 500 });
  }
}
