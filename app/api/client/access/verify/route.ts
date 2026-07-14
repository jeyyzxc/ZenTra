import { CLIENT_ACCESS_COOKIE, verifyClientAccess } from '@/services/smart-assistant';
import { handleCommandCenterError } from '@/services/command-center';
import { RateLimitError } from '@/services/rate-limit.service';

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const verified = await verifyClientAccess(request, body);
    const response = Response.json({
      success: true,
      data: { bookingReference: verified.bookingReference, expiresAt: verified.expiresAt.toISOString() },
    }, { headers: { 'cache-control': 'no-store' } });
    const maxAge = Math.max(1, Math.floor((verified.expiresAt.getTime() - Date.now()) / 1_000));
    response.headers.append(
      'set-cookie',
      `${CLIENT_ACCESS_COOKIE}=${encodeURIComponent(verified.token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`,
    );
    return response;
  } catch (error) {
    if (error instanceof RateLimitError) {
      return Response.json({ success: false, error: error.message }, {
        status: 429,
        headers: { 'retry-after': String(error.retryAfterSeconds), 'cache-control': 'no-store' },
      });
    }
    return handleCommandCenterError(error);
  }
}

