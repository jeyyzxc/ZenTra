import { getPublicPopularFaqs, supportErrorResponse } from '@/lib/support-center-service';
import { requireClientFeature, settingsErrorResponse } from '@/lib/system-settings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireClientFeature('faq');
    const limit = Number(new URL(request.url).searchParams.get('limit')) || 6;
    return Response.json(await getPublicPopularFaqs(limit));
  } catch (error) {
    if (error instanceof Error && error.name === 'ClientFeatureDisabledError') {
      return settingsErrorResponse(error, 'Unable to load popular FAQs.');
    }

    return supportErrorResponse(error, 'Unable to load popular FAQs.');
  }
}
