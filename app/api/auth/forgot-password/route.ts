import {
  AccountTokenType,
  AuditAction,
  AuditStatus,
  Role,
  UserStatus,
} from '@prisma/client';
import { NextResponse } from 'next/server';
import { createAuditLog, getRequestContext } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import {
  issueAccountToken,
  queueTeamAccessEmail,
  TEMP_ACCESS_TTL_MS,
} from '@/lib/team-access';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = [Role.SUPERADMIN, Role.ADMIN] as const;
const GENERIC_MESSAGE =
  'If this admin email exists, a temporary password code has been sent.';

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isEligibleForForgotPassword(user: {
  role: Role;
  status: UserStatus;
  passwordHash: string | null;
}) {
  return (
    ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number]) &&
    Boolean(user.passwordHash) &&
    user.status !== UserStatus.PENDING_SETUP &&
    user.status !== UserStatus.DISABLED &&
    user.status !== UserStatus.LOCKED
  );
}

function deliveryWarningFor(delivery: Awaited<ReturnType<typeof queueTeamAccessEmail>>) {
  if (delivery.delivered) {
    return null;
  }

  if (delivery.errorMessage) {
    return delivery.errorMessage;
  }

  if (!delivery.deliveryConfigured) {
    return 'Temporary password email delivery is not configured yet.';
  }

  return 'Temporary password email could not be delivered.';
}

export async function POST(request: Request) {
  const requestContext = getRequestContext(request);

  try {
    const body = await request.json() as { email?: string };
    const email = normalizeEmail(body.email);

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid admin email address.' },
        { status: 400 },
      );
    }

    const issued = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { email },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
          passwordHash: true,
        },
      });

      if (!user || !isEligibleForForgotPassword(user)) {
        return null;
      }

      const token = await issueAccountToken(transaction, {
        userId: user.id,
        tokenType: AccountTokenType.TEMP_LOGIN,
        ttlMs: TEMP_ACCESS_TTL_MS,
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
        temporaryCode: true,
      });

      return {
        rawToken: token.rawToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      };
    });

    if (!issued) {
      return NextResponse.json({
        message: GENERIC_MESSAGE,
        expiresInMinutes: TEMP_ACCESS_TTL_MS / 60_000,
      });
    }

    const delivery = await queueTeamAccessEmail({
      kind: 'temp-access',
      user: issued.user,
      rawSecret: issued.rawToken,
      expiresInMinutes: TEMP_ACCESS_TTL_MS / 60_000,
    });
    const deliveryWarning = deliveryWarningFor(delivery);

    await createAuditLog({
      userId: issued.user.id,
      userName: issued.user.username,
      userRole: issued.user.role,
      action: AuditAction.TEMP_ACCESS_CODE_SENT,
      module: 'Authentication',
      description: `${issued.user.username} requested a forgot-password temporary access code.`,
      status: deliveryWarning ? AuditStatus.WARNING : AuditStatus.SUCCESS,
      ...requestContext,
      metadata: {
        targetUserId: issued.user.id,
        expiresInMinutes: TEMP_ACCESS_TTL_MS / 60_000,
        emailLogId: delivery.emailLogId,
        deliveryConfigured: delivery.deliveryConfigured,
        delivered: delivery.delivered,
        deliveryWarning,
      },
    });

    return NextResponse.json({
      message: deliveryWarning ?? 'Temporary password code sent. Check your email.',
      deliveryWarning,
      expiresInMinutes: TEMP_ACCESS_TTL_MS / 60_000,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : 'Unable to send a temporary password code.',
      },
      { status: 400 },
    );
  }
}
