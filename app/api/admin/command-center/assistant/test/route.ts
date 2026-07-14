import { requireAdmin } from '@/lib/authorization';
import { handleCommandCenterError } from '@/services/command-center';
import { askGroundedAssistant } from '@/services/smart-assistant';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json() as Record<string, unknown>;
    return Response.json({ success: true, data: await askGroundedAssistant(request, body) });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

