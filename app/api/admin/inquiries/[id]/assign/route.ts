import { requireAdmin } from '@/lib/authorization';
import {
  assignInquiry,
  inquiryErrorResponse,
} from '@/lib/inquiry-service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    const body = await request.json() as { assignedTo?: unknown };
    return Response.json({
      inquiry: await assignInquiry(decodeURIComponent(id), body.assignedTo, actor, request),
    });
  } catch (error) {
    return inquiryErrorResponse(error, 'Unable to assign inquiry.');
  }
}
