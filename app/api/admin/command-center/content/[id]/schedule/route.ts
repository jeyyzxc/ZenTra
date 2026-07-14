import { requireSuperAdmin } from '@/lib/authorization';
import { handleCommandCenterError, scheduleContentVersion } from '@/services/command-center';

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
      data: await scheduleContentVersion({
        itemId: decodeURIComponent(id),
        versionId: typeof body.versionId === 'string' ? body.versionId : '',
        publishAt: body.publishAt,
        expiresAt: body.expiresAt,
        changeSummary: body.changeSummary,
        actor,
        request,
      }),
    });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

