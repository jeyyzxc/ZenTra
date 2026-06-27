import {
  getPublicPackageBySlug,
  handleServicesError,
} from '@/lib/services-packages';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    return Response.json({ data: await getPublicPackageBySlug(decodeURIComponent(slug)) });
  } catch (error) {
    return handleServicesError(error);
  }
}
