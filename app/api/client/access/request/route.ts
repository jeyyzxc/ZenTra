import { CommandCenterError, handleCommandCenterError } from '@/services/command-center';
import { RateLimitError } from '@/services/rate-limit.service';
import { requestClientAccess } from '@/services/smart-assistant';

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    return Response.json({ success: true, ...(await requestClientAccess(request, body)) }, {
      headers: { 'cache-control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return Response.json({ success: false, error: error.message }, {
        status: 429,
        headers: { 'retry-after': String(error.retryAfterSeconds), 'cache-control': 'no-store' },
      });
    }
    if (error instanceof SyntaxError) return handleCommandCenterError(new CommandCenterError('Invalid request body.', 400));
    return handleCommandCenterError(error);
  }
}

