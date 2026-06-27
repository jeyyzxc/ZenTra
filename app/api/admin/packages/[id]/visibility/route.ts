import { requireSuperAdmin } from '@/lib/authorization';
import {
  handleServicesError,
  setPackageVisibility,
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
    const packageRecord = await setPackageVisibility(
      decodeURIComponent(id),
      body.clientVisible === true,
      actor,
      request,
    );

    return Response.json({ data: packageRecord });
  } catch (error) {
    return handleServicesError(error);
  }
}
