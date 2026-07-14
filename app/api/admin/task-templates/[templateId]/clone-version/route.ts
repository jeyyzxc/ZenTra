import { requireSuperAdmin } from '@/lib/authorization';
import { cloneTaskTemplateVersion, handleTaskTemplateError } from '@/services/task-template';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { templateId } = await params;
    return Response.json({
      data: await cloneTaskTemplateVersion(decodeURIComponent(templateId), actor, request),
    }, { status: 201 });
  } catch (error) {
    return handleTaskTemplateError(error);
  }
}
