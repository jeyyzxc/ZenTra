import { requireAdmin } from '@/lib/authorization';
import { getMonthlyRevenue, paymentErrorResponse } from '@/lib/payment-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const month = new URL(request.url).searchParams.get('month') ?? undefined;
    return Response.json(await getMonthlyRevenue(month));
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
