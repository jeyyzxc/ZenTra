import {
  getPublicEventCategories,
  handleServicesError,
} from '@/lib/services-packages';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json({ data: await getPublicEventCategories() });
  } catch (error) {
    return handleServicesError(error);
  }
}
