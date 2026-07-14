import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';

type RateLimitRow = {
  requestCount: number;
  expiresAt: Date;
};

export class RateLimitError extends Error {
  status = 429;
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super(`Request limit exceeded. Retry after ${retryAfterSeconds} seconds.`);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function requestIpAddress(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('cf-connecting-ip')?.trim() ||
    'unknown';
}

export function hashedRateLimitIdentity(parts: Array<string | null | undefined>) {
  return createHash('sha256').update(parts.map((part) => part?.trim() || 'unknown').join('|')).digest('hex');
}

export async function enforceRateLimit(input: {
  scope: string;
  identity: string;
  limit?: number;
  windowSeconds?: number;
}) {
  const scope = input.scope.trim().slice(0, 120);
  const limit = Math.max(1, Math.floor(input.limit ?? 120));
  const windowSeconds = Math.max(1, Math.floor(input.windowSeconds ?? 60));
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1_000);
  const clientKey = createHash('sha256').update(input.identity).digest('hex');
  const id = createHash('sha256').update(`${scope}|${clientKey}`).digest('hex');
  const rows = await prisma.$queryRaw<RateLimitRow[]>`
    INSERT INTO "orchestration_rate_limits" AS current_limit (
      "id", "scope", "client_key", "window_started_at", "request_count",
      "expires_at", "created_at", "updated_at"
    ) VALUES (
      ${id}, ${scope}, ${clientKey}, ${now}, 1, ${expiresAt}, ${now}, ${now}
    )
    ON CONFLICT ("id") DO UPDATE SET
      "window_started_at" = CASE WHEN current_limit."expires_at" <= ${now} THEN ${now} ELSE current_limit."window_started_at" END,
      "request_count" = CASE WHEN current_limit."expires_at" <= ${now} THEN 1 ELSE current_limit."request_count" + 1 END,
      "expires_at" = CASE WHEN current_limit."expires_at" <= ${now} THEN ${expiresAt} ELSE current_limit."expires_at" END,
      "updated_at" = ${now}
    RETURNING "request_count" AS "requestCount", "expires_at" AS "expiresAt"
  `;
  const result = rows[0];
  if (!result) throw new Error('Unable to validate request limit.');
  if (result.requestCount === 1) {
    await prisma.orchestrationRateLimit.deleteMany({
      where: { expiresAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1_000) } },
    });
  }
  if (result.requestCount > limit) {
    throw new RateLimitError(Math.max(1, Math.ceil((result.expiresAt.getTime() - now.getTime()) / 1_000)));
  }
  return {
    limit,
    remaining: Math.max(limit - result.requestCount, 0),
    expiresAt: result.expiresAt,
  };
}

