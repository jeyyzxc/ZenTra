import { requireAdmin } from '@/lib/authorization';
import {
  getInquirySummary,
  inquiryErrorResponse,
} from '@/lib/inquiry-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ summary: await getInquirySummary() });
  } catch (error) {
    return inquiryErrorResponse(error, 'Unable to load inquiry summary.');
  }
}
