import {
  getPublicEventCategories,
  handleServicesError,
} from '@/lib/services-packages';
import { requireClientFeature, settingsErrorResponse } from '@/lib/system-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireClientFeature('packages');
    return Response.json({ data: await getPublicEventCategories() });
  } catch (error) {
    if (error instanceof Error && error.name === 'ClientFeatureDisabledError') {
      return settingsErrorResponse(error, 'Unable to load event categories.');
    }

    return handleServicesError(error);
  }
}
