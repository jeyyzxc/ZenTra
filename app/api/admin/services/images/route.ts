import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { AuditAction, AuditStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auditActor, createAuditLog, errorMetadata, getRequestContext } from '@/lib/audit';
import { requireSuperAdmin } from '@/lib/authorization';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SERVICES_IMAGE_PUBLIC_PATH = '/uploads/services-packages';
const SERVICES_IMAGE_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'services-packages');
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_VALIDATION_MESSAGE = 'Image must be a JPG, PNG, or WebP file under 5 MB.';

type ImageExtension = 'jpg' | 'png' | 'webp';
type ImageTargetType = 'category' | 'package';

const MIME_EXTENSIONS: Record<string, ImageExtension> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

class ServicesImageValidationError extends Error {
  status: number;

  constructor(message = IMAGE_VALIDATION_MESSAGE, status = 400) {
    super(message);
    this.name = 'ServicesImageValidationError';
    this.status = status;
  }
}

function isMissingFile(value: FormDataEntryValue | null): value is null | string {
  return !value || typeof value === 'string';
}

function cleanSegment(value: string) {
  return value
    .trim()
    .replace(/\.[^.]+$/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'services-image';
}

function parseTargetType(value: FormDataEntryValue | null): ImageTargetType {
  if (value === 'category' || value === 'package') {
    return value;
  }

  throw new ServicesImageValidationError('Image target must be category or package.');
}

function hasImageSignature(bytes: Buffer, extension: ImageExtension) {
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

async function prepareImageFile(file: File) {
  const extension = MIME_EXTENSIONS[file.type];

  if (!extension || file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new ServicesImageValidationError();
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!hasImageSignature(buffer, extension)) {
    throw new ServicesImageValidationError();
  }

  return { buffer, extension };
}

export async function POST(request: Request) {
  let actor: Awaited<ReturnType<typeof requireSuperAdmin>>;

  try {
    actor = await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const targetType = parseTargetType(formData.get('targetType'));

    if (isMissingFile(file)) {
      throw new ServicesImageValidationError();
    }

    const { buffer, extension } = await prepareImageFile(file);
    const fileName = `${Date.now()}-${randomUUID()}-${cleanSegment(file.name)}.${extension}`;
    const diskDirectory = path.join(SERVICES_IMAGE_UPLOAD_DIR, targetType);
    const diskPath = path.join(diskDirectory, fileName);
    const publicUrl = `${SERVICES_IMAGE_PUBLIC_PATH}/${targetType}/${fileName}`;

    await mkdir(diskDirectory, { recursive: true });
    await writeFile(diskPath, buffer);

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.FILE_UPLOAD,
      module: 'Services',
      description: `${actor.username} uploaded a ${targetType} image for services and packages.`,
      status: AuditStatus.SUCCESS,
      ...getRequestContext(request),
      newValues: { publicUrl, targetType, fileType: file.type, fileSize: file.size },
    });

    return NextResponse.json({
      data: {
        publicUrl,
        fileName,
        fileType: file.type,
        fileSize: file.size,
      },
    }, { status: 201 });
  } catch (error) {
    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.FILE_UPLOAD,
      module: 'Services',
      description: `${actor.username} failed to upload a services and packages image.`,
      status: AuditStatus.FAILED,
      ...getRequestContext(request),
      metadata: errorMetadata(error),
    });

    if (error instanceof ServicesImageValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Unable to upload image.' }, { status: 500 });
  }
}
