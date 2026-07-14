import { requireSuperAdmin } from '@/lib/authorization';
import {
  archiveEventCategory,
  getAdminEventCategory,
  handleServicesError,
  updateEventCategory,
} from '@/lib/services-packages';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    return Response.json({ data: await getAdminEventCategory(decodeURIComponent(id)) });
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
    const category = await archiveEventCategory(decodeURIComponent(id), actor, request);
    return Response.json({ data: category });
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
    const category = await updateEventCategory(decodeURIComponent(id), body, actor, request);

    return Response.json({ data: category });
  } catch (error) {
    return handleServicesError(error);
  }
}
