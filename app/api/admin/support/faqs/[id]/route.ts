import { requireAdmin, requireSuperAdmin } from '@/lib/authorization';
import {
  getFaqDetail,
  supportErrorResponse,
  updateFaq,
} from '@/lib/support-center-service';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    return Response.json({
      faq: await getFaqDetail(decodeURIComponent(id), actor.role === 'SUPERADMIN'),
    });
  } catch (error) {
    return supportErrorResponse(error, 'Unable to load support FAQ entry.');
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    return Response.json({
      faq: await updateFaq(decodeURIComponent(id), body, actor, request),
    });
  } catch (error) {
    return supportErrorResponse(error, 'Unable to update support FAQ entry.');
  }
}
