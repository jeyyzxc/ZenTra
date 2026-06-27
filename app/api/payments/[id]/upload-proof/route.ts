import { requireAdmin } from '@/lib/authorization';
import {
  paymentErrorResponse,
  readPaymentMutationRequest,
  uploadProofOnly,
} from '@/lib/payment-service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await context.params;
    const { proof } = await readPaymentMutationRequest(request);
    const payment = await uploadProofOnly(id, proof, actor);
    return Response.json({ success: true, paymentId: payment.id });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
