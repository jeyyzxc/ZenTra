import { requireAdmin } from '@/lib/authorization';
import { getPaymentProof, paymentErrorResponse } from '@/lib/payment-service';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const proof = await getPaymentProof(id);
    return new Response(proof.response.body, {
      headers: {
        'Content-Type': proof.fileType,
        'Content-Disposition': `inline; filename="${proof.fileName.replaceAll('"', '')}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
