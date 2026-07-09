import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { SessionAccessScope } from '@prisma/client';

const CLIENT_CATEGORY_PACKAGES_PATTERN = /^\/api\/client\/event-categories\/([^/]+)\/packages$/;

export async function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(CLIENT_CATEGORY_PACKAGES_PATTERN);

  if (match) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = '/api/client/packages';
    rewriteUrl.searchParams.set('categorySlug', match[1]);

    return NextResponse.rewrite(rewriteUrl);
  }

  if (
    request.nextUrl.pathname.startsWith('/admin/') &&
    request.nextUrl.pathname !== '/admin'
  ) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (
      token?.accessScope === SessionAccessScope.PASSWORD_CHANGE_ONLY ||
      token?.mustChangePassword === true
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/change-password';
      redirectUrl.searchParams.set('message', 'required');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/client/event-categories/:slug/packages',
    '/admin/:path*',
  ],
};
