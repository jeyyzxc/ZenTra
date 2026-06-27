import { requireAdmin } from '@/lib/authorization';
import { getPaymentsForBooking, paymentErrorResponse } from '@/lib/payment-service';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ bookingId: string }> },
) {
  try {
    await requireAdmin();
    const { bookingId } = await context.params;
    return Response.json(await getPaymentsForBooking(bookingId));
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
