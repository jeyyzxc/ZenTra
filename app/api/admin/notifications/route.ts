import { NotificationType, Prisma, Role } from '@prisma/client';
import { requireAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { getEnabledNotificationTypes } from '@/lib/system-settings';
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

    const enabledTypes = await getEnabledNotificationTypes();
    if (enabledTypes.length === 0) {
      return Response.json({ notifications: [] });
    }

    if (type && Object.values(NotificationType).includes(type as NotificationType)) {
      if (!enabledTypes.includes(type as NotificationType)) {
        return Response.json({ notifications: [] });
      }

      where.type = type as NotificationType;
    } else {
      where.type = { in: enabledTypes };
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
