import { requireAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { testimonyErrorResponse } from '@/lib/testimony-service';

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.notification.update({
      where: { id: decodeURIComponent(id) },
      data: { isRead: true },
    });
    return Response.json({ success: true });
  } catch (error) {
    return testimonyErrorResponse(error, 'Unable to mark notification as read.');
  }
}
