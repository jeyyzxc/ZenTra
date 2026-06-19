'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma, Role } from '@prisma/client';

type AdminRole = typeof Role.SUPERADMIN | typeof Role.ADMIN;

// TODO: Integrate actual session check here when NextAuth is fully configured
async function ensureSuperAdmin() {
  // Mock validation for now: In production, check session.user.role === 'SUPERADMIN'
  return true; 
}

function assertAdminRole(role: Role): asserts role is AdminRole {
  if (role !== Role.SUPERADMIN && role !== Role.ADMIN) {
    throw new Error('Only admin roles can be assigned from Team Management.');
  }
}

export async function getTeamMembers() {
  await ensureSuperAdmin();
  return await prisma.user.findMany({
    where: {
      role: {
        in: [Role.SUPERADMIN, Role.ADMIN],
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createAdminUser(data: { name: string; email: string; role: AdminRole }) {
  await ensureSuperAdmin();

  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  assertAdminRole(data.role);

  if (!name || !email) {
    throw new Error('Name and email are required.');
  }

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: data.role,
      }
    });
  
    revalidatePath('/admin/team');
    return user;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error('A team member with this email already exists.');
    }

    throw error;
  }
}

export async function deleteTeamMember(id: string) {
  await ensureSuperAdmin();
  await prisma.user.delete({
    where: { id }
  });
  revalidatePath('/admin/team');
}

export async function updateTeamMemberRole(id: string, role: Role) {
  await ensureSuperAdmin();
  const user = await prisma.user.update({
    where: { id },
    data: { role }
  });
  revalidatePath('/admin/team');
  return user;
}
