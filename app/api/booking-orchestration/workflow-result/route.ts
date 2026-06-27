import { NextResponse } from 'next/server';
import {
  parseAutomationStatus,
  requireBookingOrchestrationKey,
  updateBookingAutomationStatus,
} from '@/services/booking-orchestration';
import { BookingRequestError } from '@/lib/booking-validation';

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    const body = await request.json() as Record<string, unknown>;
    await updateBookingAutomationStatus({
      bookingReference: typeof body.bookingReference === 'string' ? body.bookingReference : '',
      automationStatus: parseAutomationStatus(body.automationStatus),
      workflowResult: typeof body.workflowResult === 'string' ? body.workflowResult : null,
      n8nWorkflowId: typeof body.n8nWorkflowId === 'string' ? body.n8nWorkflowId : null,
      n8nExecutionId: typeof body.n8nExecutionId === 'string' ? body.n8nExecutionId : null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Workflow result update failed.' }, { status: 500 });
  }
}
