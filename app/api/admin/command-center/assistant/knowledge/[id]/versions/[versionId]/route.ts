import { requireSuperAdmin } from '@/lib/authorization';
import { handleCommandCenterError } from '@/services/command-center';
import { updateKnowledgeDraft } from '@/services/smart-assistant';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id, versionId } = await params;
    const body = await request.json() as Record<string, unknown>;
    return Response.json({
      success: true,
      data: await updateKnowledgeDraft(id, versionId, body, actor, request),
    });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

