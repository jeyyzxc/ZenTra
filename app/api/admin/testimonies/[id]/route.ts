import { requireAdmin } from '@/lib/authorization';
import {
  getAdminTestimony,
  moderateTestimony,
  testimonyErrorResponse,
} from '@/lib/testimony-service';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    return Response.json({ testimony: await getAdminTestimony(decodeURIComponent(id)) });
  } catch (error) {
    return testimonyErrorResponse(error, 'Unable to load testimony details.');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    return Response.json({
      testimony: await moderateTestimony(decodeURIComponent(id), 'delete', actor, request),
      message: 'Testimony soft deleted successfully.',
    });
  } catch (error) {
    return testimonyErrorResponse(error, 'Unable to delete testimony.');
  }
}
