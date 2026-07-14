import { requireSuperAdmin } from '@/lib/authorization';
import { handleCommandCenterError, retryCommandCenterJob } from '@/services/command-center';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    return Response.json({ success: true, data: await retryCommandCenterJob(id, actor.id) });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

