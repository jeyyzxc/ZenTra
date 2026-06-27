import { requireAdmin } from '@/lib/authorization';
import {
  getPaymentRecord,
  paymentErrorResponse,
  readPaymentMutationRequest,
  updatePaymentRecord,
} from '@/lib/payment-service';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    return Response.json(await getPaymentRecord(id));
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await context.params;
    const { input, proof } = await readPaymentMutationRequest(request);
    const payment = await updatePaymentRecord(id, input, actor, proof);
    return Response.json({ success: true, paymentId: payment.id });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
