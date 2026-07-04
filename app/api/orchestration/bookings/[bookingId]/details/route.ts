import { getBookingDetailsForOrchestration } from '@/services/booking-orchestration';
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
    const result = await getBookingDetailsForOrchestration({
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
      booking: result.booking,
      categorization: result.categorization,
    });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return Response.json({
        success: false,
        message: error.message,
      }, { status: error.status });
    }

    console.error('[n8n] Booking details endpoint failed.', {
      event: 'booking.details_endpoint_failed',
      error_message_safe: error instanceof Error ? error.message : 'Unknown error',
      created_at: new Date().toISOString(),
    });

    return Response.json({
      success: false,
      message: 'Unable to fetch booking details.',
    }, { status: 500 });
  }
}
