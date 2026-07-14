import { requireSuperAdmin } from '@/lib/authorization';
import { createDraftVersion, handleCommandCenterError } from '@/services/command-center';

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
      data: await createDraftVersion(decodeURIComponent(id), body, actor, request),
    }, { status: 201 });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

