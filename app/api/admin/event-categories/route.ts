import { requireSuperAdmin } from '@/lib/authorization';
import {
  createEventCategory,
  getAdminEventCategories,
  handleServicesError,
} from '@/lib/services-packages';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireSuperAdmin();
    return Response.json({ data: await getAdminEventCategories() });
  } catch (error) {
    return handleServicesError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSuperAdmin();
    const body = await request.json();
    const category = await createEventCategory(body, actor, request);

    return Response.json({ data: category }, { status: 201 });
  } catch (error) {
    return handleServicesError(error);
  }
}
