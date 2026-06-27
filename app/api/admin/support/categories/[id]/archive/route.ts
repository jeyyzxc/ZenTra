import { requireSuperAdmin } from '@/lib/authorization';
import { archiveCategory, supportErrorResponse } from '@/lib/support-center-service';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    return Response.json({
      category: await archiveCategory(decodeURIComponent(id), actor, request),
    });
  } catch (error) {
    return supportErrorResponse(error, 'Unable to archive support category.');
  }
}
