import { requireSuperAdmin } from '@/lib/authorization';
import { setFaqAssistantEnabled, supportErrorResponse } from '@/lib/support-center-service';

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
      faq: await setFaqAssistantEnabled(decodeURIComponent(id), body.assistantEnabled, actor, request),
    });
  } catch (error) {
    return supportErrorResponse(error, 'Unable to update Smart Assistant visibility.');
  }
}
