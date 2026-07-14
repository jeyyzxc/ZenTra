import { ContentType } from '@prisma/client';
import { requireAdmin, requireSuperAdmin } from '@/lib/authorization';
import {
  createContentItem,
  handleCommandCenterError,
  listContentItems,
  parseContentType,
} from '@/services/command-center';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin();
    const value = new URL(request.url).searchParams.get('type');
    const type = value ? parseContentType(value) : undefined;
    return Response.json({
      success: true,
      data: await listContentItems(type as ContentType | undefined, actor.role === 'SUPERADMIN'),
    });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSuperAdmin();
    const body = await request.json() as Record<string, unknown>;
    return Response.json({
      success: true,
      data: await createContentItem(body, actor, request),
    }, { status: 201 });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}
