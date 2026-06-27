import { requireAdmin } from '@/lib/authorization';
import { getSupportAnalytics, supportErrorResponse } from '@/lib/support-center-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return Response.json(await getSupportAnalytics());
  } catch (error) {
    return supportErrorResponse(error, 'Unable to load support analytics.');
  }
}
