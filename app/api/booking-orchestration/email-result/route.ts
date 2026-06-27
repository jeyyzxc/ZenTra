import { NextResponse } from 'next/server';
import {
  parseEmailStatus,
  parseEmailType,
  requireBookingOrchestrationKey,
  saveBookingEmailResult,
} from '@/services/booking-orchestration';
import { BookingRequestError } from '@/lib/booking-validation';

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    const body = await request.json() as Record<string, unknown>;
    await saveBookingEmailResult({
      bookingReference: typeof body.bookingReference === 'string' ? body.bookingReference : '',
      emailType: parseEmailType(body.emailType),
      recipientEmail: typeof body.recipientEmail === 'string' ? body.recipientEmail : '',
      recipientName: typeof body.recipientName === 'string' ? body.recipientName : null,
      subject: typeof body.subject === 'string' ? body.subject : '',
      status: parseEmailStatus(body.status),
      workflowName: typeof body.workflowName === 'string' ? body.workflowName : null,
      n8nExecutionId: typeof body.n8nExecutionId === 'string' ? body.n8nExecutionId : null,
      providerMessageId: typeof body.providerMessageId === 'string' ? body.providerMessageId : null,
      errorMessage: typeof body.errorMessage === 'string' ? body.errorMessage : null,
      failureReason: typeof body.failureReason === 'string' ? body.failureReason : null,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Email result logging failed.' }, { status: 500 });
  }
}
