import { requireSuperAdmin } from '@/lib/authorization';
import {
  deletePackageWhenAllowed,
  getAdminPackage,
  handleServicesError,
  updatePackage,
} from '@/lib/services-packages';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    return Response.json({ data: await getAdminPackage(decodeURIComponent(id)) });
  } catch (error) {
    return handleServicesError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json();
    const packageRecord = await updatePackage(decodeURIComponent(id), body, actor, request);

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
    return Response.json({ data: await deletePackageWhenAllowed(decodeURIComponent(id), actor, request) });
  } catch (error) {
    return handleServicesError(error);
  }
}
