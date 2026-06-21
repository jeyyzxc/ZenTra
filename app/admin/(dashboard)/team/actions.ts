'use server';

import bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/authorization';
import { assertStrongPassword } from '@/lib/password-policy';
import type {
  AdminRole,
  CreateTeamMemberInput,
  TeamMember,
  UpdateTeamMemberInput,
} from './types';

const TEAM_MEMBER_SELECT = {
  id: true,
  username: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type TeamMemberRecord = Prisma.UserGetPayload<{
  select: typeof TEAM_MEMBER_SELECT;
}>;

function toTeamMember(user: TeamMemberRecord): TeamMember {
  assertAdminRole(user.role);

  return {
    ...user,
    role: user.role,
  };
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function assertUsername(username: string) {
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new Error('Username must be 3-32 characters and use only letters, numbers, dots, underscores, or hyphens.');
  }
}

function assertEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }
}

function assertAdminRole(role: string): asserts role is AdminRole {
  if (role !== Role.SUPERADMIN && role !== Role.ADMIN) {
    throw new Error('Only Admin or Superadmin can be assigned from Team Management.');
  }
}

function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new Error('That username or email is already in use.');
    }

    if (error.code === 'P2025') {
      throw new Error('The selected team member no longer exists.');
    }
  }

  throw error;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  await requireSuperAdmin();

  const users = await prisma.user.findMany({
    where: {
      role: {
        in: [Role.SUPERADMIN, Role.ADMIN],
      },
    },
    select: TEAM_MEMBER_SELECT,
    orderBy: { createdAt: 'desc' },
  });

  return users.map(toTeamMember);
}

export async function createAdminUser(data: CreateTeamMemberInput): Promise<TeamMember> {
  await requireSuperAdmin();

  const username = normalizeUsername(data.username);
  const email = normalizeEmail(data.email);
  assertUsername(username);
  assertEmail(email);
  assertStrongPassword(data.password);
  assertAdminRole(data.role);

  const passwordHash = await bcrypt.hash(data.password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: passwordHash,
        role: data.role,
      },
      select: TEAM_MEMBER_SELECT,
    });

    revalidatePath('/admin/team');
    return toTeamMember(user);
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function updateAdminUser(data: UpdateTeamMemberInput): Promise<TeamMember> {
  const actor = await requireSuperAdmin();
  const username = normalizeUsername(data.username);
  const email = normalizeEmail(data.email);
  const password = data.password?.trim();

  if (!data.id) {
    throw new Error('A team member ID is required.');
  }

  assertUsername(username);
  assertEmail(email);
  assertAdminRole(data.role);

  if (password) {
    assertStrongPassword(password);
  }

  if (data.id === actor.id && data.role !== Role.SUPERADMIN) {
    throw new Error('You cannot demote your own active superadmin account.');
  }

  try {
    const user = await prisma.$transaction(
      async (transaction) => {
        const existing = await transaction.user.findUnique({
          where: { id: data.id },
          select: { id: true, role: true },
        });

        if (!existing || (existing.role !== Role.SUPERADMIN && existing.role !== Role.ADMIN)) {
          throw new Error('The selected team member no longer exists.');
        }

        if (existing.role === Role.SUPERADMIN && data.role !== Role.SUPERADMIN) {
          const superadminCount = await transaction.user.count({
            where: { role: Role.SUPERADMIN },
          });

          if (superadminCount <= 1) {
            throw new Error('The system must always retain at least one superadmin.');
          }
        }

        return transaction.user.update({
          where: { id: data.id },
          data: {
            username,
            email,
            role: data.role,
            ...(password ? { password: await bcrypt.hash(password, 12) } : {}),
          },
          select: TEAM_MEMBER_SELECT,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    revalidatePath('/admin/team');
    return toTeamMember(user);
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deleteTeamMember(id: string): Promise<{ id: string }> {
  const actor = await requireSuperAdmin();

  if (!id) {
    throw new Error('A team member ID is required.');
  }

  if (id === actor.id) {
    throw new Error('You cannot delete your own active superadmin account.');
  }

  try {
    await prisma.$transaction(
      async (transaction) => {
        const target = await transaction.user.findUnique({
          where: { id },
          select: { role: true },
        });

        if (!target || (target.role !== Role.SUPERADMIN && target.role !== Role.ADMIN)) {
          throw new Error('The selected team member no longer exists.');
        }

        if (target.role === Role.SUPERADMIN) {
          const superadminCount = await transaction.user.count({
            where: { role: Role.SUPERADMIN },
          });

          if (superadminCount <= 1) {
            throw new Error('The system must always retain at least one superadmin.');
          }
        }

        await transaction.user.delete({ where: { id } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    revalidatePath('/admin/team');
    return { id };
  } catch (error) {
    handlePrismaError(error);
  }
}
