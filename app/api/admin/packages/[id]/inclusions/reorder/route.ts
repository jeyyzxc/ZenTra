import { requireSuperAdmin } from '@/lib/authorization';
import {
  handleServicesError,
  reorderPackageInclusions,
} from '@/lib/services-packages';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json() as { inclusionIds?: string[] };
    const packageRecord = await reorderPackageInclusions(
      decodeURIComponent(id),
      body.inclusionIds ?? [],
      actor,
      request,
    );

    return Response.json({ data: packageRecord });
  } catch (error) {
    return handleServicesError(error);
  }
}
