import { requireSuperAdmin } from '@/lib/authorization';
import { handleCommandCenterError } from '@/services/command-center';
import { publishKnowledgeVersion } from '@/services/smart-assistant';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    return Response.json({
      success: true,
      data: await publishKnowledgeVersion({
        documentId: id,
        versionId: typeof body.versionId === 'string' ? body.versionId : '',
        expiresAt: body.expiresAt,
        actor,
        request,
      }),
    });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

