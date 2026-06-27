import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authorization';
import {
  resyncBooking,
  triggerBookingConfirmationWorkflow,
  triggerContractPreparationWorkflow,
  triggerPaymentReminderWorkflow,
} from '@/services/booking-orchestration';
import { BookingRequestError } from '@/lib/booking-validation';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const body = await request.json() as { action?: string };

    if (body.action === 'confirmation') {
      await triggerBookingConfirmationWorkflow(id, admin);
    } else if (body.action === 'payment-reminder') {
      await triggerPaymentReminderWorkflow(id, admin);
    } else if (body.action === 'contract') {
      await triggerContractPreparationWorkflow(id, admin);
    } else if (body.action === 'resync') {
      await resyncBooking(id, admin);
    } else {
      throw new BookingRequestError('Automation action is not supported.');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Unable to trigger booking automation.' }, { status: 500 });
  }
}
