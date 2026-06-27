import { requireAdmin } from '@/lib/authorization';
import {
  getInquiryAnalytics,
  inquiryErrorResponse,
} from '@/lib/inquiry-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ analytics: await getInquiryAnalytics() });
  } catch (error) {
    return inquiryErrorResponse(error, 'Unable to load inquiry analytics.');
  }
}
