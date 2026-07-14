import { requireSuperAdmin } from '@/lib/authorization';
import { handleCommandCenterError, publishContentVersion } from '@/services/command-center';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json() as { versionId?: unknown; expiresAt?: unknown };
    return Response.json({
      success: true,
      data: await publishContentVersion({
        itemId: decodeURIComponent(id),
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

