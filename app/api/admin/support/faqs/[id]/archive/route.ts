import { SupportFaqStatus } from '@prisma/client';
import { requireSuperAdmin } from '@/lib/authorization';
import { setFaqStatus, supportErrorResponse } from '@/lib/support-center-service';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    return Response.json({
      faq: await setFaqStatus(decodeURIComponent(id), SupportFaqStatus.ARCHIVED, actor, request),
    });
  } catch (error) {
    return supportErrorResponse(error, 'Unable to archive support FAQ entry.');
  }
}
