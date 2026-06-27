import { requireAdmin } from '@/lib/authorization';
import { listPaymentHistory, paymentErrorResponse } from '@/lib/payment-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const paymentId = new URL(request.url).searchParams.get('paymentId') ?? undefined;
    return Response.json(await listPaymentHistory(paymentId));
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
