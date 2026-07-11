import { NextResponse } from 'next/server';
import {
  requireBookingOrchestrationKey,
  requireN8nWorkflowHeaders,
  updateBookingEmailStatus,
} from '@/services/booking-orchestration';
import { BookingRequestError } from '@/lib/booking-validation';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    bookingId?: string;
  }>;
};

function jsonError(error: string, status: number) {
  return NextResponse.json({
    success: false,
    error,
  }, { status });
}

function methodNotAllowed() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed.',
  }, {
    status: 405,
    headers: { Allow: 'PATCH' },
  });
}

async function readJsonBody(request: Request) {
  try {
    return await request.json() as Record<string, unknown>;
  } catch {
    throw new BookingRequestError('Invalid JSON body.', 400);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    requireBookingOrchestrationKey(request);
    requireN8nWorkflowHeaders(request);

    const { bookingId } = await context.params;
    const body = await readJsonBody(request);
    const data = await updateBookingEmailStatus({
      bookingId: bookingId ?? '',
      emailStatus: body.emailStatus,
      emailType: body.emailType,
      lastEmailSentAt: body.lastEmailSentAt,
      workflowExecutionId: body.workflowExecutionId,
      emailLogReference: body.emailLogReference,
    });

    return NextResponse.json({
      success: true,
      message: 'Booking email status updated successfully.',
      data,
    });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return jsonError(error.message, error.status);
    }

    console.error('Failed to update booking email status.', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return jsonError('Failed to update booking email status.', 500);
  }
}

export const GET = methodNotAllowed;
export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const DELETE = methodNotAllowed;
