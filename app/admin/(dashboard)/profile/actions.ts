'use server';

import bcrypt from 'bcryptjs';
import { AuditAction, AuditStatus, Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auditActor, createAuditLog, errorMetadata } from '@/lib/audit';
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
  profileImage: true,
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
  profileImage: string | null;
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
  const rawContactNumber = data.contactNumber.trim();
  let contactNumber = '';

  if (fullName.length < 2 || fullName.length > 255) {
    throw new Error('Full name must be between 2 and 255 characters.');
  }

  if (rawContactNumber && !/^[0-9+().\-\s]+$/.test(rawContactNumber)) {
    throw new Error('Contact number contains unsupported characters.');
  }

  if (rawContactNumber) {
    const digits = rawContactNumber.replace(/\D/g, '');
    const localDigits = digits.startsWith('63')
      ? digits.slice(2)
      : digits.startsWith('0') ? digits.slice(1) : digits;

    if (localDigits.length < 10) {
      throw new Error('Please enter a valid Philippine phone number.');
    }

    if (localDigits.length > 12) {
      throw new Error('Contact number is too long.');
    }

    contactNumber = `+63${localDigits}`;
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

  try {
    const normalized = normalizeProfileInput(data);
    const previous = await prisma.user.findUnique({
      where: { id: actor.id },
      select: PROFILE_SELECT,
    });

    if (!previous) {
      throw new Error('Your account no longer exists.');
    }

    const profile = await prisma.user.update({
      where: { id: actor.id },
      data: normalized,
      select: PROFILE_SELECT,
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.PROFILE_UPDATE,
      module: 'Profile',
      description: `${actor.username} updated their profile details.`,
      status: AuditStatus.SUCCESS,
      previousValues: {
        fullName: previous.fullName,
        contactNumber: previous.contactNumber,
      },
      newValues: {
        fullName: profile.fullName,
        contactNumber: profile.contactNumber,
      },
      metadata: {
        targetUserId: actor.id,
      },
    });

    revalidatePath('/admin/profile');
    revalidatePath('/admin', 'layout');
    return toAdminProfile(profile);
  } catch (error) {
    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.PROFILE_UPDATE,
      module: 'Profile',
      description: `${actor.username} failed to update their profile details.`,
      status: AuditStatus.FAILED,
      metadata: {
        targetUserId: actor.id,
        fullName: data.fullName,
        contactNumber: data.contactNumber,
        ...errorMetadata(error),
      },
    });

    throw error;
  }
}

export async function changeOwnPassword(
  data: ChangePasswordInput,
): Promise<{ success: true }> {
  const actor = await requireAdmin();

  try {
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

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.PASSWORD_CHANGE,
      module: 'Profile',
      description: `${actor.username} changed their admin password.`,
      status: AuditStatus.SUCCESS,
      metadata: {
        targetUserId: actor.id,
      },
    });

    revalidatePath('/admin/profile');
    return { success: true };
  } catch (error) {
    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.PASSWORD_CHANGE,
      module: 'Profile',
      description: `${actor.username} failed to change their admin password.`,
      status: AuditStatus.FAILED,
      metadata: {
        targetUserId: actor.id,
        ...errorMetadata(error),
      },
    });

    throw error;
  }
}
