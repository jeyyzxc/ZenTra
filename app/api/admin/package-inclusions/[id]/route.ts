import { requireSuperAdmin } from '@/lib/authorization';
import {
  deletePackageInclusion,
  handleServicesError,
  updatePackageInclusion,
} from '@/lib/services-packages';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json();
    const packageRecord = await updatePackageInclusion(decodeURIComponent(id), body, actor, request);

    return Response.json({ data: packageRecord });
  } catch (error) {
    return handleServicesError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const packageRecord = await deletePackageInclusion(decodeURIComponent(id), actor, request);

    return Response.json({ data: packageRecord });
  } catch (error) {
    return handleServicesError(error);
  }
}
