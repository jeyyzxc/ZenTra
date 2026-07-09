import { askClientAssistant, supportErrorResponse } from '@/lib/support-center-service';
import { requireClientFeature, settingsErrorResponse } from '@/lib/system-settings';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await requireClientFeature('assistant');
    return Response.json(await askClientAssistant(request));
  } catch (error) {
    if (error instanceof Error && error.name === 'ClientFeatureDisabledError') {
      return settingsErrorResponse(error, 'Unable to answer assistant question.');
    }

    return supportErrorResponse(error, 'Unable to answer assistant question.');
  }
}
