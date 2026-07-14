import { handleCommandCenterError, listPublishedContent, parseContentType } from '@/services/command-center';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await params;
    const contentType = parseContentType(decodeURIComponent(type));
    return Response.json({ success: true, data: await listPublishedContent(contentType) });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

