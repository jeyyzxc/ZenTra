import { getBookingReceiptEmailForOrchestration } from '@/services/booking-orchestration';
import { BookingRequestError } from '@/lib/booking-validation';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    bookingId?: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { bookingId } = await context.params;
    const result = await getBookingReceiptEmailForOrchestration({
      bookingId: bookingId ?? '',
      request,
    });

    if (!result) {
      return Response.json({
        success: false,
        message: 'Booking not found.',
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return Response.json({
        success: false,
        message: error.message,
      }, { status: error.status });
    }

    console.error('[n8n] Booking receipt email endpoint failed.', {
      event: 'booking.receipt_email_endpoint_failed',
      error_message_safe: error instanceof Error ? error.message : 'Unknown error',
      created_at: new Date().toISOString(),
    });

    return Response.json({
      success: false,
      message: 'Unable to prepare booking receipt email.',
    }, { status: 500 });
  }
}
