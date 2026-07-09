import { requireAdmin } from '@/lib/authorization';
import {
  getSystemSettings,
  settingsErrorResponse,
  updateSystemSettings,
} from '@/lib/system-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return Response.json(await getSystemSettings());
  } catch (error) {
    return settingsErrorResponse(error, 'Unable to load settings.');
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    return Response.json(await updateSystemSettings(body, actor, request));
  } catch (error) {
    return settingsErrorResponse(error, 'Unable to update settings.');
  }
}
