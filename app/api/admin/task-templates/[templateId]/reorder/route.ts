import { requireSuperAdmin } from '@/lib/authorization';
import { handleTaskTemplateError, reorderTaskTemplateItems } from '@/services/task-template';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { templateId } = await params;
    const body = await request.json() as { orderedItemIds?: unknown };
    return Response.json({
      data: await reorderTaskTemplateItems(
        decodeURIComponent(templateId),
        body.orderedItemIds,
        actor,
        request,
      ),
    });
  } catch (error) {
    return handleTaskTemplateError(error);
  }
}
