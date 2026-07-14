import { requireAdmin } from '@/lib/authorization';
import { handleCommandCenterError } from '@/services/command-center';
import { getLlmProvider } from '@/services/smart-assistant';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ success: true, data: await getLlmProvider().healthCheck() });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

