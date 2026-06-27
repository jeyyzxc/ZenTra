import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authorization';
import { EmailLogQueryError, getEmailLogPage } from '@/lib/email-log-query';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  let actor: Awaited<ReturnType<typeof requireAdmin>>;

  try {
    actor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const searchParams = new URL(request.url).searchParams;
    const result = await getEmailLogPage(searchParams, actor);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof EmailLogQueryError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Unable to load email logs.' }, { status: 500 });
  }
}
