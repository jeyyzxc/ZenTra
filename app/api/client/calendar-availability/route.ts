import { BookingRequestError } from '@/lib/booking-validation';
import { getClientCalendarAvailability } from '@/lib/client-calendar-availability';
import { requireClientFeature, settingsErrorResponse } from '@/lib/system-settings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireClientFeature('bookingRequests');
    const month = new URL(request.url).searchParams.get('month');

    return Response.json({
      data: await getClientCalendarAvailability(month),
    });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return settingsErrorResponse(error, 'Unable to load calendar availability.');
  }
}
