import { BookingRequestError } from '@/lib/booking-validation';
import { getClientCalendarAvailability } from '@/lib/client-calendar-availability';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const month = new URL(request.url).searchParams.get('month');

    return Response.json({
      data: await getClientCalendarAvailability(month),
    });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json({
      error: 'Unable to load calendar availability.',
    }, { status: 500 });
  }
}
