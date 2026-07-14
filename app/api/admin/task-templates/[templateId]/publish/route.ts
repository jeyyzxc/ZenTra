import { requireSuperAdmin } from '@/lib/authorization';
import { handleTaskTemplateError, publishTaskTemplate } from '@/services/task-template';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { templateId } = await params;
    return Response.json({
      data: await publishTaskTemplate(decodeURIComponent(templateId), actor, request),
    });
  } catch (error) {
    return handleTaskTemplateError(error);
  }
}
