import { requireAdmin } from '@/lib/authorization';
import { ContractService, contractErrorResponse } from '@/services/contract';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await context.params;
    return Response.json({ contract: await ContractService.getContract(id, actor) });
  } catch (error) {
    return contractErrorResponse(error, 'Unable to load contract.');
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await context.params;
    const contract = await ContractService.updateContract(id, await request.json(), actor);
    return Response.json({ contract });
  } catch (error) {
    return contractErrorResponse(error, 'Unable to update contract.');
  }
}
