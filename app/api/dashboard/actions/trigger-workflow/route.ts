import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authorization';
import {
  triggerBookingConfirmationWorkflow,
  triggerContractPreparationWorkflow,
  triggerPaymentReminderWorkflow,
} from '@/services/booking-orchestration';
import { dashboardError, dashboardSuccess } from '@/lib/dashboard-api';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const body = await request.json() as { bookingId?: string; workflow?: string };

    if (!body.bookingId || !body.workflow) {
      return NextResponse.json({ success: false, error: 'bookingId and workflow are required.' }, { status: 400 });
    }

    if (body.workflow === 'payment_reminder') {
      await triggerPaymentReminderWorkflow(body.bookingId, actor);
    } else if (body.workflow === 'contract_preparation') {
      await triggerContractPreparationWorkflow(body.bookingId, actor);
    } else if (body.workflow === 'booking_confirmation') {
      await triggerBookingConfirmationWorkflow(body.bookingId, actor);
    } else {
      return NextResponse.json({ success: false, error: 'Unsupported workflow.' }, { status: 400 });
    }

    return dashboardSuccess({
      bookingId: body.bookingId,
      workflow: body.workflow,
    }, 'Workflow trigger recorded successfully.');
  } catch (error) {
    return dashboardError(error, 'Unable to trigger workflow.');
  }
}
