import {
  inquiryErrorResponse,
  submitInquiry,
} from '@/lib/inquiry-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    return Response.json(await submitInquiry(request), { status: 201 });
  } catch (error) {
    return inquiryErrorResponse(error, 'Unable to submit your inquiry.');
  }
}
