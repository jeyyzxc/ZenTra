import { requireAdmin } from '@/lib/authorization';
import { ContractService, contractErrorResponse } from '@/services/contract';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await context.params;
    const body = await request.json().catch(() => ({})) as { changeSummary?: string };
    const version = await ContractService.createVersion(id, actor, body.changeSummary);
    return Response.json({ version }, { status: 201 });
  } catch (error) {
    return contractErrorResponse(error, 'Unable to create contract version.');
  }
}
