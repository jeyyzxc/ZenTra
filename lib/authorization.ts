import { getServerSession } from 'next-auth';
import { Role, SessionAccessScope, UserStatus } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type CurrentAdmin = {
  id: string;
  username: string;
  email: string;
  profileImage: string | null;
  role: typeof Role.SUPERADMIN | typeof Role.ADMIN;
  fullName: string | null;
};

export function adminDisplayName(actor: Pick<CurrentAdmin, 'fullName' | 'email'>) {
  return actor.fullName?.trim() || actor.email;
}

export function adminFirstName(actor: Pick<CurrentAdmin, 'fullName'>) {
  return actor.fullName?.trim().split(/\s+/)[0] || 'Admin';
}

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  if (
    session.user.accessScope === SessionAccessScope.PASSWORD_CHANGE_ONLY ||
    session.user.mustChangePassword
  ) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      profileImage: true,
      role: true,
      status: true,
      fullName: true,
    },
  });

  if (
    !user ||
    (user.role !== Role.SUPERADMIN && user.role !== Role.ADMIN) ||
    user.status === UserStatus.DISABLED ||
    user.status === UserStatus.LOCKED
  ) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    profileImage: user.profileImage,
    role: user.role as CurrentAdmin['role'],
    fullName: user.fullName,
  };
}

export async function requireAdmin(): Promise<CurrentAdmin> {
  const user = await getCurrentAdmin();

  if (!user) {
    throw new Error('Unauthorized. Please sign in again.');
  }

  return user;
}

export async function requireSuperAdmin(): Promise<CurrentAdmin & { role: typeof Role.SUPERADMIN }> {
  const user = await requireAdmin();

  if (user.role !== Role.SUPERADMIN) {
    throw new Error('Forbidden. Superadmin access is required.');
  }

  return user as CurrentAdmin & { role: typeof Role.SUPERADMIN };
}
