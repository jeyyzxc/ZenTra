import { requireSuperAdmin } from '@/lib/authorization';
import {
  createPackage,
  getAdminPackagesForCategory,
  handleServicesError,
} from '@/lib/services-packages';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    return Response.json({ data: await getAdminPackagesForCategory(decodeURIComponent(id)) });
  } catch (error) {
    return handleServicesError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json();
    const packageRecord = await createPackage(decodeURIComponent(id), body, actor, request);

    return Response.json({ data: packageRecord }, { status: 201 });
  } catch (error) {
    return handleServicesError(error);
  }
}
