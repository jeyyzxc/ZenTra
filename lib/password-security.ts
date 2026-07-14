import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { assertStrongPassword } from '@/lib/password-policy';
import { prisma } from '@/lib/prisma';

export const PASSWORD_UPDATE_MAX_ATTEMPTS = 5;
export const PASSWORD_UPDATE_LOCK_SECONDS = 15;
const PASSWORD_UPDATE_LOCK_MS = PASSWORD_UPDATE_LOCK_SECONDS * 1000;

type DbClient = typeof prisma | Prisma.TransactionClient;

export const PASSWORD_SECURITY_USER_SELECT = {
  id: true,
  passwordHash: true,
  passwordChangeAttemptCount: true,
  passwordChangeLockedUntil: true,
  passwordHistory: {
    select: {
      passwordHash: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  },
} satisfies Prisma.UserSelect;

export type PasswordSecurityUser = Prisma.UserGetPayload<{
  select: typeof PASSWORD_SECURITY_USER_SELECT;
}>;

export class PasswordUpdateLockedError extends Error {
  readonly code = 'PASSWORD_UPDATE_LOCKED';
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super(`Too many unsuccessful password attempts. Try again in ${retryAfterSeconds} seconds.`);
    this.name = 'PasswordUpdateLockedError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class PasswordUpdateRejectedError extends Error {
  readonly code = 'PASSWORD_UPDATE_REJECTED';
  readonly remainingAttempts: number;

  constructor(message: string, remainingAttempts: number) {
    const attemptLabel = remainingAttempts === 1 ? 'attempt' : 'attempts';
    super(`${message} ${remainingAttempts} ${attemptLabel} remaining before a ${PASSWORD_UPDATE_LOCK_SECONDS}-second lock.`);
    this.name = 'PasswordUpdateRejectedError';
    this.remainingAttempts = remainingAttempts;
  }
}

function lockSecondsRemaining(lockedUntil: Date | null, now = new Date()) {
  if (!lockedUntil) {
    return 0;
  }

  return Math.max(0, Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000));
}

export function assertPasswordUpdateNotLocked(
  user: Pick<PasswordSecurityUser, 'passwordChangeLockedUntil'>,
  now = new Date(),
) {
  const remaining = lockSecondsRemaining(user.passwordChangeLockedUntil, now);

  if (remaining > 0) {
    throw new PasswordUpdateLockedError(remaining);
  }
}

export async function assertPasswordIsFresh(
  newPassword: string,
  user: Pick<PasswordSecurityUser, 'passwordHash' | 'passwordHistory'>,
) {
  assertStrongPassword(newPassword);

  const hashes = [
    user.passwordHash,
    ...user.passwordHistory.map((entry) => entry.passwordHash),
  ].filter((hash): hash is string => Boolean(hash));

  for (const hash of hashes) {
    if (await bcrypt.compare(newPassword, hash)) {
      throw new Error(
        'New password must be fresh and cannot match your current or any previously used password.',
      );
    }
  }
}

async function loadPasswordSecurityUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PASSWORD_SECURITY_USER_SELECT,
  });

  if (!user) {
    throw new Error('This account no longer exists.');
  }

  return user;
}

async function clearExpiredLock(user: PasswordSecurityUser, now: Date) {
  if (
    user.passwordChangeLockedUntil &&
    user.passwordChangeLockedUntil.getTime() <= now.getTime()
  ) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordChangeAttemptCount: 0,
        passwordChangeLockedUntil: null,
      },
    });

    return {
      ...user,
      passwordChangeAttemptCount: 0,
      passwordChangeLockedUntil: null,
    };
  }

  return user;
}

export async function registerFailedPasswordUpdate(userId: string, message: string) {
  const now = new Date();
  let user = await loadPasswordSecurityUser(userId);
  user = await clearExpiredLock(user, now);
  assertPasswordUpdateNotLocked(user, now);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordChangeAttemptCount: {
        increment: 1,
      },
    },
    select: {
      passwordChangeAttemptCount: true,
    },
  });

  if (updated.passwordChangeAttemptCount >= PASSWORD_UPDATE_MAX_ATTEMPTS) {
    const lockedUntil = new Date(now.getTime() + PASSWORD_UPDATE_LOCK_MS);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordChangeAttemptCount: 0,
        passwordChangeLockedUntil: lockedUntil,
      },
    });

    throw new PasswordUpdateLockedError(PASSWORD_UPDATE_LOCK_SECONDS);
  }

  throw new PasswordUpdateRejectedError(
    message,
    PASSWORD_UPDATE_MAX_ATTEMPTS - updated.passwordChangeAttemptCount,
  );
}

export async function validatePasswordUpdate(userId: string, newPassword: string) {
  const now = new Date();
  let user = await loadPasswordSecurityUser(userId);
  user = await clearExpiredLock(user, now);
  assertPasswordUpdateNotLocked(user, now);

  try {
    await assertPasswordIsFresh(newPassword, user);
  } catch (error) {
    await registerFailedPasswordUpdate(
      userId,
      error instanceof Error ? error.message : 'This password cannot be used.',
    );
  }

  return user;
}

export async function archiveCurrentPassword(
  client: DbClient,
  userId: string,
  passwordHash: string | null,
) {
  if (!passwordHash) {
    return;
  }

  await client.passwordHistory.create({
    data: {
      userId,
      passwordHash,
    },
  });
}

export function passwordSecurityErrorDetails(error: unknown) {
  if (error instanceof PasswordUpdateLockedError) {
    return {
      status: 429,
      body: {
        code: error.code,
        error: error.message,
        message: error.message,
        retryAfterSeconds: error.retryAfterSeconds,
      },
    };
  }

  if (error instanceof PasswordUpdateRejectedError) {
    return {
      status: 400,
      body: {
        code: error.code,
        error: error.message,
        message: error.message,
        remainingAttempts: error.remainingAttempts,
      },
    };
  }

  return null;
}
