import { requireAdmin } from '@/lib/authorization';
import {
  addInquiryNote,
  inquiryErrorResponse,
} from '@/lib/inquiry-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    const body = await request.json() as { note?: unknown };
    return Response.json({
      note: await addInquiryNote(decodeURIComponent(id), body.note, actor, request),
    }, { status: 201 });
  } catch (error) {
    return inquiryErrorResponse(error, 'Unable to add internal note.');
  }
}
