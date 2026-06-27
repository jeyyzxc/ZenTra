import { requireAdmin } from '@/lib/authorization';
import { ContractService, contractErrorResponse } from '@/services/contract';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await context.params;
    const contract = await ContractService.sendContract(id, actor, true);
    return Response.json({ contract });
  } catch (error) {
    return contractErrorResponse(error, 'Unable to resend contract.');
  }
}
