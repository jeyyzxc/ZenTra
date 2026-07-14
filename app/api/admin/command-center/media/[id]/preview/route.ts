import { requireSuperAdmin } from '@/lib/authorization';
import { getMediaPreview, handleCommandCenterError } from '@/services/command-center';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    return Response.json({ success: true, data: await getMediaPreview(id) });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

