import { requireAdmin } from '@/lib/authorization';
import { getOverduePayments, paymentErrorResponse } from '@/lib/payment-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return Response.json(await getOverduePayments());
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
