import { requireSuperAdmin } from '@/lib/authorization';
import {
  deleteDraftVersion,
  handleCommandCenterError,
  updateDraftVersion,
} from '@/services/command-center';

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
      data: await updateDraftVersion(
        decodeURIComponent(id),
        decodeURIComponent(versionId),
        body,
        actor,
        request,
      ),
    });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id, versionId } = await params;
    return Response.json({
      success: true,
      data: await deleteDraftVersion(
        decodeURIComponent(id),
        decodeURIComponent(versionId),
        actor,
        request,
      ),
    });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

