import { requireSuperAdmin } from '@/lib/authorization';
import {
  handleServicesError,
  setEventCategoryVisibility,
} from '@/lib/services-packages';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json() as { clientVisible?: unknown };
    const category = await setEventCategoryVisibility(
      decodeURIComponent(id),
      body.clientVisible === true,
      actor,
      request,
    );

    return Response.json({ data: category });
  } catch (error) {
    return handleServicesError(error);
  }
}
