import { handleCommandCenterError } from '@/services/command-center';
import { RateLimitError } from '@/services/rate-limit.service';
import { submitAssistantFeedback } from '@/services/smart-assistant';

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    return Response.json({ success: true, data: await submitAssistantFeedback(request, body) });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return Response.json({ success: false, error: error.message }, { status: 429 });
    }
    return handleCommandCenterError(error);
  }
}

