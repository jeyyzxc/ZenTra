import { requireAdmin } from '@/lib/authorization';
import {
  getInquiryPage,
  inquiryErrorResponse,
} from '@/lib/inquiry-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    return Response.json(await getInquiryPage(new URL(request.url)));
  } catch (error) {
    return inquiryErrorResponse(error, 'Unable to load inquiries.');
  }
}
