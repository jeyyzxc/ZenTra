import { requireSuperAdmin } from '@/lib/authorization';
import {
  paymentErrorResponse,
  readPaymentMutationRequest,
  verifyPayment,
} from '@/lib/payment-service';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await context.params;
    const { input } = await readPaymentMutationRequest(request);
    const payment = await verifyPayment(id, input, actor);
    return Response.json({ success: true, paymentId: payment.id });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
