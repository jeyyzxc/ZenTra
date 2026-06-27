import { requireAdmin } from '@/lib/authorization';
import { moderateTestimony, testimonyErrorResponse } from '@/lib/testimony-service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    const body = await request.json() as { featured?: boolean };
    return Response.json({
      testimony: await moderateTestimony(
        decodeURIComponent(id),
        'feature',
        actor,
        request,
        { featured: Boolean(body.featured) },
      ),
    });
  } catch (error) {
    return testimonyErrorResponse(error, 'Unable to update featured testimony.');
  }
}
