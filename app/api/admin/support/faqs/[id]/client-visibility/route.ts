import { requireSuperAdmin } from '@/lib/authorization';
import { setFaqClientVisible, supportErrorResponse } from '@/lib/support-center-service';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    return Response.json({
      faq: await setFaqClientVisible(decodeURIComponent(id), body.clientVisible, actor, request),
    });
  } catch (error) {
    return supportErrorResponse(error, 'Unable to update Client FAQ visibility.');
  }
}
