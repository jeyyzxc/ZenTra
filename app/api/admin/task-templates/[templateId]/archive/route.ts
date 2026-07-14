import { requireSuperAdmin } from '@/lib/authorization';
import { archiveTaskTemplate, handleTaskTemplateError } from '@/services/task-template';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { templateId } = await params;
    return Response.json({
      data: await archiveTaskTemplate(decodeURIComponent(templateId), actor, request),
    });
  } catch (error) {
    return handleTaskTemplateError(error);
  }
}
