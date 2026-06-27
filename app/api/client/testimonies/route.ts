import {
  getPublicTestimonies,
  submitTestimony,
  testimonyErrorResponse,
} from '@/lib/testimony-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    return Response.json(await getPublicTestimonies(new URL(request.url)));
  } catch (error) {
    return testimonyErrorResponse(error, 'Unable to load testimonies.');
  }
}

export async function POST(request: Request) {
  try {
    return Response.json(await submitTestimony(request), { status: 201 });
  } catch (error) {
    return testimonyErrorResponse(error, 'Unable to submit testimony.');
  }
}
