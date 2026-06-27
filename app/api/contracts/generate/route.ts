import { requireAdmin } from '@/lib/authorization';
import { ContractService, contractErrorResponse } from '@/services/contract';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const body = await request.json() as { bookingId?: string };

    if (!body.bookingId) {
      return Response.json({ error: 'bookingId is required.' }, { status: 400 });
    }

    const contract = await ContractService.generateContract(body.bookingId, actor);
    return Response.json({ contract }, { status: 201 });
  } catch (error) {
    return contractErrorResponse(error, 'Unable to generate contract.');
  }
}
