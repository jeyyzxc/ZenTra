import { requireSuperAdmin } from '@/lib/authorization';
import { cancelCommandCenterJob, handleCommandCenterError } from '@/services/command-center';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    return Response.json({ success: true, data: await cancelCommandCenterJob(id) });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

