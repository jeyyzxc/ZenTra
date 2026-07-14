import { randomUUID } from 'node:crypto';
import { AuditAction, AuditStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { auditActor, createAuditLog, errorMetadata, getRequestContext } from '@/lib/audit';
import { adminDisplayName, requireAdmin } from '@/lib/authorization';
import { getObjectStorage } from '@/lib/object-storage';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_VALIDATION_MESSAGE = 'File must be a JPEG, PNG, or WebP image under 2 MB.';

function avatarBucket() {
  return process.env.SUPABASE_PROFILE_MEDIA_BUCKET?.trim() || 'profile-media';
}

type AvatarExtension = 'jpg' | 'png' | 'webp';

const MIME_EXTENSIONS: Record<string, AvatarExtension> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

class AvatarValidationError extends Error {}

function isMissingFile(value: FormDataEntryValue | null): value is null | string {
  return !value || typeof value === 'string';
}

function hasImageSignature(bytes: Buffer, extension: AvatarExtension) {
  if (extension === 'jpg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (extension === 'png') {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  return (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

async function resizeAvatarImage(buffer: Buffer, extension: AvatarExtension) {
  try {
    const sharp = (await import('sharp')).default;
    const image = sharp(buffer).rotate().resize(256, 256, {
      fit: 'cover',
      withoutEnlargement: true,
    });

    if (extension === 'jpg') {
      return await image.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
    }

    if (extension === 'png') {
      return await image.png({ compressionLevel: 9 }).toBuffer();
    }

    return await image.webp({ quality: 85 }).toBuffer();
  } catch {
    return buffer;
  }
}

async function prepareAvatarFile(file: File) {
  const extension = MIME_EXTENSIONS[file.type];

  if (!extension || file.size <= 0 || file.size > MAX_AVATAR_BYTES) {
    throw new AvatarValidationError(AVATAR_VALIDATION_MESSAGE);
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  if (!hasImageSignature(bytes, extension)) {
    throw new AvatarValidationError(AVATAR_VALIDATION_MESSAGE);
  }

  return {
    buffer: await resizeAvatarImage(bytes, extension),
    extension,
  };
}

function avatarObjectPath(profileImage: string | null | undefined) {
  if (!profileImage) return null;
  try {
    const url = new URL(profileImage);
    const marker = `/storage/v1/object/public/${encodeURIComponent(avatarBucket())}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    return url.pathname
      .slice(markerIndex + marker.length)
      .split('/')
      .map(decodeURIComponent)
      .join('/');
  } catch {
    return null;
  }
}

async function removeAvatarFile(profileImage: string | null | undefined) {
  const objectPath = avatarObjectPath(profileImage);
  if (!objectPath) return;
  await getObjectStorage().remove({ bucket: avatarBucket(), objectPaths: [objectPath] });
}

function revalidateProfileSurfaces() {
  revalidatePath('/admin/profile');
  revalidatePath('/admin/team');
  revalidatePath('/admin', 'layout');
}

export async function POST(request: Request) {
  let actor: Awaited<ReturnType<typeof requireAdmin>>;
  let newProfileImage: string | null = null;
  let newObjectPath: string | null = null;
  let previousProfileImage: string | null | undefined;
  let profileUpdated = false;

  try {
    actor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (isMissingFile(file)) {
      throw new AvatarValidationError(AVATAR_VALIDATION_MESSAGE);
    }

    const previous = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { profileImage: true },
    });

    if (!previous) {
      return NextResponse.json({ error: 'Your account no longer exists.' }, { status: 404 });
    }
    previousProfileImage = previous.profileImage;

    const { buffer, extension } = await prepareAvatarFile(file);
    newObjectPath = `avatars/${actor.id}/${Date.now()}-${randomUUID()}.${extension}`;
    await getObjectStorage().upload({
      bucket: avatarBucket(),
      objectPath: newObjectPath,
      data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer,
      mimeType: file.type,
    });
    newProfileImage = getObjectStorage().publicUrl({
      bucket: avatarBucket(),
      objectPath: newObjectPath,
    });

    const updated = await prisma.user.update({
      where: { id: actor.id },
      data: { profileImage: newProfileImage },
      select: { profileImage: true },
    });
    profileUpdated = true;

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.PROFILE_UPDATE,
      module: 'Profile',
      description: `${adminDisplayName(actor)} updated their profile picture.`,
      status: AuditStatus.SUCCESS,
      ...getRequestContext(request),
      previousValues: previous.profileImage ? { profileImage: previous.profileImage } : null,
      newValues: { profileImage: updated.profileImage },
      metadata: { targetUserId: actor.id },
    });

    // Storage cleanup is best-effort after the database mutation and its audit
    // record succeed. A transient delete failure must not break the new URL.
    await removeAvatarFile(previous.profileImage).catch(() => undefined);

    revalidateProfileSurfaces();

    return NextResponse.json({ profileImage: updated.profileImage });
  } catch (error) {
    if (profileUpdated && previousProfileImage !== undefined) {
      try {
        await prisma.user.update({
          where: { id: actor.id },
          data: { profileImage: previousProfileImage },
        });
        profileUpdated = false;
      } catch {
        // Keep the uploaded object when compensation fails so the current
        // database URL remains valid for recovery.
      }
    }

    if (newObjectPath && !profileUpdated) {
      await getObjectStorage().remove({
        bucket: avatarBucket(),
        objectPaths: [newObjectPath],
      }).catch(() => undefined);
    }

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.PROFILE_UPDATE,
      module: 'Profile',
      description: `${adminDisplayName(actor)} failed to update their profile picture.`,
      status: AuditStatus.FAILED,
      ...getRequestContext(request),
      metadata: {
        targetUserId: actor.id,
        ...errorMetadata(error),
      },
    });

    return NextResponse.json(
      {
        error: error instanceof AvatarValidationError
          ? error.message
          : 'Unable to update your profile picture.',
      },
      { status: error instanceof AvatarValidationError ? 400 : 500 },
    );
  }
}

export async function DELETE(request: Request) {
  let actor: Awaited<ReturnType<typeof requireAdmin>>;

  try {
    actor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const previous = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { profileImage: true },
    });

    if (!previous) {
      return NextResponse.json({ error: 'Your account no longer exists.' }, { status: 404 });
    }

    if (!previous.profileImage) {
      return NextResponse.json({ profileImage: null });
    }

    await prisma.user.update({
      where: { id: actor.id },
      data: { profileImage: null },
      select: { profileImage: true },
    });

    await removeAvatarFile(previous.profileImage);

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.PROFILE_UPDATE,
      module: 'Profile',
      description: `${adminDisplayName(actor)} removed their profile picture.`,
      status: AuditStatus.SUCCESS,
      ...getRequestContext(request),
      previousValues: { profileImage: previous.profileImage },
      newValues: { profileImage: null },
      metadata: { targetUserId: actor.id },
    });

    revalidateProfileSurfaces();

    return NextResponse.json({ profileImage: null });
  } catch (error) {
    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.PROFILE_UPDATE,
      module: 'Profile',
      description: `${adminDisplayName(actor)} failed to remove their profile picture.`,
      status: AuditStatus.FAILED,
      ...getRequestContext(request),
      metadata: {
        targetUserId: actor.id,
        ...errorMetadata(error),
      },
    });

    return NextResponse.json(
      { error: 'Unable to remove your profile picture.' },
      { status: 500 },
    );
  }
}
