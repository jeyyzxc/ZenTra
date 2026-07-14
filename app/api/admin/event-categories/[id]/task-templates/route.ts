import { requireAdmin } from '@/lib/authorization';
import { handleTaskTemplateError, listCategoryTaskTemplates } from '@/services/task-template';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    return Response.json({
      data: await listCategoryTaskTemplates(decodeURIComponent(id)),
    });
  } catch (error) {
    return handleTaskTemplateError(error);
  }
}
