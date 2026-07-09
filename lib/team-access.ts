import { createHmac, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import {
  AccountTokenType,
  AuditAction,
  AuditStatus,
  EmailStatus,
  EmailType,
  N8nWorkflowStatus,
  Prisma,
  RelatedModule,
  SessionAccessScope,
  TriggerSource,
  UserStatus,
} from '@prisma/client';
import { assertStrongPassword } from '@/lib/password-policy';
import { createAuditLog, systemAuditActor } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export const INVITATION_TTL_MS = 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
export const TEMP_ACCESS_TTL_MS = 15 * 60 * 1000;
export const TEMP_ACCESS_MAX_ATTEMPTS = 5;
export const TEMP_ACCESS_CODE_LENGTH = 8;
const TEMP_ACCESS_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export type TeamAccessUser = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  role: string;
};

type DbClient = typeof prisma | Prisma.TransactionClient;

type IssueTokenInput = {
  userId: string;
  tokenType: AccountTokenType;
  ttlMs: number;
  createdBy?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  temporaryCode?: boolean;
};

type AccessEmailKind = 'invitation' | 'password-reset' | 'temp-access';

type QueueAccessEmailInput = {
  kind: AccessEmailKind;
  user: TeamAccessUser;
  rawSecret: string;
  actorId?: string | null;
  expiresInMinutes: number;
};

export type TeamAccessEmailDelivery = {
  emailLogId: string;
  deliveryConfigured: boolean;
  delivered: boolean;
  errorMessage: string | null;
};

type TokenPreviewStatus =
  | 'valid'
  | 'missing'
  | 'not-found'
  | 'used'
  | 'expired'
  | 'disabled';

export type TokenPreview = {
  status: TokenPreviewStatus;
  message: string;
  user?: {
    fullName: string;
    email: string;
  };
};

function getTokenPepper() {
  return process.env.NEXTAUTH_SECRET || 'zentra-local-token-pepper';
}

function baseUrl() {
  return (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

function addMinutesLabel(minutes: number) {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }

  const hours = minutes / 60;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}

function displayName(user: TeamAccessUser) {
  return user.fullName?.trim() || user.username;
}

function accessUrl(pathname: '/setup-account' | '/reset-password', rawToken: string) {
  const url = new URL(pathname, baseUrl());
  url.searchParams.set('token', rawToken);
  return url.toString();
}

function makeTextEmail(input: QueueAccessEmailInput) {
  const name = displayName(input.user);
  const ttl = addMinutesLabel(input.expiresInMinutes);

  if (input.kind === 'invitation') {
    const link = accessUrl('/setup-account', input.rawSecret);
    return {
      subject: 'Set Up Your Team Account',
      text: `Hello ${name},

You have been invited to join the Event Management System as ${input.user.role}.

Please set up your account using this secure link:
${link}

This link will expire in ${ttl} and can only be used once.

If you did not expect this invitation, please ignore this email.`,
      secureUrl: link,
    };
  }

  if (input.kind === 'password-reset') {
    const link = accessUrl('/reset-password', input.rawSecret);
    return {
      subject: 'Password Reset Request',
      text: `Hello ${name},

A password reset was requested for your Event Management System account.

Please create a new password using this secure link:
${link}

This link will expire in ${ttl} and can only be used once.

If you did not request this, please contact your system administrator immediately.`,
      secureUrl: link,
    };
  }

  return {
    subject: 'Temporary Access Code',
    text: `Hello ${name},

A temporary access code was generated for your account.

Temporary Code:
${input.rawSecret}

This code will expire in ${ttl} and can only be used once.

After logging in, you must create a new password immediately. You will not be able to access the dashboard until your password is changed.

If you did not request this, please contact your system administrator immediately.`,
    secureUrl: null,
  };
}

function emailTypeFor(kind: AccessEmailKind) {
  if (kind === 'invitation') {
    return EmailType.TEAM_INVITATION;
  }

  if (kind === 'password-reset') {
    return EmailType.TEAM_PASSWORD_RESET;
  }

  return EmailType.TEAM_TEMP_ACCESS;
}

function workflowNameFor(kind: AccessEmailKind) {
  if (kind === 'invitation') {
    return 'team-invitation-email';
  }

  if (kind === 'password-reset') {
    return 'team-password-reset-email';
  }

  return 'team-temp-access-email';
}

function errorMessageOf(value: unknown) {
  return value instanceof Error ? value.message : null;
}

function teamAccessDeliveryErrorMessage(error: unknown) {
  const message = errorMessageOf(error);
  const cause = error instanceof Error
    ? errorMessageOf((error as Error & { cause?: unknown }).cause)
    : null;
  const combined = [message, cause].filter(Boolean).join(' ');

  if (/ERR_SSL_WRONG_VERSION_NUMBER|wrong version number/i.test(combined)) {
    return 'Team access email webhook failed because the URL protocol does not match the n8n server. Use http:// for a local HTTP n8n endpoint, or configure HTTPS for that n8n URL.';
  }

  if (/ECONNREFUSED/i.test(combined)) {
    return 'Team access email webhook could not connect to n8n. Check that n8n is running and N8N_TEAM_ACCESS_WEBHOOK_URL points to the reachable webhook URL.';
  }

  if (/ENOTFOUND/i.test(combined)) {
    return 'Team access email webhook host could not be resolved. Check N8N_TEAM_ACCESS_WEBHOOK_URL.';
  }

  return combined || 'Team access email delivery failed.';
}

function generateRawToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

function generateTemporaryCode() {
  const bytes = randomBytes(TEMP_ACCESS_CODE_LENGTH);

  return Array.from(bytes, (byte) => (
    TEMP_ACCESS_CODE_ALPHABET[byte % TEMP_ACCESS_CODE_ALPHABET.length]
  )).join('');
}

export function normalizeTemporaryCode(code: string) {
  return code.trim().replace(/[^a-z0-9]/gi, '').toUpperCase();
}

export function hashAccessSecret(rawSecret: string) {
  return createHmac('sha256', getTokenPepper()).update(rawSecret).digest('hex');
}

export async function issueAccountToken(
  client: DbClient,
  input: IssueTokenInput,
) {
  const now = new Date();
  const rawToken = input.temporaryCode ? generateTemporaryCode() : generateRawToken();

  await client.accountToken.updateMany({
    where: {
      userId: input.userId,
      tokenType: input.tokenType,
      usedAt: null,
    },
    data: {
      usedAt: now,
    },
  });

  const token = await client.accountToken.create({
    data: {
      userId: input.userId,
      tokenHash: hashAccessSecret(rawToken),
      tokenType: input.tokenType,
      expiresAt: new Date(now.getTime() + input.ttlMs),
      createdBy: input.createdBy ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });

  return {
    rawToken,
    token,
  };
}

export async function createPasswordChangeOnlySession(
  userId: string,
  ttlMs = TEMP_ACCESS_TTL_MS,
) {
  const rawSessionToken = generateRawToken();
  const now = new Date();
  const session = await prisma.accountSession.create({
    data: {
      userId,
      sessionTokenHash: hashAccessSecret(rawSessionToken),
      accessScope: SessionAccessScope.PASSWORD_CHANGE_ONLY,
      expiresAt: new Date(now.getTime() + ttlMs),
    },
  });

  return {
    rawSessionToken,
    session,
  };
}

export async function queueTeamAccessEmail(input: QueueAccessEmailInput) {
  const webhookUrl = process.env.N8N_TEAM_ACCESS_WEBHOOK_URL?.trim();
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET?.trim();
  const template = makeTextEmail(input);
  const now = new Date();
  const workflow = webhookUrl
    ? await prisma.n8nWorkflowLog.create({
        data: {
          workflowName: workflowNameFor(input.kind),
          relatedModule: 'user',
          relatedRecordId: input.user.id,
          triggerSource: input.actorId ? 'admin_action' : 'system',
          requestPayload: {
            targetUserId: input.user.id,
            recipientEmail: input.user.email,
            emailKind: input.kind,
            rawSecretPersisted: false,
          } as Prisma.InputJsonValue,
          status: N8nWorkflowStatus.PROCESSING,
          startedAt: now,
        },
      })
    : null;

  const emailLog = await prisma.emailLog.create({
    data: {
      recipientEmail: input.user.email,
      recipientName: displayName(input.user),
      emailType: emailTypeFor(input.kind),
      relatedModule: RelatedModule.USER,
      relatedRecordId: input.user.id,
      subject: template.subject,
      triggerSource: webhookUrl ? TriggerSource.N8N_WORKFLOW : TriggerSource.SYSTEM,
      workflowName: workflow?.workflowName ?? null,
      workflowExecutionId: workflow?.workflowExecutionId ?? null,
      status: webhookUrl ? EmailStatus.QUEUED : EmailStatus.PENDING,
      retryCount: 0,
      lastAttemptAt: now,
      emailPreview: `${template.subject} queued for ${input.user.email}. Secure link or code is intentionally omitted from logs.`,
      payloadSummary: {
        targetUserId: input.user.id,
        emailKind: input.kind,
        expiresInMinutes: input.expiresInMinutes,
        rawSecretPersisted: false,
      } as Prisma.InputJsonValue,
      resentBy: input.actorId ?? null,
    },
  });

  if (!webhookUrl) {
    return {
      emailLogId: emailLog.id,
      emailLog,
      deliveryConfigured: false,
      delivered: false,
      errorMessage: null,
    } satisfies TeamAccessEmailDelivery & { emailLog: typeof emailLog };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-zion-source': 'backend',
        'x-zion-event': 'team-access.email',
        'x-zion-email-kind': input.kind,
        'x-zion-idempotency-key': emailLog.id,
        ...(webhookSecret ? { 'x-zion-workflow-secret': webhookSecret } : {}),
      },
      body: JSON.stringify({
        emailLogId: emailLog.id,
        workflowLogId: workflow?.id,
        triggeredAt: now.toISOString(),
        recipientEmail: input.user.email,
        recipientName: displayName(input.user),
        subject: template.subject,
        text: template.text,
        secureUrl: template.secureUrl,
        temporaryCode: input.kind === 'temp-access' ? input.rawSecret : null,
        emailKind: input.kind,
      }),
    });

    if (!response.ok) {
      throw new Error(`Team access email webhook returned ${response.status}.`);
    }

    if (workflow) {
      await prisma.n8nWorkflowLog.update({
        where: { id: workflow.id },
        data: {
          status: N8nWorkflowStatus.SUCCESS,
          completedAt: new Date(),
        },
      });
    }

    return {
      emailLogId: emailLog.id,
      emailLog,
      deliveryConfigured: true,
      delivered: true,
      errorMessage: null,
    } satisfies TeamAccessEmailDelivery & { emailLog: typeof emailLog };
  } catch (error) {
    const errorMessage = teamAccessDeliveryErrorMessage(error);

    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: EmailStatus.FAILED,
        failedAt: new Date(),
        errorMessage,
      },
    });

    if (workflow) {
      await prisma.n8nWorkflowLog.update({
        where: { id: workflow.id },
        data: {
          status: N8nWorkflowStatus.FAILED,
          errorMessage,
          completedAt: new Date(),
        },
      });
    }

    return {
      emailLogId: emailLog.id,
      emailLog,
      deliveryConfigured: true,
      delivered: false,
      errorMessage,
    } satisfies TeamAccessEmailDelivery & { emailLog: typeof emailLog };
  }
}

function messageForTokenStatus(status: TokenPreviewStatus, tokenType: AccountTokenType) {
  if (status === 'missing' || status === 'not-found') {
    return tokenType === AccountTokenType.INVITATION
      ? 'This invitation link is invalid.'
      : 'This password reset link is invalid.';
  }

  if (status === 'used') {
    return 'This link has already been used.';
  }

  if (status === 'expired') {
    return 'This link has expired.';
  }

  if (status === 'disabled') {
    return 'This account cannot be updated right now.';
  }

  return '';
}

export async function getAccountTokenPreview(
  rawToken: string | undefined,
  tokenType: AccountTokenType,
): Promise<TokenPreview> {
  const tokenValue = rawToken?.trim();

  if (!tokenValue) {
    return {
      status: 'missing',
      message: messageForTokenStatus('missing', tokenType),
    };
  }

  const token = await prisma.accountToken.findFirst({
    where: {
      tokenHash: hashAccessSecret(tokenValue),
      tokenType,
    },
    include: {
      user: {
        select: {
          email: true,
          fullName: true,
          username: true,
          status: true,
        },
      },
    },
  });

  if (!token) {
    return {
      status: 'not-found',
      message: messageForTokenStatus('not-found', tokenType),
    };
  }

  if (token.usedAt) {
    return {
      status: 'used',
      message: messageForTokenStatus('used', tokenType),
    };
  }

  if (token.expiresAt.getTime() <= Date.now()) {
    return {
      status: 'expired',
      message: messageForTokenStatus('expired', tokenType),
    };
  }

  if (token.user.status === UserStatus.DISABLED || token.user.status === UserStatus.LOCKED) {
    return {
      status: 'disabled',
      message: messageForTokenStatus('disabled', tokenType),
    };
  }

  return {
    status: 'valid',
    message: '',
    user: {
      fullName: token.user.fullName || token.user.username,
      email: token.user.email,
    },
  };
}

export async function completePasswordWithToken(input: {
  rawToken: string;
  tokenType: typeof AccountTokenType.INVITATION | typeof AccountTokenType.PASSWORD_RESET;
  newPassword: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const tokenValue = input.rawToken.trim();

  if (!tokenValue) {
    throw new Error('This link is invalid.');
  }

  assertStrongPassword(input.newPassword);
  const tokenHash = hashAccessSecret(tokenValue);
  const now = new Date();

  const result = await prisma.$transaction(
    async (transaction) => {
      const token = await transaction.accountToken.findFirst({
        where: {
          tokenHash,
          tokenType: input.tokenType,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              fullName: true,
              role: true,
              status: true,
            },
          },
        },
      });

      if (!token) {
        throw new Error('This link is invalid.');
      }

      if (token.usedAt) {
        throw new Error('This link has already been used.');
      }

      if (token.expiresAt.getTime() <= now.getTime()) {
        await transaction.accountToken.update({
          where: { id: token.id },
          data: { usedAt: now },
        });

        if (
          input.tokenType === AccountTokenType.INVITATION &&
          token.user.status === UserStatus.PENDING_SETUP
        ) {
          await transaction.user.update({
            where: { id: token.userId },
            data: { status: UserStatus.INVITATION_EXPIRED },
          });
        }

        if (input.tokenType === AccountTokenType.PASSWORD_RESET) {
          await transaction.user.update({
            where: { id: token.userId },
            data: { status: UserStatus.RESET_EXPIRED },
          });
        }

        throw new Error('This link has expired.');
      }

      if (token.user.status === UserStatus.DISABLED || token.user.status === UserStatus.LOCKED) {
        throw new Error('This account cannot be updated right now.');
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      const updatedUser = await transaction.user.update({
        where: { id: token.userId },
        data: {
          passwordHash,
          status: UserStatus.ACTIVE,
          mustChangePassword: false,
          lastPasswordChangedAt: now,
        },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
        },
      });

      await transaction.accountToken.updateMany({
        where: {
          userId: token.userId,
          usedAt: null,
          tokenType: {
            in: [
              AccountTokenType.INVITATION,
              AccountTokenType.PASSWORD_RESET,
              AccountTokenType.TEMP_LOGIN,
            ],
          },
        },
        data: { usedAt: now },
      });

      await transaction.accountSession.updateMany({
        where: {
          userId: token.userId,
          revokedAt: null,
        },
        data: { revokedAt: now },
      });

      return {
        user: updatedUser,
        activated: input.tokenType === AccountTokenType.INVITATION,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  await createAuditLog({
    userId: result.user.id,
    userName: result.user.username,
    userRole: result.user.role,
    action: AuditAction.PASSWORD_CHANGED,
    module: 'Authentication',
    description: `${result.user.username} created a new password through a secure ${input.tokenType.toLowerCase()} link.`,
    status: AuditStatus.SUCCESS,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: {
      targetUserId: result.user.id,
      tokenType: input.tokenType,
    },
  });

  if (result.activated) {
    await createAuditLog({
      ...systemAuditActor(),
      action: AuditAction.ACCOUNT_ACTIVATED,
      module: 'Team',
      description: `${result.user.username} activated their team account.`,
      status: AuditStatus.SUCCESS,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      metadata: {
        targetUserId: result.user.id,
      },
    });
  }

  return result.user;
}

export async function revokeExpiredPasswordChangeSession(sessionId: string, userId: string) {
  const now = new Date();

  await prisma.$transaction([
    prisma.accountSession.updateMany({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
      },
    }),
    prisma.user.updateMany({
      where: {
        id: userId,
        mustChangePassword: true,
        status: UserStatus.TEMP_ACCESS,
      },
      data: {
        status: UserStatus.PASSWORD_RESET_REQUIRED,
      },
    }),
  ]);

  await createAuditLog({
    ...systemAuditActor(),
    action: AuditAction.TEMP_ACCESS_EXPIRED,
    module: 'Authentication',
    description: 'Temporary access expired before the required password change was completed.',
    status: AuditStatus.WARNING,
    metadata: {
      targetUserId: userId,
      sessionId,
    },
  });
}
