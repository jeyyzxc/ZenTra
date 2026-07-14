import { requireSuperAdmin } from '@/lib/authorization';
import { addTaskTemplateItem, handleTaskTemplateError } from '@/services/task-template';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { templateId } = await params;
    const body = await request.json();
    return Response.json({
      data: await addTaskTemplateItem(decodeURIComponent(templateId), body, actor, request),
    }, { status: 201 });
  } catch (error) {
    return handleTaskTemplateError(error);
  }
}
