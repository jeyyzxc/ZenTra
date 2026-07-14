import { requireSuperAdmin } from '@/lib/authorization';
import { handleCommandCenterError } from '@/services/command-center';
import { changeKnowledgeReviewStatus } from '@/services/smart-assistant';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const action = body.action === 'submit' || body.action === 'reject' ? body.action : 'approve';
    return Response.json({
      success: true,
      data: await changeKnowledgeReviewStatus({
        documentId: id,
        versionId: typeof body.versionId === 'string' ? body.versionId : '',
        action,
        actor,
        request,
      }),
    });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

