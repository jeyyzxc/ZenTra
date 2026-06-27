import { requireAdmin } from '@/lib/authorization';
import {
  getTestimonyAnalytics,
  testimonyErrorResponse,
} from '@/lib/testimony-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ analytics: await getTestimonyAnalytics() });
  } catch (error) {
    return testimonyErrorResponse(error, 'Unable to load testimony analytics.');
  }
}
