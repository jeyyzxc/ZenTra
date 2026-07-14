import { requireAdmin, requireSuperAdmin } from '@/lib/authorization';
import {
  getTaskTemplate,
  handleTaskTemplateError,
  updateTaskTemplate,
} from '@/services/task-template';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  try {
    await requireAdmin();
    const { templateId } = await params;
    return Response.json({ data: await getTaskTemplate(decodeURIComponent(templateId)) });
  } catch (error) {
    return handleTaskTemplateError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { templateId } = await params;
    const body = await request.json();
    return Response.json({
      data: await updateTaskTemplate(decodeURIComponent(templateId), body, actor, request),
    });
  } catch (error) {
    return handleTaskTemplateError(error);
  }
}
