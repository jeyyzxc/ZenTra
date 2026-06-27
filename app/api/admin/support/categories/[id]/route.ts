import { requireSuperAdmin } from '@/lib/authorization';
import { supportErrorResponse, updateCategory } from '@/lib/support-center-service';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    return Response.json({
      category: await updateCategory(decodeURIComponent(id), body, actor, request),
    });
  } catch (error) {
    return supportErrorResponse(error, 'Unable to update support category.');
  }
}
