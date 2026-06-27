import { requireAdmin } from '@/lib/authorization';
import { listPaymentRecords, paymentErrorResponse } from '@/lib/payment-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const { summary } = await listPaymentRecords();
    return Response.json(summary);
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
