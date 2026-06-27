import { requireAdmin } from '@/lib/authorization';
import {
  createPaymentRecord,
  listPaymentRecords,
  paymentErrorResponse,
} from '@/lib/payment-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const params = new URL(request.url).searchParams;
    return Response.json(await listPaymentRecords({
      search: params.get('search') ?? undefined,
      dateFrom: params.get('dateFrom') ?? undefined,
      dateTo: params.get('dateTo') ?? undefined,
      eventType: params.get('eventType') ?? undefined,
      packageName: params.get('package') ?? undefined,
      paymentType: params.get('paymentType') ?? undefined,
      status: params.get('status') ?? undefined,
      dueStatus: params.get('dueStatus') ?? undefined,
      verificationStatus: params.get('verificationStatus') ?? undefined,
      coordinator: params.get('coordinator') ?? undefined,
      month: params.get('month') ?? undefined,
    }));
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const input = await request.json() as Record<string, unknown>;
    const payment = await createPaymentRecord(input, actor);
    return Response.json({ success: true, paymentId: payment.id }, { status: 201 });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
