import type { DefaultSession } from 'next-auth';
import type { Role, SessionAccessScope, UserStatus } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      role: Role;
      status: UserStatus;
      accessScope: SessionAccessScope;
      mustChangePassword: boolean;
      accountSessionId?: string;
    } & DefaultSession['user'];
  }

  interface User {
    username: string;
    role: Role;
    rememberMe?: boolean;
    status?: UserStatus;
    accessScope?: SessionAccessScope;
    mustChangePassword?: boolean;
    accountSessionId?: string;
    sessionExpiresAt?: number;
    passwordVersionAt?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string;
    role?: Role;
    rememberMe?: boolean;
    sessionExpiresAt?: number;
    accessScope?: SessionAccessScope;
    mustChangePassword?: boolean;
    accountSessionId?: string;
    passwordVersionAt?: number;
  }
}
