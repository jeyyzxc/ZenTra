import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { AuditAction, AuditStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { auditActor, createAuditLog, errorMetadata, getRequestContext } from '@/lib/audit';
import { requireAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const AVATAR_PUBLIC_PATH = '/uploads/avatars';
const AVATAR_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_VALIDATION_MESSAGE = 'File must be a JPEG, PNG, or WebP image under 2 MB.';

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

function avatarPathToDiskPath(profileImage: string | null | undefined) {
  if (!profileImage?.startsWith(`${AVATAR_PUBLIC_PATH}/`)) {
    return null;
  }

  const fileName = path.posix.basename(profileImage);

  if (!fileName || fileName === '.' || fileName === '..') {
    return null;
  }

  return path.join(AVATAR_UPLOAD_DIR, fileName);
}

async function removeAvatarFile(profileImage: string | null | undefined) {
  const diskPath = avatarPathToDiskPath(profileImage);

  if (!diskPath) {
    return;
  }

  try {
    await unlink(diskPath);
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return;
    }

    throw error;
  }
}

function revalidateProfileSurfaces() {
  revalidatePath('/admin/profile');
  revalidatePath('/admin', 'layout');
}

export async function POST(request: Request) {
  let actor: Awaited<ReturnType<typeof requireAdmin>>;
  let newProfileImage: string | null = null;

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

    const { buffer, extension } = await prepareAvatarFile(file);
    const fileName = `${actor.id}-${Date.now()}.${extension}`;
    const diskPath = path.join(AVATAR_UPLOAD_DIR, fileName);
    newProfileImage = `${AVATAR_PUBLIC_PATH}/${fileName}`;

    await mkdir(AVATAR_UPLOAD_DIR, { recursive: true });
    await writeFile(diskPath, buffer);

    const updated = await prisma.user.update({
      where: { id: actor.id },
      data: { profileImage: newProfileImage },
      select: { profileImage: true },
    });

    await removeAvatarFile(previous.profileImage);

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.PROFILE_UPDATE,
      module: 'Profile',
      description: `${actor.username} updated their profile picture.`,
      status: AuditStatus.SUCCESS,
      ...getRequestContext(request),
      previousValues: previous.profileImage ? { profileImage: previous.profileImage } : null,
      newValues: { profileImage: updated.profileImage },
      metadata: { targetUserId: actor.id },
    });

    revalidateProfileSurfaces();

    return NextResponse.json({ profileImage: updated.profileImage });
  } catch (error) {
    if (newProfileImage) {
      await removeAvatarFile(newProfileImage).catch(() => undefined);
    }

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.PROFILE_UPDATE,
      module: 'Profile',
      description: `${actor.username} failed to update their profile picture.`,
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
      description: `${actor.username} removed their profile picture.`,
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
      description: `${actor.username} failed to remove their profile picture.`,
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
