import { getPublicFaqs, supportErrorResponse } from '@/lib/support-center-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    return Response.json(await getPublicFaqs(new URL(request.url), request));
  } catch (error) {
    return supportErrorResponse(error, 'Unable to load client FAQs.');
  }
}
