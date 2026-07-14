import { requireSuperAdmin } from '@/lib/authorization';
import { archiveContentItem, handleCommandCenterError } from '@/services/command-center';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    return Response.json({
      success: true,
      data: await archiveContentItem(decodeURIComponent(id), actor, request),
    });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

