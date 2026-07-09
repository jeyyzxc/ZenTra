import {
  getPublicPackagesForCategory,
  handleServicesError,
} from '@/lib/services-packages';
import { requireClientFeature, settingsErrorResponse } from '@/lib/system-settings';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await requireClientFeature('packages');
    const { slug } = await params;
    return Response.json({ data: await getPublicPackagesForCategory(decodeURIComponent(slug)) });
  } catch (error) {
    if (error instanceof Error && error.name === 'ClientFeatureDisabledError') {
      return settingsErrorResponse(error, 'Unable to load packages.');
    }

    return handleServicesError(error);
  }
}
