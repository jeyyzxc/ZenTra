import { requireSuperAdmin } from '@/lib/authorization';
import { handleCommandCenterError } from '@/services/command-center';
import { createKnowledgeDraftVersion } from '@/services/smart-assistant';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    return Response.json({
      success: true,
      data: await createKnowledgeDraftVersion(id, actor, request),
    }, { status: 201 });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

