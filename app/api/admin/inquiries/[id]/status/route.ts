import { requireAdmin } from '@/lib/authorization';
import {
  inquiryErrorResponse,
  setInquiryStatus,
} from '@/lib/inquiry-service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    const body = await request.json() as { status?: unknown };
    return Response.json({
      inquiry: await setInquiryStatus(decodeURIComponent(id), body.status, actor, request),
    });
  } catch (error) {
    return inquiryErrorResponse(error, 'Unable to update inquiry status.');
  }
}
