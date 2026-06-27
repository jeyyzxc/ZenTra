import { requireSuperAdmin } from '@/lib/authorization';
import {
  createPackageInclusion,
  handleServicesError,
} from '@/lib/services-packages';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json();
    const packageRecord = await createPackageInclusion(decodeURIComponent(id), body, actor, request);

    return Response.json({ data: packageRecord }, { status: 201 });
  } catch (error) {
    return handleServicesError(error);
  }
}
