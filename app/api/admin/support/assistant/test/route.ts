import { requireAdmin } from '@/lib/authorization';
import { supportErrorResponse } from '@/lib/support-center-service';
import { askGroundedAssistant } from '@/services/smart-assistant';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json() as Record<string, unknown>;
    return Response.json({ result: await askGroundedAssistant(request, body) });
  } catch (error) {
    return supportErrorResponse(error, 'Unable to test Smart Assistant answer.');
  }
}
