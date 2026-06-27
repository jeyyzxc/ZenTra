import { getServerSession } from 'next-auth';
import { Role } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type CurrentAdmin = {
  id: string;
  username: string;
  email: string;
  profileImage: string | null;
  role: typeof Role.SUPERADMIN | typeof Role.ADMIN;
};

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
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
    },
  });

  if (!user || (user.role !== Role.SUPERADMIN && user.role !== Role.ADMIN)) {
    return null;
  }

  return {
    ...user,
    role: user.role as CurrentAdmin['role'],
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
