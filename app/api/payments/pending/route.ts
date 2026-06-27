import { requireAdmin } from '@/lib/authorization';
import { getPendingPayments, paymentErrorResponse } from '@/lib/payment-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return Response.json(await getPendingPayments());
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
