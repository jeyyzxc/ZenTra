import { requireAdmin } from '@/lib/authorization';
import { getCommandCenterOverview, handleCommandCenterError } from '@/services/command-center';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const actor = await requireAdmin();
    return Response.json({
      success: true,
      data: await getCommandCenterOverview(),
      permissions: {
        canMutate: actor.role === 'SUPERADMIN',
        canPreviewDrafts: actor.role === 'SUPERADMIN',
        canTestAssistant: true,
      },
    });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

