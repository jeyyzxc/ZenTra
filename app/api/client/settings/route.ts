import { getPublicSystemSettings, settingsErrorResponse } from '@/lib/system-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json({ settings: await getPublicSystemSettings() });
  } catch (error) {
    return settingsErrorResponse(error, 'Unable to load public settings.');
  }
}
