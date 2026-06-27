import { requireAdmin } from '@/lib/authorization';
import {
  paymentErrorResponse,
  readPaymentMutationRequest,
  updatePaymentRecord,
} from '@/lib/payment-service';

export const dynamic = 'force-dynamic';

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
