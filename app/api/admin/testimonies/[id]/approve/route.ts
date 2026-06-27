import { requireAdmin } from '@/lib/authorization';
import { moderateTestimony, testimonyErrorResponse } from '@/lib/testimony-service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    return Response.json({
      testimony: await moderateTestimony(decodeURIComponent(id), 'approve', actor, request),
    });
  } catch (error) {
    return testimonyErrorResponse(error, 'Unable to approve testimony.');
  }
}
