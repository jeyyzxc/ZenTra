import { supportErrorResponse } from '@/lib/support-center-service';
import { requireClientFeature, settingsErrorResponse } from '@/lib/system-settings';
import { askGroundedAssistant } from '@/services/smart-assistant';
import { RateLimitError } from '@/services/rate-limit.service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await requireClientFeature('assistant');
    return Response.json(await askGroundedAssistant(request), {
      headers: { 'cache-control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ClientFeatureDisabledError') {
      return settingsErrorResponse(error, 'Unable to answer assistant question.');
    }

    if (error instanceof RateLimitError) {
      return Response.json({ error: error.message }, {
        status: 429,
        headers: { 'retry-after': String(error.retryAfterSeconds), 'cache-control': 'no-store' },
      });
    }
    return supportErrorResponse(error, 'Unable to answer assistant question.');
  }
}
