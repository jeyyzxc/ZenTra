import { NextResponse } from 'next/server';
import {
  parsePaymentSummaryStatus,
  requireBookingOrchestrationKey,
  syncBookingPaymentSummary,
} from '@/services/booking-orchestration';
import { BookingRequestError } from '@/lib/booking-validation';

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    const body = await request.json() as Record<string, unknown>;
    await syncBookingPaymentSummary({
      bookingReference: typeof body.bookingReference === 'string' ? body.bookingReference : '',
      paymentRecordId: typeof body.paymentRecordId === 'string' ? body.paymentRecordId : null,
      paymentSummaryStatus: parsePaymentSummaryStatus(body.paymentSummaryStatus),
      totalAmount: typeof body.totalAmount === 'number' ? body.totalAmount : null,
      amountPaid: typeof body.amountPaid === 'number' ? body.amountPaid : null,
      remainingBalance: typeof body.remainingBalance === 'number' ? body.remainingBalance : null,
      dueDate: typeof body.dueDate === 'string' ? body.dueDate : null,
      lastPaymentDate: typeof body.lastPaymentDate === 'string' ? body.lastPaymentDate : null,
      paymentReference: typeof body.paymentReference === 'string' ? body.paymentReference : null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Payment summary sync failed.' }, { status: 500 });
  }
}
