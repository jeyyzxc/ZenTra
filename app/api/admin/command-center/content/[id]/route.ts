import { requireAdmin } from '@/lib/authorization';
import { getContentItem, handleCommandCenterError } from '@/services/command-center';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    return Response.json({
      success: true,
      data: await getContentItem(decodeURIComponent(id), actor.role === 'SUPERADMIN'),
    });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}
