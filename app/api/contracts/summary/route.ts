import { requireAdmin } from '@/lib/authorization';
import { ContractService, contractErrorResponse } from '@/services/contract';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const actor = await requireAdmin();
    return Response.json({ summary: await ContractService.getSummary(actor) });
  } catch (error) {
    return contractErrorResponse(error, 'Unable to load contract summary.');
  }
}
