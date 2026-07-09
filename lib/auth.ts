import type { NextAuthOptions, Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import {
  AccountTokenType,
  AuditAction,
  AuditStatus,
  Role,
  SessionAccessScope,
  UserStatus,
} from '@prisma/client';
import { createAuditLog, getRequestContextFromHeaders, systemAuditActor } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { requireServerEnv } from '@/lib/env';
import { getSystemSettings } from '@/lib/system-settings';
import {
  createPasswordChangeOnlySession,
  hashAccessSecret,
  normalizeTemporaryCode,
  revokeExpiredPasswordChangeSession,
  TEMP_ACCESS_MAX_ATTEMPTS,
} from '@/lib/team-access';

const ADMIN_ROLES = [Role.SUPERADMIN, Role.ADMIN] as const;
const DEFAULT_SESSION_AGE = 8 * 60 * 60;
const REMEMBERED_SESSION_AGE = 30 * 24 * 60 * 60;

async function getSessionAgeSeconds(rememberMe: boolean) {
  if (rememberMe) {
    return REMEMBERED_SESSION_AGE;
  }

  try {
    const { settings } = await getSystemSettings();
    return settings.admin.security.sessionTimeoutMinutes * 60;
  } catch {
    return DEFAULT_SESSION_AGE;
  }
}

function isBlockedStatus(status: UserStatus) {
  return status === UserStatus.DISABLED || status === UserStatus.LOCKED;
}

async function consumeTemporaryAccessCode(userId: string, code: string) {
  const now = new Date();
  const latestToken = await prisma.accountToken.findFirst({
    where: {
      userId,
      tokenType: AccountTokenType.TEMP_LOGIN,
      usedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!latestToken) {
    return null;
  }

  if (
    latestToken.lockedAt ||
    latestToken.attemptCount >= TEMP_ACCESS_MAX_ATTEMPTS
  ) {
    return null;
  }

  if (latestToken.expiresAt.getTime() <= now.getTime()) {
    await prisma.$transaction([
      prisma.accountToken.update({
        where: { id: latestToken.id },
        data: { usedAt: now },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.PASSWORD_RESET_REQUIRED,
          mustChangePassword: true,
        },
      }),
    ]);
    await createAuditLog({
      ...systemAuditActor(),
      action: AuditAction.TEMP_ACCESS_EXPIRED,
      module: 'Authentication',
      description: 'Temporary access code expired before it was used.',
      status: AuditStatus.WARNING,
      metadata: {
        targetUserId: userId,
        tokenId: latestToken.id,
      },
    });
    return null;
  }

  if (latestToken.tokenHash !== hashAccessSecret(normalizeTemporaryCode(code))) {
    const nextAttemptCount = latestToken.attemptCount + 1;
    await prisma.accountToken.update({
      where: { id: latestToken.id },
      data: {
        attemptCount: nextAttemptCount,
        lockedAt: nextAttemptCount >= TEMP_ACCESS_MAX_ATTEMPTS ? now : null,
      },
    });
    return null;
  }

  await prisma.$transaction([
    prisma.accountToken.update({
      where: { id: latestToken.id },
      data: {
        usedAt: now,
        attemptCount: latestToken.attemptCount + 1,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.TEMP_ACCESS,
        mustChangePassword: true,
      },
    }),
  ]);

  return createPasswordChangeOnlySession(userId);
}

function invalidateSession(session: Session) {
  if (session.user) {
    session.user.id = '';
    session.user.username = '';
    session.user.name = '';
    session.user.email = '';
    session.user.role = Role.CLIENT;
    session.user.accessScope = SessionAccessScope.FULL_ACCESS;
    session.user.mustChangePassword = false;
    session.user.accountSessionId = undefined;
    session.user.status = UserStatus.DISABLED;
  }

  session.expires = new Date(0).toISOString();
  return session;
}

export const authOptions: NextAuthOptions = {
  secret: requireServerEnv('NEXTAUTH_SECRET'),
  session: {
    strategy: 'jwt',
    maxAge: REMEMBERED_SESSION_AGE,
  },
  jwt: {
    maxAge: REMEMBERED_SESSION_AGE,
  },
  providers: [
    CredentialsProvider({
      name: 'Admin credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember me', type: 'checkbox' },
      },
      async authorize(credentials, request) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        const requestContext = getRequestContextFromHeaders(request?.headers);

        const logFailedLogin = async (
          description: string,
          metadata: Record<string, unknown>,
        ) => {
          await createAuditLog({
            userId: null,
            userName: email || 'Unknown login attempt',
            userRole: 'SYSTEM',
            action: AuditAction.LOGIN_FAILED,
            module: 'Authentication',
            description,
            status: AuditStatus.FAILED,
            ...requestContext,
            metadata,
          });
        };

        if (!email || !password) {
          await logFailedLogin('Admin login failed because credentials were incomplete.', {
            reason: 'missing_credentials',
            email,
          });
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (!user) {
          await logFailedLogin('Admin login failed because the account was not found.', {
            reason: 'account_not_found',
            email,
          });
          return null;
        }

        if (!ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
          await logFailedLogin('Admin login failed because the account has no admin access.', {
            reason: 'role_not_allowed',
            email,
            role: user.role,
            userId: user.id,
          });
          return null;
        }

        if (isBlockedStatus(user.status)) {
          await logFailedLogin('Admin login failed because the account is not active.', {
            reason: 'account_blocked',
            email,
            status: user.status,
            userId: user.id,
          });
          return null;
        }

        const passwordMatches = user.passwordHash
          ? await bcrypt.compare(password, user.passwordHash)
          : false;

        let accessScope: SessionAccessScope = SessionAccessScope.FULL_ACCESS;
        let accountSessionId: string | undefined;
        let scopedSessionExpiresAt: number | undefined;
        let mustChangePassword = user.mustChangePassword;

        if (!passwordMatches) {
          const temporarySession = await consumeTemporaryAccessCode(user.id, password);

          if (!temporarySession) {
            await logFailedLogin('Admin login failed because the password or access code was incorrect.', {
              reason: 'invalid_password_or_temp_code',
              email,
              userId: user.id,
            });
            return null;
          }

          accessScope = SessionAccessScope.PASSWORD_CHANGE_ONLY;
          accountSessionId = temporarySession.session.id;
          scopedSessionExpiresAt = temporarySession.session.expiresAt.getTime();
          mustChangePassword = true;
        }

        await createAuditLog({
          userId: user.id,
          userName: user.username,
          userRole: user.role,
          action: AuditAction.LOGIN,
          module: 'Authentication',
          description: accessScope === SessionAccessScope.PASSWORD_CHANGE_ONLY
            ? `${user.username} signed in with temporary access and must create a new password.`
            : `${user.username} signed in to the admin panel.`,
          status: AuditStatus.SUCCESS,
          ...requestContext,
          metadata: {
            rememberMe: credentials.rememberMe === 'true',
            accessScope,
          },
        });

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          username: user.username,
          role: user.role,
          rememberMe: credentials.rememberMe === 'true',
          accessScope,
          accountSessionId,
          mustChangePassword,
          sessionExpiresAt: scopedSessionExpiresAt,
          passwordVersionAt: user.lastPasswordChangedAt?.getTime() ?? Date.now(),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const rememberMe = Boolean(user.rememberMe);
        const sessionAge = await getSessionAgeSeconds(rememberMe);
        const scopedSessionExpiresAt =
          typeof user.sessionExpiresAt === 'number' ? user.sessionExpiresAt : undefined;
        token.sub = user.id;
        token.username = user.username;
        token.role = user.role;
        token.rememberMe = rememberMe;
        token.accessScope = user.accessScope ?? SessionAccessScope.FULL_ACCESS;
        token.accountSessionId = user.accountSessionId;
        token.mustChangePassword = Boolean(user.mustChangePassword);
        token.passwordVersionAt = user.passwordVersionAt;
        token.sessionExpiresAt = scopedSessionExpiresAt ?? Date.now() + sessionAge * 1000;
      } else if (!token.sessionExpiresAt) {
        const issuedAt = typeof token.iat === 'number' ? token.iat * 1000 : Date.now();
        token.rememberMe = false;
        token.accessScope = SessionAccessScope.FULL_ACCESS;
        token.mustChangePassword = false;
        token.sessionExpiresAt = issuedAt + (await getSessionAgeSeconds(false)) * 1000;
      }

      return token;
    },
    async session({ session, token }) {
      if (!token.sub || !session.user) {
        return session;
      }

      const sessionExpiresAt =
        typeof token.sessionExpiresAt === 'number'
          ? token.sessionExpiresAt
          : 0;

      if (!sessionExpiresAt || Date.now() >= sessionExpiresAt) {
        return invalidateSession(session);
      }

      const user = await prisma.user.findUnique({
        where: { id: token.sub },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          mustChangePassword: true,
          lastPasswordChangedAt: true,
        },
      });

      if (
        !user ||
        !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number]) ||
        isBlockedStatus(user.status)
      ) {
        return invalidateSession(session);
      }

      const passwordVersionAt = typeof token.passwordVersionAt === 'number'
        ? token.passwordVersionAt
        : typeof token.iat === 'number'
          ? token.iat * 1000
          : 0;
      const passwordChangedAt = user.lastPasswordChangedAt?.getTime() ?? 0;

      if (passwordChangedAt > 0 && passwordVersionAt + 1000 < passwordChangedAt) {
        return invalidateSession(session);
      }

      const accessScope = token.accessScope === SessionAccessScope.PASSWORD_CHANGE_ONLY
        ? SessionAccessScope.PASSWORD_CHANGE_ONLY
        : SessionAccessScope.FULL_ACCESS;
      const accountSessionId = typeof token.accountSessionId === 'string'
        ? token.accountSessionId
        : undefined;

      if (accessScope === SessionAccessScope.PASSWORD_CHANGE_ONLY) {
        if (!accountSessionId) {
          return invalidateSession(session);
        }

        const scopedSession = await prisma.accountSession.findUnique({
          where: { id: accountSessionId },
          select: {
            userId: true,
            accessScope: true,
            expiresAt: true,
            revokedAt: true,
          },
        });

        const scopedSessionExpired =
          scopedSession?.userId === user.id &&
          scopedSession?.expiresAt.getTime() <= Date.now();

        if (scopedSessionExpired) {
          await revokeExpiredPasswordChangeSession(accountSessionId, user.id);
        }

        if (
          !scopedSession ||
          scopedSession.userId !== user.id ||
          scopedSession.accessScope !== SessionAccessScope.PASSWORD_CHANGE_ONLY ||
          scopedSession.revokedAt ||
          scopedSessionExpired
        ) {
          return invalidateSession(session);
        }
      }

      session.user.id = user.id;
      session.user.username = user.username;
      session.user.name = user.username;
      session.user.email = user.email;
      session.user.role = user.role;
      session.user.status = user.status;
      session.user.mustChangePassword = user.mustChangePassword;
      session.user.accessScope = accessScope;
      session.user.accountSessionId = accountSessionId;
      session.expires = new Date(sessionExpiresAt).toISOString();
      return session;
    },
  },
  events: {
    async signOut(message) {
      const token = 'token' in message ? message.token : null;

      if (!token?.sub) {
        return;
      }

      await createAuditLog({
        userId: token.sub,
        userName: typeof token.username === 'string' ? token.username : 'Unknown admin',
        userRole: typeof token.role === 'string' ? token.role : 'ADMIN',
        action: AuditAction.LOGOUT,
        module: 'Authentication',
        description: `${typeof token.username === 'string' ? token.username : 'An administrator'} signed out of the admin panel.`,
        status: AuditStatus.SUCCESS,
      });
    },
  },
  pages: {
    signIn: '/admin',
    error: '/admin',
  },
};
