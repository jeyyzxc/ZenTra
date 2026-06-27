import { requireAdmin } from '@/lib/authorization';
import {
  getInquiryDetail,
  inquiryErrorResponse,
  updateInquiry,
} from '@/lib/inquiry-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    return Response.json({
      inquiry: await getInquiryDetail(decodeURIComponent(id), actor, request),
    });
  } catch (error) {
    return inquiryErrorResponse(error, 'Unable to load inquiry details.');
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    return Response.json({
      inquiry: await updateInquiry(decodeURIComponent(id), body, actor, request),
    });
  } catch (error) {
    return inquiryErrorResponse(error, 'Unable to update inquiry.');
  }
}
