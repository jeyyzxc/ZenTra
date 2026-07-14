import { requireAdmin, requireSuperAdmin } from '@/lib/authorization';
import {
  createFaq,
  getAdminFaqPage,
  supportErrorResponse,
} from '@/lib/support-center-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin();
    return Response.json(await getAdminFaqPage(new URL(request.url), actor.role === 'SUPERADMIN'));
  } catch (error) {
    return supportErrorResponse(error, 'Unable to load support FAQ entries.');
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSuperAdmin();
    const body = await request.json() as Record<string, unknown>;
    return Response.json({ faq: await createFaq(body, actor, request) }, { status: 201 });
  } catch (error) {
    return supportErrorResponse(error, 'Unable to create support FAQ entry.');
  }
}
