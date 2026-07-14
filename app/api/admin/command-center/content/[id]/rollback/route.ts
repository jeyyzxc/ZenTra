import { requireSuperAdmin } from '@/lib/authorization';
import { handleCommandCenterError, rollbackContentVersion } from '@/services/command-center';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json() as { versionId?: unknown };
    return Response.json({
      success: true,
      data: await rollbackContentVersion(
        decodeURIComponent(id),
        typeof body.versionId === 'string' ? body.versionId : '',
        actor,
        request,
      ),
    }, { status: 201 });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

