import { AuditAction, AuditStatus } from '@prisma/client';
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { createAuditLog, getRequestContext, systemAuditActor } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import {
  enforceRateLimit,
  hashedRateLimitIdentity,
  requestIpAddress,
} from '@/services/rate-limit.service';
import { CommandCenterError } from '@/services/command-center';

export const CLIENT_ACCESS_COOKIE = 'zentra_client_access';
const REQUEST_RESPONSE = 'If the booking details match, a one-time verification code will be sent through the registered contact channel.';

function secret() {
  const value = process.env.CLIENT_ACCESS_HASH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (!value) throw new CommandCenterError('Client verification is not configured.', 503);
  return value;
}

function keyedHash(purpose: string, value: string) {
  return createHmac('sha256', secret()).update(`${purpose}|${value}`).digest('hex');
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase().slice(0, 255) : '';
}

function normalizePhone(value: unknown) {
  return typeof value === 'string' ? value.replace(/\D/g, '').slice(-15) : '';
}

function reference() {
  return `cav_${randomBytes(24).toString('base64url')}`;
}

function cookieValue(request: Request, name: string) {
  const cookies = request.headers.get('cookie') || '';
  for (const pair of cookies.split(';')) {
    const [key, ...rest] = pair.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

async function deliverCode(input: {
  requestReference: string;
  bookingReference: string;
  clientName: string;
  channel: 'EMAIL' | 'PHONE';
  recipient: string;
  code: string;
  expiresAt: Date;
}) {
  const webhookUrl = process.env.N8N_CLIENT_ACCESS_WEBHOOK_URL?.trim();
  const webhookSecret = process.env.BACKEND_ORCHESTRATION_SECRET?.trim();
  if (!webhookUrl || !webhookSecret) {
    if (process.env.NODE_ENV === 'production') throw new Error('Client verification delivery is unavailable.');
    const developmentCode = process.env.CLIENT_ACCESS_DEV_CODE?.trim();
    if (!developmentCode || developmentCode !== input.code) {
      throw new Error('Client verification development delivery is not configured.');
    }
    return;
  }
  const url = new URL(webhookUrl);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Client verification webhook URL is invalid.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-zion-source': 'backend',
        'x-n8n-secret': webhookSecret,
        'x-zion-event': 'client.access.code.requested',
      },
      body: JSON.stringify({
        requestReference: input.requestReference,
        bookingReference: input.bookingReference,
        clientName: input.clientName,
        channel: input.channel,
        recipient: input.recipient,
        code: input.code,
        expiresAt: input.expiresAt.toISOString(),
      }),
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Client verification delivery failed.');
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestClientAccess(request: Request, body: Record<string, unknown>) {
  const bookingReference = typeof body.bookingReference === 'string' ? body.bookingReference.trim().toUpperCase().slice(0, 120) : '';
  const channel = body.channel === 'PHONE' ? 'PHONE' : 'EMAIL';
  const contact = channel === 'EMAIL' ? normalizeEmail(body.contact) : normalizePhone(body.contact);
  const fakeReference = reference();
  await enforceRateLimit({
    scope: 'client-access-request-ip',
    identity: hashedRateLimitIdentity([requestIpAddress(request)]),
    limit: 5,
    windowSeconds: 15 * 60,
  });
  await enforceRateLimit({
    scope: 'client-access-request-booking',
    identity: hashedRateLimitIdentity([bookingReference || 'missing']),
    limit: 5,
    windowSeconds: 60 * 60,
  });

  if (!bookingReference || !contact) {
    return { message: REQUEST_RESPONSE, requestReference: fakeReference };
  }
  const booking = await prisma.booking.findUnique({
    where: { bookingReference },
    select: {
      id: true,
      bookingReference: true,
      clientName: true,
      clientEmail: true,
      clientPhone: true,
    },
  });
  const expectedContact = channel === 'EMAIL'
    ? normalizeEmail(booking?.clientEmail)
    : normalizePhone(booking?.clientPhone);
  if (!booking || !expectedContact || expectedContact !== contact) {
    await createAuditLog({
      ...systemAuditActor(),
      ...getRequestContext(request),
      action: AuditAction.READ,
      module: 'ZENTRA Client Access',
      description: 'Rejected a non-matching booking verification request.',
      status: AuditStatus.WARNING,
      metadata: { event: 'CLIENT_ACCESS_REQUEST_REJECTED', bookingReferenceHash: sha256(bookingReference) },
    });
    return { message: REQUEST_RESPONSE, requestReference: fakeReference };
  }

  const code = process.env.NODE_ENV !== 'production' && process.env.CLIENT_ACCESS_DEV_CODE?.trim()
    ? process.env.CLIENT_ACCESS_DEV_CODE.trim()
    : String(randomInt(0, 1_000_000)).padStart(6, '0');
  const requestReference = reference();
  const codeExpiresAt = new Date(Date.now() + 10 * 60_000);
  const grant = await prisma.clientAccessGrant.create({
    data: {
      publicReference: requestReference,
      bookingId: booking.id,
      contactChannel: channel,
      contactHash: keyedHash('contact', contact),
      codeHash: keyedHash('otp', `${requestReference}|${code}`),
      codeExpiresAt,
      ...getRequestContext(request),
    },
  });
  try {
    await deliverCode({
      requestReference,
      bookingReference: booking.bookingReference,
      clientName: booking.clientName,
      channel,
      recipient: contact,
      code,
      expiresAt: codeExpiresAt,
    });
  } catch {
    await prisma.clientAccessGrant.delete({ where: { id: grant.id } });
    return { message: REQUEST_RESPONSE, requestReference: fakeReference };
  }
  await createAuditLog({
    ...systemAuditActor(),
    ...getRequestContext(request),
    action: AuditAction.SUBMISSION,
    module: 'ZENTRA Client Access',
    description: `Issued a one-time client verification code for booking ${booking.bookingReference}.`,
    status: AuditStatus.SUCCESS,
    metadata: { event: 'CLIENT_ACCESS_CODE_ISSUED', clientAccessGrantId: grant.id, bookingId: booking.id, channel },
  });
  return { message: REQUEST_RESPONSE, requestReference };
}

export async function verifyClientAccess(request: Request, body: Record<string, unknown>) {
  const requestReference = typeof body.requestReference === 'string' ? body.requestReference.trim().slice(0, 80) : '';
  const code = typeof body.code === 'string' ? body.code.replace(/\D/g, '').slice(0, 6) : '';
  await enforceRateLimit({
    scope: 'client-access-verify-ip',
    identity: hashedRateLimitIdentity([requestIpAddress(request)]),
    limit: 10,
    windowSeconds: 15 * 60,
  });
  const grant = requestReference ? await prisma.clientAccessGrant.findUnique({
    where: { publicReference: requestReference },
    include: { booking: { select: { id: true, bookingReference: true } } },
  }) : null;
  const expected = grant?.codeHash || keyedHash('otp', `${requestReference}|000000`);
  const received = keyedHash('otp', `${requestReference}|${code}`);
  const validHash = expected.length === received.length && timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  const isValid = Boolean(
    grant && validHash && code.length === 6 && grant.codeExpiresAt > new Date() &&
    !grant.verifiedAt && !grant.revokedAt && grant.attemptCount < 5,
  );
  if (!isValid) {
    if (grant) {
      await prisma.clientAccessGrant.update({
        where: { id: grant.id },
        data: { attemptCount: { increment: 1 }, revokedAt: grant.attemptCount + 1 >= 5 ? new Date() : undefined },
      });
    }
    throw new CommandCenterError('The verification code is invalid or expired.', 401);
  }
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 30 * 60_000);
  await prisma.clientAccessGrant.update({
    where: { id: grant!.id },
    data: {
      verifiedAt: new Date(),
      grantTokenHash: sha256(token),
      grantExpiresAt: expiresAt,
      ipAddress: getRequestContext(request).ipAddress,
      userAgent: getRequestContext(request).userAgent,
    },
  });
  await createAuditLog({
    ...systemAuditActor(),
    ...getRequestContext(request),
    action: AuditAction.LOGIN,
    module: 'ZENTRA Client Access',
    description: `Verified booking-scoped client access for ${grant!.booking.bookingReference}.`,
    status: AuditStatus.SUCCESS,
    metadata: { event: 'CLIENT_ACCESS_VERIFIED', clientAccessGrantId: grant!.id, bookingId: grant!.bookingId },
  });
  return { token, expiresAt, bookingReference: grant!.booking.bookingReference };
}

export async function resolveClientAccess(request: Request) {
  const token = cookieValue(request, CLIENT_ACCESS_COOKIE);
  if (!token) return null;
  return prisma.clientAccessGrant.findFirst({
    where: {
      grantTokenHash: sha256(token),
      verifiedAt: { not: null },
      revokedAt: null,
      grantExpiresAt: { gt: new Date() },
    },
    include: {
      booking: {
        select: {
          id: true,
          bookingReference: true,
          clientName: true,
          eventTitle: true,
          eventType: true,
          eventDate: true,
          status: true,
          paymentSummaryStatus: true,
          paymentTotalAmount: true,
          paymentAmountPaid: true,
          paymentRemainingBalance: true,
          contractStatus: true,
        },
      },
    },
  });
}

export async function revokeClientAccess(request: Request) {
  const token = cookieValue(request, CLIENT_ACCESS_COOKIE);
  if (token) {
    await prisma.clientAccessGrant.updateMany({
      where: { grantTokenHash: sha256(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

