import {
  getPublicPackagesForCategory,
  handleServicesError,
} from '@/lib/services-packages';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
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
    return handleServicesError(error);
  }
}
