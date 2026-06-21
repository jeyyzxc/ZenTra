import type { DefaultSession } from 'next-auth';
import type { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      role: Role;
    } & DefaultSession['user'];
  }

  interface User {
    username: string;
    role: Role;
    rememberMe?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string;
    role?: Role;
    rememberMe?: boolean;
    sessionExpiresAt?: number;
  }
}
