import { requireSuperAdmin } from '@/lib/authorization';
import {
  handleTaskTemplateMigrationError,
  previewTaskTemplateMigration,
} from '@/services/task-template/task-template-migration.service';

export async function POST(request: Request) {
  try {
    const actor = await requireSuperAdmin();
    const body = await request.json() as { targetTemplateId?: unknown; bookingIds?: unknown };
    return Response.json({ success: true, data: await previewTaskTemplateMigration(body, actor, request) });
  } catch (error) {
    return handleTaskTemplateMigrationError(error);
  }
}
