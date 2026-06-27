import { requireAdmin } from '@/lib/authorization';
import { supportErrorResponse, testAssistantAnswer } from '@/lib/support-center-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const body = await request.json() as Record<string, unknown>;
    return Response.json({ result: await testAssistantAnswer(body, actor, request) });
  } catch (error) {
    return supportErrorResponse(error, 'Unable to test Smart Assistant answer.');
  }
}
