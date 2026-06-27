import { requireAdmin } from '@/lib/authorization';
import { ignoreUnansweredQuestion, supportErrorResponse } from '@/lib/support-center-service';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    return Response.json({
      question: await ignoreUnansweredQuestion(decodeURIComponent(id), actor, request),
    });
  } catch (error) {
    return supportErrorResponse(error, 'Unable to ignore unanswered question.');
  }
}
