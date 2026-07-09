import bcrypt from 'bcryptjs';
import {
  AccountTokenType,
  AuditAction,
  AuditStatus,
  Prisma,
  SessionAccessScope,
  UserStatus,
} from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { createAuditLog, getRequestContext } from '@/lib/audit';
import { assertStrongPassword } from '@/lib/password-policy';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const requestContext = getRequestContext(request);

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (
      session.user.accessScope !== SessionAccessScope.PASSWORD_CHANGE_ONLY ||
      !session.user.accountSessionId
    ) {
      return NextResponse.json(
        { error: 'You must use a password-change session for this action.' },
        { status: 403 },
      );
    }

    const accountSessionId = session.user.accountSessionId;
    const body = await request.json() as { newPassword?: string };
    const newPassword = body.newPassword ?? '';
    assertStrongPassword(newPassword);

    const now = new Date();
    const updatedUser = await prisma.$transaction(
      async (transaction) => {
        const scopedSession = await transaction.accountSession.findUnique({
          where: { id: accountSessionId },
        });

        if (
          !scopedSession ||
          scopedSession.userId !== session.user.id ||
          scopedSession.accessScope !== SessionAccessScope.PASSWORD_CHANGE_ONLY ||
          scopedSession.revokedAt ||
          scopedSession.expiresAt.getTime() <= now.getTime()
        ) {
          throw new Error('Temporary access has expired.');
        }

        const user = await transaction.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            passwordHash: true,
          },
        });

        if (!user) {
          throw new Error('This account no longer exists.');
        }

        if (user.passwordHash && await bcrypt.compare(newPassword, user.passwordHash)) {
          throw new Error('New password must be different from your current password.');
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        const updated = await transaction.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            status: UserStatus.ACTIVE,
            mustChangePassword: false,
            lastPasswordChangedAt: now,
          },
          select: {
            id: true,
            username: true,
            role: true,
          },
        });

        await transaction.accountToken.updateMany({
          where: {
            userId: user.id,
            tokenType: AccountTokenType.TEMP_LOGIN,
            usedAt: null,
          },
          data: {
            usedAt: now,
          },
        });

        await transaction.accountSession.updateMany({
          where: {
            userId: user.id,
            revokedAt: null,
          },
          data: {
            revokedAt: now,
          },
        });

        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await createAuditLog({
      userId: updatedUser.id,
      userName: updatedUser.username,
      userRole: updatedUser.role,
      action: AuditAction.PASSWORD_CHANGED,
      module: 'Authentication',
      description: `${updatedUser.username} changed their password after temporary access.`,
      status: AuditStatus.SUCCESS,
      ...requestContext,
      metadata: {
        targetUserId: updatedUser.id,
        accessScope: SessionAccessScope.PASSWORD_CHANGE_ONLY,
      },
    });

    return NextResponse.json({
      message: 'Password changed successfully.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to change this password.' },
      { status: 400 },
    );
  }
}
