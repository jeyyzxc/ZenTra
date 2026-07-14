import { createHash } from 'node:crypto';
import { BookingRequestError } from '@/lib/booking-validation';
import { enforceRateLimit, RateLimitError } from '@/services/rate-limit.service';

export function orchestrationRateLimitIdentity(request: Request, scope: string) {
  const credential = request.headers.get('x-api-key')?.trim() ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    request.headers.get('x-n8n-secret')?.trim() ||
    'missing';
  const identity = [
    scope,
    credential,
    request.headers.get('x-zion-source')?.trim().toLowerCase() || 'unknown',
    request.headers.get('x-zion-workflow')?.trim() || 'unknown',
  ].join('|');

  return createHash('sha256').update(identity).digest('hex');
}

export async function enforceOrchestrationRateLimit(input: {
  request: Request;
  scope: string;
  limit?: number;
  windowSeconds?: number;
}) {
  const clientKey = orchestrationRateLimitIdentity(input.request, input.scope);
  try {
    return await enforceRateLimit({
      scope: input.scope,
      identity: clientKey,
      limit: input.limit,
      windowSeconds: input.windowSeconds,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw new BookingRequestError(
        `Orchestration request limit exceeded. Retry after ${error.retryAfterSeconds} seconds.`,
        429,
      );
    }
    throw new BookingRequestError('Unable to validate orchestration rate limit.', 503);
  }
}
