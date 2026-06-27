import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CLIENT_CATEGORY_PACKAGES_PATTERN = /^\/api\/client\/event-categories\/([^/]+)\/packages$/;

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(CLIENT_CATEGORY_PACKAGES_PATTERN);

  if (!match) {
    return NextResponse.next();
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = '/api/client/packages';
  rewriteUrl.searchParams.set('categorySlug', match[1]);

  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: '/api/client/event-categories/:slug/packages',
};
