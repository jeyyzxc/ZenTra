import { NotificationType, Prisma, Role } from '@prisma/client';
import { requireAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { testimonyErrorResponse } from '@/lib/testimony-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin();
    const type = new URL(request.url).searchParams.get('type')?.toUpperCase();
    const where: Prisma.NotificationWhereInput = actor.role === Role.SUPERADMIN
      ? {}
      : {
          OR: [
            { createdFor: null },
            { createdFor: actor.id },
            { createdFor: actor.username },
          ],
        };

    if (type && Object.values(NotificationType).includes(type as NotificationType)) {
      where.type = type as NotificationType;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });

    return Response.json({
      notifications: notifications.map((notification) => ({
        id: notification.id,
        testimonyId: notification.relatedRecordId,
        notificationType: notification.type.toLowerCase(),
        priority: notification.priority.toLowerCase(),
        message: notification.message,
        isRead: notification.isRead,
        createdFor: notification.createdFor,
        createdAt: notification.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return testimonyErrorResponse(error, 'Unable to load admin notifications.');
  }
}
