import { getPublicFaqs, supportErrorResponse } from '@/lib/support-center-service';
import { requireClientFeature, settingsErrorResponse } from '@/lib/system-settings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireClientFeature('faq');
    return Response.json(await getPublicFaqs(new URL(request.url), request));
  } catch (error) {
    if (error instanceof Error && error.name === 'ClientFeatureDisabledError') {
      return settingsErrorResponse(error, 'Unable to load client FAQs.');
    }

    return supportErrorResponse(error, 'Unable to load client FAQs.');
  }
}
