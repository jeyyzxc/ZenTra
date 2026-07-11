import { getPublicFaqCategories, supportErrorResponse } from '@/lib/support-center-service';
import { requireClientFeature, settingsErrorResponse } from '@/lib/system-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireClientFeature('faq');
    return Response.json(await getPublicFaqCategories());
  } catch (error) {
    if (error instanceof Error && error.name === 'ClientFeatureDisabledError') {
      return settingsErrorResponse(error, 'Unable to load FAQ categories.');
    }

    return supportErrorResponse(error, 'Unable to load FAQ categories.');
  }
}
