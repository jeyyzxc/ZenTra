import { requireAdmin } from '@/lib/authorization';
import { ContractService, contractErrorResponse } from '@/services/contract';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin();
    const data = await ContractService.getPageData(actor, new URL(request.url).searchParams);
    return Response.json({ contracts: data.signedContracts });
  } catch (error) {
    return contractErrorResponse(error, 'Unable to load signed contracts.');
  }
}
