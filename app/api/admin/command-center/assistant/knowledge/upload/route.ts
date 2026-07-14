import { randomUUID } from 'node:crypto';
import { requireSuperAdmin } from '@/lib/authorization';
import { getObjectStorage } from '@/lib/object-storage';
import { CommandCenterError, handleCommandCenterError, uploadCommandCenterMedia } from '@/services/command-center';
import { createKnowledgeDocument, extractKnowledgeFile } from '@/services/smart-assistant';

export const runtime = 'nodejs';
export const maxDuration = 300;

const PDF = 'application/pdf';
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

function documentsBucket() {
  const value = process.env.SUPABASE_ASSISTANT_DOCUMENTS_BUCKET?.trim();
  if (!value) throw new CommandCenterError('SUPABASE_ASSISTANT_DOCUMENTS_BUCKET is not configured.', 503);
  return value;
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function documentType(mimeType: string) {
  if (mimeType === PDF) return 'PDF' as const;
  if (mimeType === DOCX) return 'DOCX' as const;
  throw new CommandCenterError('Assistant sources must be PDF or DOCX documents.', 422);
}

function validateUploadMetadata(input: { fileName: string; mimeType: string; byteSize: number }) {
  documentType(input.mimeType);
  if (!input.fileName || input.fileName.length > 255 || /[\x00-\x1f\\]/.test(input.fileName)) {
    throw new CommandCenterError('Upload filename is invalid.', 422);
  }
  if (!Number.isInteger(input.byteSize) || input.byteSize < 1 || input.byteSize > MAX_DOCUMENT_BYTES) {
    throw new CommandCenterError('Document must be smaller than 25 MB.', 422);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSuperAdmin();
    const body = await request.json() as Record<string, unknown>;
    const action = text(body.action);
    const fileName = text(body.fileName);
    const mimeType = text(body.mimeType);
    const byteSize = Number(body.byteSize);
    validateUploadMetadata({ fileName, mimeType, byteSize });

    if (action === 'prepare') {
      const extension = mimeType === PDF ? 'pdf' : 'docx';
      const objectPath = `incoming/${actor.id}/${randomUUID()}.${extension}`;
      const uploadUrl = await getObjectStorage().createSignedUploadUrl({
        bucket: documentsBucket(),
        objectPath,
      });
      return Response.json({
        success: true,
        data: { uploadUrl, objectPath, expiresInSeconds: 7_200 },
      });
    }

    if (action !== 'finalize') throw new CommandCenterError('Upload action is invalid.', 400);
    const objectPath = text(body.objectPath);
    if (!objectPath.startsWith(`incoming/${actor.id}/`) || objectPath.includes('..')) {
      throw new CommandCenterError('Upload reference is invalid.', 400);
    }

    try {
      const bytes = await getObjectStorage().download({
        bucket: documentsBucket(),
        objectPath,
      });
      if (bytes.byteLength !== byteSize) throw new CommandCenterError('Uploaded document size does not match its request.', 422);
      const file = new File([bytes], fileName, { type: mimeType });
      // This step validates signature and runs the mandatory production malware
      // scanner before the document is extracted or registered as knowledge.
      const media = await uploadCommandCenterMedia({ file, purpose: 'assistant', actor, request });
      const extractedText = await extractKnowledgeFile(file);
      const document = await createKnowledgeDocument({
        title: text(body.title) || fileName.replace(/\.[^.]+$/, ''),
        slug: body.slug,
        type: documentType(mimeType),
        accessLevel: body.accessLevel || 'PUBLIC',
        extractedText,
        sourceObjectPath: `mediaAsset:${media.id}`,
        changeSummary: body.changeSummary || `Extracted from ${fileName}.`,
      }, actor, request);
      return Response.json({ success: true, data: { document, media } }, { status: 201 });
    } finally {
      await getObjectStorage().remove({
        bucket: documentsBucket(),
        objectPaths: [objectPath],
      }).catch(() => undefined);
    }
  } catch (error) {
    return handleCommandCenterError(error);
  }
}
