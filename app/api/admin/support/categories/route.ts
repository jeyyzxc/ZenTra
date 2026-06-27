import { requireAdmin, requireSuperAdmin } from '@/lib/authorization';
import {
  createCategory,
  getAdminCategories,
  supportErrorResponse,
} from '@/lib/support-center-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return Response.json(await getAdminCategories());
  } catch (error) {
    return supportErrorResponse(error, 'Unable to load support categories.');
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSuperAdmin();
    const body = await request.json() as Record<string, unknown>;
    return Response.json({ category: await createCategory(body, actor, request) }, { status: 201 });
  } catch (error) {
    return supportErrorResponse(error, 'Unable to create support category.');
  }
}
