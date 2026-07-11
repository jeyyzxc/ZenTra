import {
  getPublicPackagesForCategory,
  handleServicesError,
} from '@/lib/services-packages';
import { requireClientFeature, settingsErrorResponse } from '@/lib/system-settings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireClientFeature('packages');
    const url = new URL(request.url);
    const categorySlug = (
      url.searchParams.get('categorySlug') ??
      url.searchParams.get('slug')
    )?.trim();

    if (!categorySlug) {
      return Response.json({
        error: 'categorySlug is required.',
      }, { status: 400 });
    }

    return Response.json({
      data: await getPublicPackagesForCategory(decodeURIComponent(categorySlug)),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ClientFeatureDisabledError') {
      return settingsErrorResponse(error, 'Unable to load packages.');
    }

    return handleServicesError(error);
  }
}
