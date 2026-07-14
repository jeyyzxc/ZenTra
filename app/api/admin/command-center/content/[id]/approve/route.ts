import { requireSuperAdmin } from '@/lib/authorization';
import { changeContentReviewStatus, handleCommandCenterError } from '@/services/command-center';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json() as { versionId?: unknown; action?: unknown; changeSummary?: unknown };
    const versionId = typeof body.versionId === 'string' ? body.versionId : '';
    const action = body.action === 'submit' || body.action === 'reject' ? body.action : 'approve';
    return Response.json({
      success: true,
      data: await changeContentReviewStatus({
        itemId: decodeURIComponent(id),
        versionId,
        action,
        changeSummary: body.changeSummary,
        actor,
        request,
      }),
    });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

