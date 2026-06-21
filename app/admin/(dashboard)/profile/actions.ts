'use server';

import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authorization';
import { assertStrongPassword } from '@/lib/password-policy';
import { prisma } from '@/lib/prisma';
import type {
  AdminProfile,
  ChangePasswordInput,
  UpdateProfileInput,
} from './types';

const PROFILE_SELECT = {
  id: true,
  username: true,
  email: true,
  fullName: true,
  contactNumber: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toAdminProfile(profile: {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  contactNumber: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}): AdminProfile {
  if (profile.role !== Role.SUPERADMIN && profile.role !== Role.ADMIN) {
    throw new Error('This account does not have admin access.');
  }

  return {
    ...profile,
    role: profile.role,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

function normalizeProfileInput(data: UpdateProfileInput) {
  const fullName = data.fullName.trim();
  const contactNumber = data.contactNumber.trim();

  if (fullName.length < 2 || fullName.length > 255) {
    throw new Error('Full name must be between 2 and 255 characters.');
  }

  if (contactNumber.length > 20) {
    throw new Error('Contact number cannot exceed 20 characters.');
  }

  if (contactNumber && !/^[0-9+().\-\s]+$/.test(contactNumber)) {
    throw new Error('Contact number contains unsupported characters.');
  }

  return {
    fullName,
    contactNumber: contactNumber || null,
  };
}

export async function getOwnProfile(): Promise<AdminProfile> {
  const actor = await requireAdmin();
  const profile = await prisma.user.findUnique({
    where: { id: actor.id },
    select: PROFILE_SELECT,
  });

  if (!profile) {
    throw new Error('Your account no longer exists.');
  }

  return toAdminProfile(profile);
}

export async function updateOwnProfile(data: UpdateProfileInput): Promise<AdminProfile> {
  const actor = await requireAdmin();
  const normalized = normalizeProfileInput(data);

  const profile = await prisma.user.update({
    where: { id: actor.id },
    data: normalized,
    select: PROFILE_SELECT,
  });

  revalidatePath('/admin/profile');
  revalidatePath('/admin', 'layout');
  return toAdminProfile(profile);
}

export async function changeOwnPassword(
  data: ChangePasswordInput,
): Promise<{ success: true }> {
  const actor = await requireAdmin();

  if (!data.currentPassword || !data.newPassword || !data.confirmNewPassword) {
    throw new Error('All password fields are required.');
  }

  if (data.newPassword !== data.confirmNewPassword) {
    throw new Error('New password and confirmation do not match.');
  }

  assertStrongPassword(data.newPassword);

  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { password: true },
  });

  if (!user || !(await bcrypt.compare(data.currentPassword, user.password))) {
    throw new Error('Current password is incorrect.');
  }

  if (await bcrypt.compare(data.newPassword, user.password)) {
    throw new Error('New password must be different from your current password.');
  }

  await prisma.user.update({
    where: { id: actor.id },
    data: {
      password: await bcrypt.hash(data.newPassword, 12),
    },
  });

  revalidatePath('/admin/profile');
  return { success: true };
}
