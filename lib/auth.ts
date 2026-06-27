import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { AuditAction, AuditStatus, Role } from '@prisma/client';
import { createAuditLog, getRequestContextFromHeaders } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { requireServerEnv } from '@/lib/env';

const ADMIN_ROLES = [Role.SUPERADMIN, Role.ADMIN] as const;
const DEFAULT_SESSION_AGE = 8 * 60 * 60;
const REMEMBERED_SESSION_AGE = 30 * 24 * 60 * 60;

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

        if (!(await bcrypt.compare(password, user.password))) {
          await logFailedLogin('Admin login failed because the password was incorrect.', {
            reason: 'invalid_password',
            email,
            userId: user.id,
          });
          return null;
        }

        await createAuditLog({
          userId: user.id,
          userName: user.username,
          userRole: user.role,
          action: AuditAction.LOGIN,
          module: 'Authentication',
          description: `${user.username} signed in to the admin panel.`,
          status: AuditStatus.SUCCESS,
          ...requestContext,
          metadata: {
            rememberMe: credentials.rememberMe === 'true',
          },
        });

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          username: user.username,
          role: user.role,
          rememberMe: credentials.rememberMe === 'true',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const rememberMe = Boolean(user.rememberMe);
        token.sub = user.id;
        token.username = user.username;
        token.role = user.role;
        token.rememberMe = rememberMe;
        token.sessionExpiresAt =
          Date.now() +
          (rememberMe ? REMEMBERED_SESSION_AGE : DEFAULT_SESSION_AGE) * 1000;
      } else if (!token.sessionExpiresAt) {
        const issuedAt = typeof token.iat === 'number' ? token.iat * 1000 : Date.now();
        token.rememberMe = false;
        token.sessionExpiresAt = issuedAt + DEFAULT_SESSION_AGE * 1000;
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
        session.user.id = '';
        session.user.username = '';
        session.user.name = '';
        session.user.email = '';
        session.user.role = Role.CLIENT;
        session.expires = new Date(0).toISOString();
        return session;
      }

      const user = await prisma.user.findUnique({
        where: { id: token.sub },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      });

      if (!user || !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
        session.user.id = '';
        session.user.username = '';
        session.user.name = '';
        session.user.email = '';
        session.user.role = Role.CLIENT;
        return session;
      }

      session.user.id = user.id;
      session.user.username = user.username;
      session.user.name = user.username;
      session.user.email = user.email;
      session.user.role = user.role;
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
