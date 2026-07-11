import { AuditAction, AuditStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { adminDisplayName, type CurrentAdmin } from '@/lib/authorization';

type HeadersLike =
  | Headers
  | Record<string, string | string[] | undefined>
  | undefined
  | null;

export interface AuditLogInput {
  userId?: string | null;
  userName: string;
  userRole: string;
  action: AuditAction;
  module: string;
  description: string;
  status: AuditStatus;
  ipAddress?: string | null;
  userAgent?: string | null;
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  source?: string | null;
}

export const AUDIT_MODULES = [
  'Authentication',
  'Dashboard',
  'Bookings',
  'Calendar',
  'Services',
  'Payments',
  'Contracts',
  'Team',
  'Reports',
  'Settings',
  'Profile',
  'Support',
  'support_center',
  'Inquiries',
  'Testimonies',
  'Audit',
  'System',
] as const;

const SENSITIVE_FIELD_TERMS = [
  'password',
  'passwordHash',
  'token',
  'secret',
  'apiKey',
  'accessToken',
  'refreshToken',
  'creditCard',
].map((field) => field.toLowerCase());

function getHeader(headers: HeadersLike, key: string): string | null {
  if (!headers) {
    return null;
  }

  if (headers instanceof Headers) {
    return headers.get(key);
  }

  const value = headers[key] ?? headers[key.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function isSensitiveField(key: string) {
  const normalizedKey = key.toLowerCase();
  return SENSITIVE_FIELD_TERMS.some((field) => normalizedKey.includes(field));
}

function serializeAuditValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value === undefined ? undefined : null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
    };
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => serializeAuditValue(item))
      .filter((item) => item !== undefined);
  }

  if (typeof value === 'object') {
    return sanitize(value as Record<string, unknown>);
  }

  return value;
}

export function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(data).reduce<Record<string, unknown>>((safe, [key, value]) => {
    if (isSensitiveField(key)) {
      safe[key] = '[REDACTED]';
      return safe;
    }

    const serialized = serializeAuditValue(value);

    if (serialized !== undefined) {
      safe[key] = serialized;
    }

    return safe;
  }, {});
}

function sanitizeOptional(data?: Record<string, unknown> | null) {
  return data ? sanitize(data) as Prisma.InputJsonValue : undefined;
}

const DEDUP_COOLDOWN_MS: Partial<Record<AuditAction, number>> = {
  [AuditAction.READ]: 60 * 1000,
};

const MAX_COOLDOWN_MS = 20 * 60 * 1000;

async function shouldSkipDuplicateLog(input: AuditLogInput): Promise<boolean> {
  const cooldown = DEDUP_COOLDOWN_MS[input.action];

  if (!cooldown || cooldown <= 0) {
    return false;
  }

  if (input.status === AuditStatus.FAILED || input.action === AuditAction.ERROR) {
    return false;
  }

  if (!input.userId) {
    return false;
  }

  const effectiveCooldown = Math.min(cooldown, MAX_COOLDOWN_MS);
  const cutoff = new Date(Date.now() - effectiveCooldown);

  const existing = await prisma.auditLog.findFirst({
    where: {
      userId: input.userId,
      action: input.action,
      module: input.module,
      timestamp: { gte: cutoff },
    },
    select: { id: true },
  });

  return existing !== null;
}

export function getRequestContext(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  return getRequestContextFromHeaders(request.headers);
}

export function getRequestContextFromHeaders(headers: HeadersLike): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const forwardedFor = getHeader(headers, 'x-forwarded-for');
  const ipAddress =
    forwardedFor?.split(',')[0]?.trim() ||
    getHeader(headers, 'x-real-ip') ||
    getHeader(headers, 'cf-connecting-ip') ||
    null;

  return {
    ipAddress,
    userAgent: getHeader(headers, 'user-agent'),
  };
}

export function auditActor(actor: CurrentAdmin): Pick<
  AuditLogInput,
  'userId' | 'userName' | 'userRole'
> {
  return {
    userId: actor.id,
    userName: adminDisplayName(actor),
    userRole: actor.role,
  };
}

export function systemAuditActor(): Pick<
  AuditLogInput,
  'userId' | 'userName' | 'userRole'
> {
  return {
    userId: null,
    userName: 'System',
    userRole: 'SYSTEM',
  };
}

export function errorMetadata(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
    };
  }

  return {
    errorMessage: String(error),
  };
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    if (await shouldSkipDuplicateLog(input)) {
      return;
    }

    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        userName: input.userName || 'System',
        userRole: input.userRole || 'SYSTEM',
        action: input.action,
        module: input.module,
        description: input.description,
        status: input.status,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        previousValues: sanitizeOptional(input.previousValues),
        newValues: sanitizeOptional(input.newValues),
        metadata: sanitizeOptional(input.metadata),
        source: input.source ?? null,
      },
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}
