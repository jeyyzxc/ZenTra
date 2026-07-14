import { randomUUID } from 'node:crypto';
import { requireSuperAdmin } from '@/lib/authorization';
import { getObjectStorage } from '@/lib/object-storage';
import { CommandCenterError, handleCommandCenterError, uploadCommandCenterMedia } from '@/services/command-center';

export const runtime = 'nodejs';
export const maxDuration = 300;

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function targetBucket(purpose: 'content' | 'assistant') {
  const value = purpose === 'content'
    ? process.env.SUPABASE_COMMAND_CENTER_DRAFTS_BUCKET
    : process.env.SUPABASE_ASSISTANT_DOCUMENTS_BUCKET;
  if (!value?.trim()) throw new CommandCenterError('The private upload bucket is not configured.', 503);
  return value.trim();
}

function metadata(body: Record<string, unknown>) {
  const purpose = body.purpose === 'assistant' ? 'assistant' as const : 'content' as const;
  const fileName = text(body.fileName);
  const mimeType = text(body.mimeType);
  const byteSize = Number(body.byteSize);
  const allowed = purpose === 'content' ? IMAGE_TYPES : DOCUMENT_TYPES;
  const maximum = purpose === 'content' ? 15 * 1024 * 1024 : 25 * 1024 * 1024;
  if (!allowed.has(mimeType)) throw new CommandCenterError('Upload type is not allowed for this purpose.', 422);
  if (!Number.isInteger(byteSize) || byteSize < 1 || byteSize > maximum) throw new CommandCenterError('Upload size is invalid.', 422);
  if (!fileName || fileName.length > 255 || /[\x00-\x1f\\]/.test(fileName)) throw new CommandCenterError('Upload filename is invalid.', 422);
  return { purpose, fileName, mimeType, byteSize };
}

function extension(mimeType: string) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'docx';
}

export async function POST(request: Request) {
  try {
    const actor = await requireSuperAdmin();
    const body = await request.json() as Record<string, unknown>;
    const input = metadata(body);
    if (body.action === 'prepare') {
      const objectPath = `incoming/${actor.id}/${randomUUID()}.${extension(input.mimeType)}`;
      return Response.json({
        success: true,
        data: {
          objectPath,
          uploadUrl: await getObjectStorage().createSignedUploadUrl({
            bucket: targetBucket(input.purpose),
            objectPath,
          }),
          expiresInSeconds: 7_200,
        },
      });
    }
    if (body.action !== 'finalize') throw new CommandCenterError('Upload action is invalid.', 400);
    const objectPath = text(body.objectPath);
    if (!objectPath.startsWith(`incoming/${actor.id}/`) || objectPath.includes('..')) throw new CommandCenterError('Upload reference is invalid.', 400);
    try {
      const bytes = await getObjectStorage().download({ bucket: targetBucket(input.purpose), objectPath });
      if (bytes.byteLength !== input.byteSize) throw new CommandCenterError('Uploaded file size does not match its request.', 422);
      const file = new File([bytes], input.fileName, { type: input.mimeType });
      return Response.json({
        success: true,
        data: await uploadCommandCenterMedia({ file, purpose: input.purpose, actor, request }),
      }, { status: 201 });
    } finally {
      await getObjectStorage().remove({
        bucket: targetBucket(input.purpose),
        objectPaths: [objectPath],
      }).catch(() => undefined);
    }
  } catch (error) {
    return handleCommandCenterError(error);
  }
}
