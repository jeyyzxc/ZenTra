import { requireAdmin } from '@/lib/authorization';
import { ContractService, contractErrorResponse } from '@/services/contract';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin();
    const bookingEvents = await ContractService.getBookingEvents(actor, new URL(request.url).searchParams);
    return Response.json({ bookingEvents });
  } catch (error) {
    return contractErrorResponse(error, 'Unable to load contract booking events.');
  }
}
