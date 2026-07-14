import { AuditAction, AuditStatus, MediaAssetStatus } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { auditActor, createAuditLog, getRequestContext } from '@/lib/audit';
import type { CurrentAdmin } from '@/lib/authorization';
import { getObjectStorage } from '@/lib/object-storage';
import { prisma } from '@/lib/prisma';
import { CommandCenterError } from './content.service';

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

function bucket(name: 'draft' | 'documents' | 'public') {
  const variable = name === 'draft' ? 'SUPABASE_COMMAND_CENTER_DRAFTS_BUCKET' : name === 'documents' ? 'SUPABASE_ASSISTANT_DOCUMENTS_BUCKET' : 'SUPABASE_PUBLIC_CONTENT_BUCKET';
  const value = process.env[variable]?.trim();
  if (!value) throw new CommandCenterError(`${variable} is not configured.`, 503);
  return value;
}

function extension(mimeType: string) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'docx';
}

function signatureMatches(bytes: Uint8Array, mimeType: string) {
  if (mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === 'image/png') return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (mimeType === 'image/webp') return new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
  if (mimeType === 'application/pdf') return new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  return false;
}

function pngDimensions(bytes: Uint8Array) {
  if (bytes.length < 24) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function jpegDimensions(bytes: Uint8Array) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: (bytes[offset + 5] << 8) + bytes[offset + 6], width: (bytes[offset + 7] << 8) + bytes[offset + 8] };
    }
    if (length < 2) break;
    offset += length + 2;
  }
  return null;
}

function webpDimensions(bytes: Uint8Array) {
  if (bytes.length < 30) return null;
  const format = new TextDecoder().decode(bytes.slice(12, 16));
  if (format === 'VP8X') {
    const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
    const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    return { width, height };
  }
  return null;
}

function imageDimensions(bytes: Uint8Array, mimeType: string) {
  if (mimeType === 'image/png') return pngDimensions(bytes);
  if (mimeType === 'image/jpeg') return jpegDimensions(bytes);
  if (mimeType === 'image/webp') return webpDimensions(bytes);
  return null;
}

async function scanDocument(file: File) {
  if (!DOCUMENT_MIME_TYPES.has(file.type)) return { scanned: false, warning: null };
  const scannerUrl = process.env.DOCUMENT_MALWARE_SCANNER_URL?.trim();
  if (!scannerUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new CommandCenterError('Production document malware scanning is not configured.', 503);
    }
    return { scanned: false, warning: 'Development validation-only mode: malware scanning is not configured.' };
  }
  const response = await fetch(scannerUrl, {
    method: 'POST',
    headers: process.env.DOCUMENT_MALWARE_SCANNER_SECRET ? { authorization: `Bearer ${process.env.DOCUMENT_MALWARE_SCANNER_SECRET}` } : undefined,
    body: file,
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({})) as { clean?: boolean };
  if (!response.ok || payload.clean !== true) throw new CommandCenterError('The uploaded document did not pass malware scanning.', 422);
  return { scanned: true, warning: null };
}

export async function uploadCommandCenterMedia(input: {
  file: File;
  purpose: 'content' | 'assistant';
  actor: CurrentAdmin;
  request: Request;
}) {
  const isImage = IMAGE_MIME_TYPES.has(input.file.type);
  const isDocument = DOCUMENT_MIME_TYPES.has(input.file.type);
  if (input.purpose === 'content' && !isImage) throw new CommandCenterError('Public content uploads must be JPEG, PNG, or WebP images.', 422);
  if (input.purpose === 'assistant' && !isDocument) throw new CommandCenterError('Assistant sources must be PDF or DOCX documents.', 422);
  const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
  if (input.file.size < 1 || input.file.size > maxBytes) throw new CommandCenterError(`Upload must be smaller than ${Math.floor(maxBytes / 1024 / 1024)} MB.`, 422);
  if (input.file.name.length > 255 || /[\x00-\x1f\\]/.test(input.file.name)) throw new CommandCenterError('Upload filename is invalid.', 422);
  const data = await input.file.arrayBuffer();
  const bytes = new Uint8Array(data);
  if (!signatureMatches(bytes, input.file.type)) throw new CommandCenterError('File signature does not match its declared MIME type.', 422);
  const dimensions = isImage ? imageDimensions(bytes, input.file.type) : null;
  if (isImage && (!dimensions || dimensions.width < 320 || dimensions.height < 240 || dimensions.width > 12_000 || dimensions.height > 12_000)) {
    throw new CommandCenterError('Image dimensions must be between 320×240 and 12000×12000 pixels.', 422);
  }
  const scan = await scanDocument(input.file);
  const checksum = createHash('sha256').update(bytes).digest('hex');
  const targetBucket = input.purpose === 'content' ? bucket('draft') : bucket('documents');
  const objectPath = `${input.purpose}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension(input.file.type)}`;
  await getObjectStorage().upload({ bucket: targetBucket, objectPath, data, mimeType: input.file.type });
  const asset = await prisma.mediaAsset.create({
    data: {
      bucket: targetBucket,
      objectPath,
      checksum,
      mimeType: input.file.type,
      originalFilename: input.file.name.replace(/[^a-zA-Z0-9._ -]/g, '_'),
      byteSize: input.file.size,
      width: dimensions?.width,
      height: dimensions?.height,
      status: MediaAssetStatus.DRAFT,
      createdBy: input.actor.id,
    },
  });
  await createAuditLog({
    ...auditActor(input.actor),
    ...getRequestContext(input.request),
    action: AuditAction.FILE_UPLOAD,
    module: 'ZENTRA Command Center',
    description: `Uploaded a validated ${input.purpose} asset.`,
    status: AuditStatus.SUCCESS,
    metadata: { event: 'COMMAND_CENTER_MEDIA_UPLOADED', mediaAssetId: asset.id, purpose: input.purpose, checksum, malwareScanned: scan.scanned },
  });
  return {
    id: asset.id,
    mimeType: asset.mimeType,
    byteSize: asset.byteSize,
    width: asset.width,
    height: asset.height,
    checksum: asset.checksum,
    previewUrl: await getObjectStorage().createSignedUrl({ bucket: asset.bucket, objectPath: asset.objectPath }),
    warning: scan.warning,
  };
}

export async function promoteMediaAsset(mediaAssetId: string) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: mediaAssetId } });
  if (!asset) throw new CommandCenterError('Media asset not found.', 404);
  if (asset.status === MediaAssetStatus.PUBLISHED && asset.publicUrl) return asset;
  if (asset.status !== MediaAssetStatus.DRAFT || !IMAGE_MIME_TYPES.has(asset.mimeType)) {
    throw new CommandCenterError('Only validated draft images can be published.', 409);
  }
  const destinationBucket = bucket('public');
  const destinationPath = `immutable/${asset.checksum.slice(0, 2)}/${asset.checksum}.${extension(asset.mimeType)}`;
  try {
    await getObjectStorage().copy({
      sourceBucket: asset.bucket,
      sourcePath: asset.objectPath,
      destinationBucket,
      destinationPath,
    });
  } catch (error) {
    const existing = await prisma.mediaAsset.findFirst({
      where: { bucket: destinationBucket, objectPath: destinationPath, status: MediaAssetStatus.PUBLISHED },
    });
    if (!existing) throw error;
    return existing;
  }
  const publicUrl = getObjectStorage().publicUrl({ bucket: destinationBucket, objectPath: destinationPath });
  return prisma.mediaAsset.update({
    where: { id: asset.id },
    data: {
      bucket: destinationBucket,
      objectPath: destinationPath,
      publicUrl,
      status: MediaAssetStatus.PUBLISHED,
    },
  });
}

export async function getMediaPreview(mediaAssetId: string) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: mediaAssetId } });
  if (!asset || asset.status === MediaAssetStatus.DELETED) throw new CommandCenterError('Media asset not found.', 404);
  if (asset.status === MediaAssetStatus.PUBLISHED && asset.publicUrl) return { url: asset.publicUrl, expiresAt: null };
  return {
    url: await getObjectStorage().createSignedUrl({ bucket: asset.bucket, objectPath: asset.objectPath }),
    expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
  };
}

