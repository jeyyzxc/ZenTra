import { randomUUID } from 'node:crypto';
import {
  AuditAction,
  AuditStatus,
  NotificationPriority,
  NotificationType,
  Prisma,
  Role,
  TestimonyStatus,
} from '@prisma/client';
import { revalidatePath } from 'next/cache';
import {
  auditActor,
  createAuditLog,
  errorMetadata,
  getRequestContext,
} from '@/lib/audit';
import type { CurrentAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import {
  deleteTestimonyPhoto,
  TestimonyPhotoError,
  uploadTestimonyPhoto,
} from '@/lib/testimony-photo-storage';

const REQUIRED_RATINGS = [
  'overallRating',
  'approachRating',
  'foodRating',
  'serviceRating',
] as const;
const OPTIONAL_RATINGS = ['venueRating', 'communicationRating'] as const;
const PROFANITY_PATTERN = /\b(fuck|shit|bitch|asshole|puta|gago|tangina)\b/i;

export class TestimonyError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'TestimonyError';
    this.status = status;
  }
}

type PublicSort = 'recent' | 'highest';
type TestimonyAction = 'approve' | 'hide' | 'flag' | 'delete' | 'restore' | 'feature';

type TestimonyRecord = {
  id: string;
  clientName: string;
  nickname: string | null;
  email: string | null;
  eventType: string;
  eventDate: Date;
  packageName: string | null;
  bookingReference: string | null;
  bookingId: string | null;
  overallRating: number;
  approachRating: number;
  foodRating: number;
  serviceRating: number;
  venueRating: number | null;
  communicationRating: number | null;
  comment: string;
  photoUrl: string | null;
  status: TestimonyStatus;
  isPublic: boolean;
  isFeatured: boolean;
  submittedAt: Date;
  approvedBy: string | null;
  approvedAt: Date | null;
  hiddenBy: string | null;
  hiddenAt: Date | null;
  deletedBy: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function text(value: unknown, maxLength = 255) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function optionalText(value: unknown, maxLength = 255) {
  const normalized = text(value, maxLength);
  return normalized || null;
}

function parseRating(value: unknown, label: string, required: boolean) {
  if ((value === null || value === undefined || value === '') && !required) {
    return null;
  }

  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new TestimonyError(`${label} must be between 1 and 5 stars.`);
  }

  return rating;
}

function parseDate(value: unknown, label: string) {
  const raw = text(value, 40);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T12:00:00.000Z`)
    : new Date(raw);

  if (!raw || Number.isNaN(date.getTime())) {
    throw new TestimonyError(`${label} is required.`);
  }

  return date;
}

function startOfDay(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function endOfDay(value: string) {
  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function booleanValue(value: unknown) {
  return value === true || value === 'true' || value === 'on' || value === '1';
}

function testimonyToDto(testimony: TestimonyRecord, includePrivate = false) {
  return {
    id: testimony.id,
    clientName: testimony.nickname || testimony.clientName,
    fullName: includePrivate ? testimony.clientName : undefined,
    nickname: includePrivate ? testimony.nickname : undefined,
    email: includePrivate ? testimony.email : undefined,
    eventType: testimony.eventType,
    eventDate: testimony.eventDate.toISOString(),
    packageName: testimony.packageName,
    bookingReference: includePrivate ? testimony.bookingReference : undefined,
    bookingId: includePrivate ? testimony.bookingId : undefined,
    overallRating: testimony.overallRating,
    approachRating: testimony.approachRating,
    foodRating: testimony.foodRating,
    serviceRating: testimony.serviceRating,
    venueRating: testimony.venueRating,
    communicationRating: testimony.communicationRating,
    comment: testimony.comment,
    photoUrl: testimony.photoUrl,
    status: includePrivate ? testimony.status.toLowerCase() : undefined,
    isPublic: includePrivate ? testimony.isPublic : undefined,
    isFeatured: testimony.isFeatured,
    submittedAt: testimony.submittedAt.toISOString(),
    approvedBy: includePrivate ? testimony.approvedBy : undefined,
    approvedAt: includePrivate ? testimony.approvedAt?.toISOString() ?? null : undefined,
    hiddenBy: includePrivate ? testimony.hiddenBy : undefined,
    hiddenAt: includePrivate ? testimony.hiddenAt?.toISOString() ?? null : undefined,
    deletedBy: includePrivate ? testimony.deletedBy : undefined,
    deletedAt: includePrivate ? testimony.deletedAt?.toISOString() ?? null : undefined,
    createdAt: testimony.createdAt.toISOString(),
    updatedAt: testimony.updatedAt.toISOString(),
  };
}

async function requestPayload(request: Request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const payload: Record<string, FormDataEntryValue> = {};
    formData.forEach((value, key) => {
      payload[key] = value;
    });
    return {
      payload,
      photo: formData.get('photo') instanceof File ? formData.get('photo') as File : null,
    };
  }

  return {
    payload: await request.json() as Record<string, unknown>,
    photo: null,
  };
}

async function publicFilterOptions() {
  const [eventCategories, packages] = await Promise.all([
    prisma.eventCategory.findMany({
      where: { status: 'ACTIVE', clientVisible: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: { name: true },
    }),
    prisma.testimony.findMany({
      where: {
        status: TestimonyStatus.APPROVED,
        isPublic: true,
        packageName: { not: null },
      },
      distinct: ['packageName'],
      orderBy: { packageName: 'asc' },
      select: { packageName: true },
    }),
  ]);

  return {
    eventTypes: eventCategories.map((category) => category.name),
    packages: packages.flatMap((item) => item.packageName ? [item.packageName] : []),
  };
}

export async function getPublicTestimonies(url: URL) {
  const eventType = text(url.searchParams.get('eventType'), 160);
  const packageName = text(url.searchParams.get('package'), 255);
  const rating = Number(url.searchParams.get('rating'));
  const withPhotos = url.searchParams.get('withPhotos') === 'true';
  const sort = url.searchParams.get('sort') === 'highest' ? 'highest' : 'recent' satisfies PublicSort;
  const where: Prisma.TestimonyWhereInput = {
    status: TestimonyStatus.APPROVED,
    isPublic: true,
    deletedAt: null,
  };

  if (eventType) where.eventType = eventType;
  if (packageName) where.packageName = packageName;
  if (Number.isInteger(rating) && rating >= 1 && rating <= 5) where.overallRating = rating;
  if (withPhotos) where.photoUrl = { not: null };

  const [testimonies, filterOptions] = await Promise.all([
    prisma.testimony.findMany({
      where,
      orderBy: sort === 'highest'
        ? [{ overallRating: 'desc' }, { submittedAt: 'desc' }]
        : [{ submittedAt: 'desc' }],
    }),
    publicFilterOptions(),
  ]);

  return {
    testimonies: testimonies.map((item) => testimonyToDto(item)),
    filterOptions,
  };
}

export async function getFeaturedTestimonies(limit = 6) {
  const testimonies = await prisma.testimony.findMany({
    where: {
      status: TestimonyStatus.APPROVED,
      isPublic: true,
      deletedAt: null,
    },
    orderBy: [{ isFeatured: 'desc' }, { submittedAt: 'desc' }],
    take: Math.min(Math.max(limit, 1), 12),
  });

  return testimonies.map((item) => testimonyToDto(item));
}

export async function submitTestimony(request: Request) {
  const { payload, photo } = await requestPayload(request);
  const clientName = text(payload.clientName ?? payload.name ?? payload.nickname, 160);
  const nickname = optionalText(payload.nickname, 120);
  const email = optionalText(payload.email, 255)?.toLowerCase() ?? null;
  const eventType = text(payload.eventType, 160);
  const eventDate = parseDate(payload.eventDate, 'Event date');
  const packageName = optionalText(payload.packageName, 255);
  const bookingReference = optionalText(payload.bookingReference, 120);
  const comment = text(payload.comment, 1001);
  const consent = booleanValue(payload.consent);

  if (!clientName) throw new TestimonyError('Name or nickname is required.');
  if (!eventType) throw new TestimonyError('Event type is required.');
  if (eventDate.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
    throw new TestimonyError('Event date cannot be in the future.');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new TestimonyError('Please enter a valid email address.');
  }
  if (comment.length < 20) {
    throw new TestimonyError('Please share at least a short comment about your experience.');
  }
  if (comment.length > 1000) {
    throw new TestimonyError('Testimony must not exceed 1,000 characters.');
  }
  if (!consent) {
    throw new TestimonyError('Consent is required before feedback can be considered for public display.');
  }

  const ratings = Object.fromEntries([
    ...REQUIRED_RATINGS.map((key) => [
      key,
      parseRating(payload[key], key.replace('Rating', ''), true),
    ]),
    ...OPTIONAL_RATINGS.map((key) => [
      key,
      parseRating(payload[key], key.replace('Rating', ''), false),
    ]),
  ]) as {
    overallRating: number;
    approachRating: number;
    foodRating: number;
    serviceRating: number;
    venueRating: number | null;
    communicationRating: number | null;
  };

  const id = randomUUID();
  let storedPhoto: Awaited<ReturnType<typeof uploadTestimonyPhoto>> | null = null;

  try {
    if (photo && photo.size > 0) {
      storedPhoto = await uploadTestimonyPhoto({ file: photo, testimonyId: id });
    }

    const booking = bookingReference
      ? await prisma.booking.findUnique({
          where: { bookingReference },
          select: { id: true },
        })
      : null;
    const isFlagged = PROFANITY_PATTERN.test(comment);
    const testimony = await prisma.$transaction(async (tx) => {
      const created = await tx.testimony.create({
        data: {
          id,
          clientName,
          nickname,
          email,
          eventType,
          eventDate,
          packageName,
          bookingReference,
          bookingId: booking?.id ?? null,
          ...ratings,
          comment,
          photoUrl: storedPhoto?.publicUrl ?? null,
          photoPath: storedPhoto?.path ?? null,
          status: isFlagged ? TestimonyStatus.FLAGGED : TestimonyStatus.PENDING_REVIEW,
          isPublic: false,
        },
      });

      await tx.notification.create({
        data: {
          title: isFlagged ? 'Testimony flagged for review' : 'New testimony submitted',
          message: `New testimony submitted by ${nickname || clientName} for ${eventType}.`,
          type: NotificationType.TESTIMONY,
          priority: NotificationPriority.LOW,
          relatedModule: 'testimonies',
          relatedRecordId: created.id,
          source: 'client_testimony_form',
        },
      });

      return created;
    });

    await createAuditLog({
      userId: null,
      userName: nickname || clientName,
      userRole: 'PUBLIC',
      action: AuditAction.SUBMISSION,
      module: 'Testimonies',
      description: `${nickname || clientName} submitted a testimony for ${eventType}.`,
      status: isFlagged ? AuditStatus.WARNING : AuditStatus.SUCCESS,
      ...getRequestContext(request),
      newValues: {
        testimonyId: testimony.id,
        eventType,
        eventDate,
        ratings,
        status: testimony.status,
        hasPhoto: Boolean(storedPhoto),
      },
    });

    return {
      id: testimony.id,
      status: testimony.status.toLowerCase(),
      message: 'Thank you for sharing your experience. Your testimony is now awaiting review.',
    };
  } catch (error) {
    if (storedPhoto) await deleteTestimonyPhoto(storedPhoto.path);
    throw error;
  }
}

function adminWhere(url: URL): Prisma.TestimonyWhereInput {
  const where: Prisma.TestimonyWhereInput = {};
  const search = text(url.searchParams.get('search'), 200);
  const eventType = text(url.searchParams.get('eventType'), 160);
  const status = text(url.searchParams.get('status'), 40).toUpperCase();
  const visibility = text(url.searchParams.get('visibility'), 20);
  const withPhoto = text(url.searchParams.get('withPhoto'), 10);
  const submittedStart = startOfDay(text(url.searchParams.get('submittedStart'), 10));
  const submittedEnd = endOfDay(text(url.searchParams.get('submittedEnd'), 10));
  const eventStart = startOfDay(text(url.searchParams.get('eventStart'), 10));
  const eventEnd = endOfDay(text(url.searchParams.get('eventEnd'), 10));

  if (search) {
    where.OR = [
      { clientName: { contains: search, mode: 'insensitive' } },
      { nickname: { contains: search, mode: 'insensitive' } },
      { comment: { contains: search, mode: 'insensitive' } },
      { eventType: { contains: search, mode: 'insensitive' } },
      { bookingReference: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (eventType) where.eventType = eventType;
  if (Object.values(TestimonyStatus).includes(status as TestimonyStatus)) {
    where.status = status as TestimonyStatus;
  }
  if (visibility === 'public') where.isPublic = true;
  if (visibility === 'hidden') where.isPublic = false;
  if (withPhoto === 'true') where.photoUrl = { not: null };
  if (withPhoto === 'false') where.photoUrl = null;
  if (submittedStart || submittedEnd) {
    where.submittedAt = {
      ...(submittedStart ? { gte: submittedStart } : {}),
      ...(submittedEnd ? { lte: submittedEnd } : {}),
    };
  }
  if (eventStart || eventEnd) {
    where.eventDate = {
      ...(eventStart ? { gte: eventStart } : {}),
      ...(eventEnd ? { lte: eventEnd } : {}),
    };
  }

  for (const key of REQUIRED_RATINGS) {
    const rating = Number(url.searchParams.get(key));
    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
      where[key] = rating;
    }
  }

  return where;
}

export async function getAdminTestimonies(url: URL) {
  const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 10, 5), 50);
  const where = adminWhere(url);
  const [testimonies, totalRecords, eventTypes] = await Promise.all([
    prisma.testimony.findMany({
      where,
      orderBy: [{ submittedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.testimony.count({ where }),
    prisma.testimony.findMany({
      distinct: ['eventType'],
      orderBy: { eventType: 'asc' },
      select: { eventType: true },
    }),
  ]);

  return {
    testimonies: testimonies.map((item) => testimonyToDto(item, true)),
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
    },
    filterOptions: {
      eventTypes: eventTypes.map((item) => item.eventType),
      statuses: Object.values(TestimonyStatus).map((statusValue) => statusValue.toLowerCase()),
    },
  };
}

export async function getAdminTestimony(id: string) {
  const testimony = await prisma.testimony.findUnique({ where: { id } });
  if (!testimony) throw new TestimonyError('Testimony not found.', 404);
  return testimonyToDto(testimony, true);
}

export async function getTestimonyAnalytics() {
  const approvedWhere = {
    status: TestimonyStatus.APPROVED,
    isPublic: true,
    deletedAt: null,
  } satisfies Prisma.TestimonyWhereInput;
  const [
    total,
    pending,
    approved,
    averages,
    distribution,
    eventGroups,
  ] = await Promise.all([
    prisma.testimony.count(),
    prisma.testimony.count({ where: { status: TestimonyStatus.PENDING_REVIEW } }),
    prisma.testimony.count({ where: approvedWhere }),
    prisma.testimony.aggregate({
      where: approvedWhere,
      _avg: {
        overallRating: true,
        approachRating: true,
        foodRating: true,
        serviceRating: true,
      },
    }),
    prisma.testimony.groupBy({
      by: ['overallRating'],
      where: approvedWhere,
      _count: { _all: true },
      orderBy: { overallRating: 'desc' },
    }),
    prisma.testimony.groupBy({
      by: ['eventType'],
      where: approvedWhere,
      _avg: { overallRating: true },
      _count: { _all: true },
    }),
  ]);
  const highestRatedEventType = eventGroups
    .sort((a, b) => (b._avg.overallRating ?? 0) - (a._avg.overallRating ?? 0))[0] ?? null;

  return {
    total,
    pending,
    approved,
    averages: {
      overall: averages._avg.overallRating ?? 0,
      approach: averages._avg.approachRating ?? 0,
      food: averages._avg.foodRating ?? 0,
      service: averages._avg.serviceRating ?? 0,
    },
    distribution: [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: distribution.find((item) => item.overallRating === rating)?._count._all ?? 0,
    })),
    highestRatedEventType: highestRatedEventType
      ? {
          eventType: highestRatedEventType.eventType,
          average: highestRatedEventType._avg.overallRating ?? 0,
          count: highestRatedEventType._count._all,
        }
      : null,
  };
}

function actionAudit(action: TestimonyAction) {
  if (action === 'approve') return AuditAction.APPROVAL;
  if (action === 'delete') return AuditAction.DELETE;
  return AuditAction.UPDATE;
}

export async function moderateTestimony(
  id: string,
  action: TestimonyAction,
  actor: CurrentAdmin,
  request: Request,
  options?: { featured?: boolean },
) {
  const existing = await prisma.testimony.findUnique({ where: { id } });
  if (!existing) throw new TestimonyError('Testimony not found.', 404);
  if (action === 'feature' && actor.role !== Role.SUPERADMIN) {
    throw new TestimonyError('Only a Super Admin can change featured testimonies.', 403);
  }

  const now = new Date();
  const data: Prisma.TestimonyUpdateInput = {};
  if (action === 'approve' || action === 'restore') {
    data.status = TestimonyStatus.APPROVED;
    data.isPublic = true;
    data.approvedBy = actor.username;
    data.approvedAt = now;
    data.hiddenBy = null;
    data.hiddenAt = null;
    data.deletedBy = null;
    data.deletedAt = null;
  } else if (action === 'hide') {
    data.status = TestimonyStatus.HIDDEN;
    data.isPublic = false;
    data.isFeatured = false;
    data.hiddenBy = actor.username;
    data.hiddenAt = now;
  } else if (action === 'flag') {
    data.status = TestimonyStatus.FLAGGED;
    data.isPublic = false;
    data.isFeatured = false;
  } else if (action === 'delete') {
    data.status = TestimonyStatus.DELETED;
    data.isPublic = false;
    data.isFeatured = false;
    data.deletedBy = actor.username;
    data.deletedAt = now;
  } else if (action === 'feature') {
    if (existing.status !== TestimonyStatus.APPROVED || !existing.isPublic) {
      throw new TestimonyError('Only approved public testimonies can be featured.');
    }
    data.isFeatured = Boolean(options?.featured);
  }

  try {
    const updated = await prisma.testimony.update({ where: { id }, data });
    const actionLabel = action === 'feature'
      ? (updated.isFeatured ? 'featured' : 'unfeatured')
      : {
          approve: 'approved',
          hide: 'hidden',
          flag: 'flagged',
          delete: 'deleted',
          restore: 'restored',
        }[action];

    await createAuditLog({
      ...auditActor(actor),
      action: actionAudit(action),
      module: 'Testimonies',
      description: `${actor.username} ${actionLabel} ${existing.clientName}'s testimony.`,
      status: AuditStatus.SUCCESS,
      ...getRequestContext(request),
      previousValues: {
        status: existing.status,
        isPublic: existing.isPublic,
        isFeatured: existing.isFeatured,
      },
      newValues: {
        status: updated.status,
        isPublic: updated.isPublic,
        isFeatured: updated.isFeatured,
      },
      metadata: { testimonyId: id, action },
    });

    revalidatePath('/');
    revalidatePath('/about');
    revalidatePath('/testimonies');
    revalidatePath('/admin/testimonies');

    return testimonyToDto(updated, true);
  } catch (error) {
    await createAuditLog({
      ...auditActor(actor),
      action: actionAudit(action),
      module: 'Testimonies',
      description: `${actor.username} failed to ${action} a testimony.`,
      status: AuditStatus.FAILED,
      ...getRequestContext(request),
      metadata: { testimonyId: id, action, ...errorMetadata(error) },
    });
    throw error;
  }
}

export function testimonyErrorResponse(error: unknown, fallback = 'Unable to process testimony.') {
  if (error instanceof TestimonyError || error instanceof TestimonyPhotoError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Error && error.message.startsWith('Unauthorized')) {
    return Response.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof Error && error.message.startsWith('Forbidden')) {
    return Response.json({ error: error.message }, { status: 403 });
  }

  if (error instanceof SyntaxError) {
    return Response.json({ error: 'The request body is invalid.' }, { status: 400 });
  }

  console.error(fallback, error);
  return Response.json({ error: fallback }, { status: 500 });
}
