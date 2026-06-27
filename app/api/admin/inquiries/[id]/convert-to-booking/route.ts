import { requireAdmin } from '@/lib/authorization';
import {
  convertInquiryToBooking,
  inquiryErrorResponse,
} from '@/lib/inquiry-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    return Response.json(
      await convertInquiryToBooking(decodeURIComponent(id), body, actor, request),
      { status: 201 },
    );
  } catch (error) {
    return inquiryErrorResponse(error, 'Unable to convert inquiry to a booking.');
  }
}
