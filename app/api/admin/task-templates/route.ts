import { requireAdmin } from '@/lib/authorization';
import {
  handleTaskTemplateError,
  listDefaultTaskTemplates,
} from '@/services/task-template';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ data: await listDefaultTaskTemplates() });
  } catch (error) {
    return handleTaskTemplateError(error);
  }
}
