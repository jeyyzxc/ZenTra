import { requireSuperAdmin } from '@/lib/authorization';
import { convertUnansweredToFaq, supportErrorResponse } from '@/lib/support-center-service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    return Response.json({
      faq: await convertUnansweredToFaq(decodeURIComponent(id), body, actor, request),
    }, { status: 201 });
  } catch (error) {
    return supportErrorResponse(error, 'Unable to convert unanswered question.');
  }
}
