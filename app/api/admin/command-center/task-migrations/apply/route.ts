import { requireSuperAdmin } from '@/lib/authorization';
import {
  applyTaskTemplateMigration,
  handleTaskTemplateMigrationError,
} from '@/services/task-template/task-template-migration.service';

export async function POST(request: Request) {
  try {
    const actor = await requireSuperAdmin();
    const body = await request.json() as Record<string, unknown>;
    return Response.json({ success: true, data: await applyTaskTemplateMigration(body, actor, request) });
  } catch (error) {
    return handleTaskTemplateMigrationError(error);
  }
}
