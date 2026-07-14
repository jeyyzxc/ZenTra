import { requireSuperAdmin } from '@/lib/authorization';
import {
  deleteTaskTemplateItem,
  handleTaskTemplateError,
  updateTaskTemplateItem,
} from '@/services/task-template';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { itemId } = await params;
    const body = await request.json();
    return Response.json({
      data: await updateTaskTemplateItem(decodeURIComponent(itemId), body, actor, request),
    });
  } catch (error) {
    return handleTaskTemplateError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { itemId } = await params;
    return Response.json({
      data: await deleteTaskTemplateItem(decodeURIComponent(itemId), actor, request),
    });
  } catch (error) {
    return handleTaskTemplateError(error);
  }
}
