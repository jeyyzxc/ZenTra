'use server';

import {
  AccountTokenType,
  AuditAction,
  AuditStatus,
  Prisma,
  RelatedModule,
  Role,
  UserStatus,
} from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auditActor, createAuditLog, errorMetadata } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/authorization';
import {
  INVITATION_TTL_MS,
  PASSWORD_RESET_TTL_MS,
  TEMP_ACCESS_TTL_MS,
  issueAccountToken,
  queueTeamAccessEmail,
  type TeamAccessEmailDelivery,
} from '@/lib/team-access';
import type {
  AdminRole,
  CreateTeamMemberInput,
  InviteTeamMemberResult,
  TeamAccessActionResult,
  TeamMember,
  TeamMemberStatus,
  UpdateTeamMemberInput,
} from './types';

const TEAM_MEMBER_SELECT = {
  id: true,
  username: true,
  fullName: true,
  email: true,
  contactNumber: true,
  addressRegionCode: true,
  addressRegion: true,
  addressProvinceCode: true,
  addressProvince: true,
  addressCityCode: true,
  addressCity: true,
  addressBarangayCode: true,
  addressBarangay: true,
  profileImage: true,
  role: true,
  status: true,
  mustChangePassword: true,
  lastPasswordChangedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type TeamMemberRecord = Prisma.UserGetPayload<{
  select: typeof TEAM_MEMBER_SELECT;
}>;

const EDITABLE_STATUSES = [
  UserStatus.PENDING_SETUP,
  UserStatus.ACTIVE,
  UserStatus.DISABLED,
  UserStatus.LOCKED,
] as const;

const TEAM_MEMBER_STATUSES = [
  UserStatus.PENDING_SETUP,
  UserStatus.ACTIVE,
  UserStatus.TEMP_ACCESS,
  UserStatus.PASSWORD_RESET_REQUIRED,
  UserStatus.DISABLED,
  UserStatus.LOCKED,
  UserStatus.INVITATION_EXPIRED,
  UserStatus.RESET_EXPIRED,
] as const;

function toTeamMember(user: TeamMemberRecord): TeamMember {
  assertAdminRole(user.role);
  assertTeamMemberStatus(user.status);

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    contactNumber: user.contactNumber,
    addressRegionCode: user.addressRegionCode,
    addressRegion: user.addressRegion,
    addressProvinceCode: user.addressProvinceCode,
    addressProvince: user.addressProvince,
    addressCityCode: user.addressCityCode,
    addressCity: user.addressCity,
    addressBarangayCode: user.addressBarangayCode,
    addressBarangay: user.addressBarangay,
    profileImage: user.profileImage,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    lastPasswordChangedAt: user.lastPasswordChangedAt?.toISOString() ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function teamMemberDisplayName(user: Pick<TeamMemberRecord, 'fullName' | 'email'>) {
  return user.fullName?.trim() || user.email;
}

function normalizeFullName(fullName: string) {
  return fullName.trim().replace(/\s+/g, ' ');
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function assertFullName(fullName: string) {
  if (fullName.length < 2 || fullName.length > 255) {
    throw new Error('Full name must be between 2 and 255 characters.');
  }
}

function assertEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }
}

function normalizeContactNumber(contactNumber?: string | null) {
  const rawContactNumber = contactNumber?.trim() ?? '';

  if (!rawContactNumber) {
    return null;
  }

  if (!/^[0-9+().\-\s]+$/.test(rawContactNumber)) {
    throw new Error('Contact number contains unsupported characters.');
  }

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

  return `+63${localDigits}`;
}

function assertAdminRole(role: string): asserts role is AdminRole {
  if (role !== Role.SUPERADMIN && role !== Role.ADMIN) {
    throw new Error('Only Admin or Super Admin can be assigned from Team Management.');
  }
}

function assertTeamMemberStatus(status: string): asserts status is TeamMemberStatus {
  if (!TEAM_MEMBER_STATUSES.includes(status as TeamMemberStatus)) {
    throw new Error('Account status is not supported from Team Management.');
  }
}

function assertEditableTeamMemberStatus(status: string): asserts status is TeamMemberStatus {
  if (!EDITABLE_STATUSES.includes(status as (typeof EDITABLE_STATUSES)[number])) {
    throw new Error('This account status can be viewed but cannot be manually assigned from Team Management.');
  }
}

function roleLabel(role: AdminRole) {
  return role === Role.SUPERADMIN ? 'super admin' : 'admin';
}

function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new Error('That email is already in use.');
    }

    if (error.code === 'P2025') {
      throw new Error('The selected team member no longer exists.');
    }
  }

  throw error;
}

function usernameBaseFromEmail(email: string) {
  const base = email
    .split('@')[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 26);

  return base && base.length >= 3 ? base : 'admin';
}

async function createUniqueUsername(transaction: Prisma.TransactionClient, email: string) {
  const base = usernameBaseFromEmail(email);

  for (let index = 0; index < 100; index += 1) {
    const username = index === 0 ? base : `${base}${index + 1}`;
    const existing = await transaction.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!existing) {
      return username;
    }
  }

  return `${base}${Date.now().toString(36)}`.slice(0, 32);
}

async function assertRetainsActiveSuperAdmin(
  transaction: Prisma.TransactionClient,
  target: TeamMemberRecord,
  nextRole: AdminRole,
  nextStatus: TeamMemberStatus,
) {
  const removesActiveSuperAdmin =
    target.role === Role.SUPERADMIN &&
    (nextRole !== Role.SUPERADMIN ||
      nextStatus !== UserStatus.ACTIVE);

  if (!removesActiveSuperAdmin) {
    return;
  }

  const remainingSuperAdmins = await transaction.user.count({
    where: {
      id: { not: target.id },
      role: Role.SUPERADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  if (remainingSuperAdmins < 1) {
    throw new Error('The system must always retain at least one active super admin.');
  }
}

async function assertCanDeleteTeamMember(
  transaction: Prisma.TransactionClient,
  target: TeamMemberRecord,
) {
  if (target.role !== Role.SUPERADMIN) {
    return;
  }

  const remainingSuperAdmins = await transaction.user.count({
    where: {
      id: { not: target.id },
      role: Role.SUPERADMIN,
      status: {
        notIn: [UserStatus.DISABLED, UserStatus.LOCKED],
      },
    },
  });

  if (remainingSuperAdmins < 1) {
    throw new Error('The system must always retain at least one active super admin.');
  }
}

function auditActionForStatusChange(previous: UserStatus, next: UserStatus) {
  if (previous === next) {
    return AuditAction.UPDATE;
  }

  if (next === UserStatus.DISABLED) {
    return AuditAction.ACCOUNT_DISABLED;
  }

  if (next === UserStatus.LOCKED) {
    return AuditAction.ACCOUNT_LOCKED;
  }

  if (next === UserStatus.ACTIVE) {
    return AuditAction.ACCOUNT_ACTIVATED;
  }

  return AuditAction.UPDATE;
}

async function logTeamFailure(
  actor: Awaited<ReturnType<typeof requireSuperAdmin>>,
  action: AuditAction,
  description: string,
  error: unknown,
  metadata?: Record<string, unknown>,
) {
  await createAuditLog({
    ...auditActor(actor),
    action,
    module: 'Team',
    description,
    status: AuditStatus.FAILED,
    metadata: {
      ...metadata,
      ...errorMetadata(error),
    },
  });
}

function requireReason(reason: string) {
  const normalized = reason.trim();

  if (normalized.length < 5 || normalized.length > 500) {
    throw new Error('A reason between 5 and 500 characters is required.');
  }

  return normalized;
}

function deliveryWarningFor(delivery: TeamAccessEmailDelivery, label: string) {
  if (!delivery.deliveryConfigured) {
    return `${label} was created, but email delivery is not configured. Set N8N_TEAM_ACCESS_WEBHOOK_URL, then resend from Team Management.`;
  }

  if (!delivery.delivered) {
    return `${label} was created, but n8n email delivery failed. ${delivery.errorMessage ?? 'Check Email Logs.'} Fix the webhook URL and resend from Team Management.`;
  }

  return null;
}

function deliveryAuditMetadata(delivery: TeamAccessEmailDelivery, warning: string | null) {
  return {
    emailLogId: delivery.emailLogId,
    emailDeliveryConfigured: delivery.deliveryConfigured,
    emailDelivered: delivery.delivered,
    ...(warning ? { emailDeliveryWarning: warning } : {}),
  };
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

export async function inviteTeamMember(data: CreateTeamMemberInput): Promise<InviteTeamMemberResult> {
  const actor = await requireSuperAdmin();

  try {
    const fullName = normalizeFullName(data.fullName);
    const email = normalizeEmail(data.email);
    const contactNumber = normalizeContactNumber(data.contactNumber);

    assertFullName(fullName);
    assertEmail(email);
    assertAdminRole(data.role);

    const { user, rawToken } = await prisma.$transaction(
      async (transaction) => {
        const username = await createUniqueUsername(transaction, email);
        const created = await transaction.user.create({
          data: {
            username,
            email,
            fullName,
            contactNumber,
            passwordHash: null,
            role: data.role,
            status: UserStatus.PENDING_SETUP,
            mustChangePassword: false,
            createdBy: actor.id,
          },
          select: TEAM_MEMBER_SELECT,
        });
        const issuedToken = await issueAccountToken(transaction, {
          userId: created.id,
          tokenType: AccountTokenType.INVITATION,
          ttlMs: INVITATION_TTL_MS,
          createdBy: actor.id,
        });

        return {
          user: created,
          rawToken: issuedToken.rawToken,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    const delivery = await queueTeamAccessEmail({
      kind: 'invitation',
      user,
      rawSecret: rawToken,
      actorId: actor.id,
      expiresInMinutes: INVITATION_TTL_MS / 60_000,
    });
    const deliveryWarning = deliveryWarningFor(delivery, 'Invitation');

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.TEAM_MEMBER_INVITED,
      module: 'Team',
      description: `Invited ${roleLabel(data.role)} ${teamMemberDisplayName(user)} to set up their account.`,
      status: deliveryWarning ? AuditStatus.WARNING : AuditStatus.SUCCESS,
      newValues: toTeamMember(user),
      metadata: {
        targetUserId: user.id,
        invitationExpiresInMinutes: INVITATION_TTL_MS / 60_000,
        ...deliveryAuditMetadata(delivery, deliveryWarning),
      },
    });

    revalidatePath('/admin/team');
    return {
      member: toTeamMember(user),
      deliveryWarning,
    };
  } catch (error) {
    await logTeamFailure(
      actor,
      AuditAction.TEAM_MEMBER_INVITED,
      'Failed to invite a team member.',
      error,
      {
        fullName: data.fullName,
        email: data.email,
        contactNumber: data.contactNumber,
        role: data.role,
      },
    );
    handlePrismaError(error);
  }
}

export async function updateTeamMember(data: UpdateTeamMemberInput): Promise<TeamMember> {
  const actor = await requireSuperAdmin();

  if (!data.id) {
    throw new Error('A team member ID is required.');
  }

  const email = normalizeEmail(data.email);

  assertEmail(email);
  assertAdminRole(data.role);
  assertTeamMemberStatus(data.status);

  if (
    data.id === actor.id &&
    (data.role !== Role.SUPERADMIN || data.status !== UserStatus.ACTIVE)
  ) {
    throw new Error('You cannot demote, disable, or lock your own active super admin account.');
  }

  try {
    const { user, previous } = await prisma.$transaction(
      async (transaction) => {
        const existing = await transaction.user.findUnique({
          where: { id: data.id },
          select: {
            ...TEAM_MEMBER_SELECT,
            passwordHash: true,
          },
        });

        if (!existing || (existing.role !== Role.SUPERADMIN && existing.role !== Role.ADMIN)) {
          throw new Error('The selected team member no longer exists.');
        }

        if (data.status !== existing.status) {
          assertEditableTeamMemberStatus(data.status);
        }

        if (data.status === UserStatus.ACTIVE && !existing.passwordHash) {
          throw new Error('Pending accounts must complete their invitation before activation.');
        }

        const submittedFullName = normalizeFullName(data.fullName);
        const existingFullName = normalizeFullName(existing.fullName ?? '');
        const submittedContactNumber = normalizeContactNumber(data.contactNumber);

        if (submittedFullName !== existingFullName) {
          throw new Error('Full name can only be changed by the account owner from My Profile.');
        }

        if (submittedContactNumber !== existing.contactNumber) {
          throw new Error('Phone number can only be changed by the account owner from My Profile.');
        }

        await assertRetainsActiveSuperAdmin(transaction, existing, data.role, data.status);

        const updated = await transaction.user.update({
          where: { id: data.id },
          data: {
            email,
            role: data.role,
            status: data.status,
            mustChangePassword: data.status === UserStatus.ACTIVE
              ? existing.mustChangePassword
              : false,
          },
          select: TEAM_MEMBER_SELECT,
        });

        if (data.status === UserStatus.DISABLED || data.status === UserStatus.LOCKED) {
          await transaction.accountSession.updateMany({
            where: {
              userId: data.id,
              revokedAt: null,
            },
            data: {
              revokedAt: new Date(),
            },
          });
        }

        return {
          previous: existing,
          user: updated,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    const action = previous.role !== user.role
      ? AuditAction.ROLE_CHANGED
      : auditActionForStatusChange(previous.status, user.status);

    await createAuditLog({
      ...auditActor(actor),
      action,
      module: 'Team',
      description: action === AuditAction.ROLE_CHANGED
        ? `Changed ${teamMemberDisplayName(user)}'s role from ${previous.role} to ${user.role}.`
        : `Updated team member ${teamMemberDisplayName(user)}.`,
      status: AuditStatus.SUCCESS,
      previousValues: toTeamMember(previous),
      newValues: toTeamMember(user),
      metadata: {
        targetUserId: user.id,
      },
    });

    revalidatePath('/admin/team');
    return toTeamMember(user);
  } catch (error) {
    await logTeamFailure(
      actor,
      AuditAction.UPDATE,
      'Failed to update a team member account.',
      error,
      {
        targetUserId: data.id,
        fullName: data.fullName,
        email: data.email,
        contactNumber: data.contactNumber,
        role: data.role,
        status: data.status,
      },
    );
    handlePrismaError(error);
  }
}

export async function resendInvitation(userId: string): Promise<TeamAccessActionResult> {
  const actor = await requireSuperAdmin();

  try {
    const { user, rawToken } = await prisma.$transaction(
      async (transaction) => {
        const target = await transaction.user.findUnique({
          where: { id: userId },
          select: {
            ...TEAM_MEMBER_SELECT,
            passwordHash: true,
          },
        });

        if (!target || (target.role !== Role.SUPERADMIN && target.role !== Role.ADMIN)) {
          throw new Error('The selected team member no longer exists.');
        }

        if (target.passwordHash && target.status === UserStatus.ACTIVE) {
          throw new Error('This account is already active. Use password reset instead.');
        }

        const updated = await transaction.user.update({
          where: { id: userId },
          data: {
            status: UserStatus.PENDING_SETUP,
            mustChangePassword: false,
          },
          select: TEAM_MEMBER_SELECT,
        });
        const issuedToken = await issueAccountToken(transaction, {
          userId,
          tokenType: AccountTokenType.INVITATION,
          ttlMs: INVITATION_TTL_MS,
          createdBy: actor.id,
        });

        return {
          user: updated,
          rawToken: issuedToken.rawToken,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    const delivery = await queueTeamAccessEmail({
      kind: 'invitation',
      user,
      rawSecret: rawToken,
      actorId: actor.id,
      expiresInMinutes: INVITATION_TTL_MS / 60_000,
    });
    const deliveryWarning = deliveryWarningFor(delivery, 'Invitation');

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.INVITATION_RESENT,
      module: 'Team',
      description: `Resent the setup invitation to ${teamMemberDisplayName(user)}.`,
      status: deliveryWarning ? AuditStatus.WARNING : AuditStatus.SUCCESS,
      metadata: {
        targetUserId: user.id,
        ...deliveryAuditMetadata(delivery, deliveryWarning),
      },
    });

    revalidatePath('/admin/team');
    return { success: true, deliveryWarning };
  } catch (error) {
    await logTeamFailure(
      actor,
      AuditAction.INVITATION_RESENT,
      'Failed to resend a team invitation.',
      error,
      { targetUserId: userId },
    );
    handlePrismaError(error);
  }
}

export async function sendPasswordResetLink(
  userId: string,
  reason: string,
): Promise<TeamAccessActionResult> {
  const actor = await requireSuperAdmin();
  const normalizedReason = requireReason(reason);

  if (userId === actor.id) {
    throw new Error('You cannot reset your own account from Team Management.');
  }

  try {
    const { user, rawToken } = await prisma.$transaction(
      async (transaction) => {
        const target = await transaction.user.findUnique({
          where: { id: userId },
          select: {
            ...TEAM_MEMBER_SELECT,
            passwordHash: true,
          },
        });

        if (!target || (target.role !== Role.SUPERADMIN && target.role !== Role.ADMIN)) {
          throw new Error('The selected team member no longer exists.');
        }

        if (!target.passwordHash || target.status === UserStatus.PENDING_SETUP) {
          throw new Error('This account has not been set up yet. Resend the invitation instead.');
        }

        if (target.status === UserStatus.DISABLED || target.status === UserStatus.LOCKED) {
          throw new Error('Disabled or locked accounts cannot receive a reset link.');
        }

        const issuedToken = await issueAccountToken(transaction, {
          userId,
          tokenType: AccountTokenType.PASSWORD_RESET,
          ttlMs: PASSWORD_RESET_TTL_MS,
          createdBy: actor.id,
        });

        return {
          user: target,
          rawToken: issuedToken.rawToken,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    const delivery = await queueTeamAccessEmail({
      kind: 'password-reset',
      user,
      rawSecret: rawToken,
      actorId: actor.id,
      expiresInMinutes: PASSWORD_RESET_TTL_MS / 60_000,
    });
    const deliveryWarning = deliveryWarningFor(delivery, 'Password reset link');

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.PASSWORD_RESET_LINK_SENT,
      module: 'Team',
      description: `Sent a password reset link to ${teamMemberDisplayName(user)}.`,
      status: deliveryWarning ? AuditStatus.WARNING : AuditStatus.SUCCESS,
      metadata: {
        targetUserId: user.id,
        reason: normalizedReason,
        ...deliveryAuditMetadata(delivery, deliveryWarning),
      },
    });

    revalidatePath('/admin/team');
    return { success: true, deliveryWarning };
  } catch (error) {
    await logTeamFailure(
      actor,
      AuditAction.PASSWORD_RESET_LINK_SENT,
      'Failed to send a password reset link.',
      error,
      {
        targetUserId: userId,
        reason: normalizedReason,
      },
    );
    handlePrismaError(error);
  }
}

export async function sendTemporaryAccessCode(
  userId: string,
  reason: string,
): Promise<TeamAccessActionResult> {
  const actor = await requireSuperAdmin();
  const normalizedReason = requireReason(reason);

  if (userId === actor.id) {
    throw new Error('You cannot create temporary access for your own account from Team Management.');
  }

  try {
    const { user, rawToken } = await prisma.$transaction(
      async (transaction) => {
        const target = await transaction.user.findUnique({
          where: { id: userId },
          select: {
            ...TEAM_MEMBER_SELECT,
            passwordHash: true,
          },
        });

        if (!target || (target.role !== Role.SUPERADMIN && target.role !== Role.ADMIN)) {
          throw new Error('The selected team member no longer exists.');
        }

        if (!target.passwordHash || target.status === UserStatus.PENDING_SETUP) {
          throw new Error('This account has not been set up yet. Resend the invitation instead.');
        }

        if (target.status === UserStatus.DISABLED || target.status === UserStatus.LOCKED) {
          throw new Error('Disabled or locked accounts cannot receive temporary access.');
        }

        const issuedToken = await issueAccountToken(transaction, {
          userId,
          tokenType: AccountTokenType.TEMP_LOGIN,
          ttlMs: TEMP_ACCESS_TTL_MS,
          createdBy: actor.id,
          temporaryCode: true,
        });

        return {
          user: target,
          rawToken: issuedToken.rawToken,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    const delivery = await queueTeamAccessEmail({
      kind: 'temp-access',
      user,
      rawSecret: rawToken,
      actorId: actor.id,
      expiresInMinutes: TEMP_ACCESS_TTL_MS / 60_000,
    });
    const deliveryWarning = deliveryWarningFor(delivery, 'Temporary access code');

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.TEMP_ACCESS_CODE_SENT,
      module: 'Team',
      description: `Sent a temporary access code to ${teamMemberDisplayName(user)}.`,
      status: deliveryWarning ? AuditStatus.WARNING : AuditStatus.SUCCESS,
      metadata: {
        targetUserId: user.id,
        reason: normalizedReason,
        expiresInMinutes: TEMP_ACCESS_TTL_MS / 60_000,
        ...deliveryAuditMetadata(delivery, deliveryWarning),
      },
    });

    revalidatePath('/admin/team');
    return { success: true, deliveryWarning };
  } catch (error) {
    await logTeamFailure(
      actor,
      AuditAction.TEMP_ACCESS_CODE_SENT,
      'Failed to send a temporary access code.',
      error,
      {
        targetUserId: userId,
        reason: normalizedReason,
      },
    );
    handlePrismaError(error);
  }
}

export async function disableTeamMember(userId: string): Promise<TeamMember> {
  const actor = await requireSuperAdmin();

  if (!userId) {
    throw new Error('A team member ID is required.');
  }

  if (userId === actor.id) {
    throw new Error('You cannot disable your own active super admin account.');
  }

  try {
    const { user, previous } = await prisma.$transaction(
      async (transaction) => {
        const target = await transaction.user.findUnique({
          where: { id: userId },
          select: TEAM_MEMBER_SELECT,
        });

        if (!target || (target.role !== Role.SUPERADMIN && target.role !== Role.ADMIN)) {
          throw new Error('The selected team member no longer exists.');
        }

        await assertRetainsActiveSuperAdmin(transaction, target, target.role, UserStatus.DISABLED);

        const updated = await transaction.user.update({
          where: { id: userId },
          data: {
            status: UserStatus.DISABLED,
            mustChangePassword: false,
          },
          select: TEAM_MEMBER_SELECT,
        });

        await transaction.accountSession.updateMany({
          where: {
            userId,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });

        return {
          previous: target,
          user: updated,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.ACCOUNT_DISABLED,
      module: 'Team',
      description: `Disabled ${teamMemberDisplayName(user)}'s account.`,
      status: AuditStatus.SUCCESS,
      previousValues: toTeamMember(previous),
      newValues: toTeamMember(user),
      metadata: {
        targetUserId: user.id,
      },
    });

    revalidatePath('/admin/team');
    return toTeamMember(user);
  } catch (error) {
    await logTeamFailure(
      actor,
      AuditAction.ACCOUNT_DISABLED,
      'Failed to disable a team member account.',
      error,
      {
        targetUserId: userId,
      },
    );
    handlePrismaError(error);
  }
}

export async function deleteTeamMember(userId: string): Promise<{ success: true; deletedId: string }> {
  const actor = await requireSuperAdmin();

  if (!userId) {
    throw new Error('A team member ID is required.');
  }

  if (userId === actor.id) {
    throw new Error('You cannot delete your own active super admin account.');
  }

  try {
    const deleted = await prisma.$transaction(
      async (transaction) => {
        const target = await transaction.user.findUnique({
          where: { id: userId },
          select: TEAM_MEMBER_SELECT,
        });

        if (!target || (target.role !== Role.SUPERADMIN && target.role !== Role.ADMIN)) {
          throw new Error('The selected team member no longer exists.');
        }

        await assertCanDeleteTeamMember(transaction, target);

        await transaction.emailLog.deleteMany({
          where: {
            relatedModule: RelatedModule.USER,
            relatedRecordId: userId,
          },
        });

        await transaction.n8nWorkflowLog.deleteMany({
          where: {
            relatedModule: 'user',
            relatedRecordId: userId,
          },
        });

        await transaction.emailLog.updateMany({
          where: { resentBy: userId },
          data: { resentBy: null },
        });

        await transaction.user.updateMany({
          where: { createdBy: userId },
          data: { createdBy: null },
        });

        await transaction.accountToken.updateMany({
          where: { createdBy: userId },
          data: { createdBy: null },
        });

        await transaction.user.delete({
          where: { id: userId },
        });

        return target;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.DELETE,
      module: 'Team',
      description: 'Deleted a team member account permanently.',
      status: AuditStatus.SUCCESS,
      metadata: {
        deletedUserId: deleted.id,
        deletedUserRole: deleted.role,
        deletedUserStatus: deleted.status,
      },
    });

    revalidatePath('/admin/team');
    return { success: true, deletedId: deleted.id };
  } catch (error) {
    await logTeamFailure(
      actor,
      AuditAction.DELETE,
      'Failed to delete a team member account.',
      error,
      {
        targetUserId: userId,
      },
    );
    handlePrismaError(error);
  }
}
