import { requireAdmin } from '@/lib/authorization';
import {
  getAdminTestimonies,
  testimonyErrorResponse,
} from '@/lib/testimony-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    return Response.json(await getAdminTestimonies(new URL(request.url)));
  } catch (error) {
    return testimonyErrorResponse(error, 'Unable to load testimony management data.');
  }
}
