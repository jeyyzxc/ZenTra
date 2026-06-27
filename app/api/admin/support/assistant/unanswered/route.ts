import { requireAdmin } from '@/lib/authorization';
import { getUnansweredQuestions, supportErrorResponse } from '@/lib/support-center-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    return Response.json(await getUnansweredQuestions(new URL(request.url)));
  } catch (error) {
    return supportErrorResponse(error, 'Unable to load unanswered assistant questions.');
  }
}
