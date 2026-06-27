import { InquiryStatus } from '@prisma/client';
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
    return Response.json({
      inquiry: await setInquiryStatus(
        decodeURIComponent(id),
        InquiryStatus.SPAM,
        actor,
        request,
      ),
    });
  } catch (error) {
    return inquiryErrorResponse(error, 'Unable to mark inquiry as spam.');
  }
}
