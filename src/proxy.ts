import { NextRequest, NextResponse } from 'next/server';
import { isKnownAppRoute, hasAuthCookie, hasFreelancerAuthCookie, isFrameworkRoute, isFreelancerRoute, isPublicRoute, safeReturnPath } from '@/lib/auth/routeProtection';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isFrameworkRoute(pathname)) return NextResponse.next();
  // Unknown URLs get a real 404 instead of a login redirect.
  if (!isPublicRoute(pathname) && !isKnownAppRoute(pathname)) return NextResponse.next();

  const authenticated = hasAuthCookie(request.cookies);
  const freelancerAuthenticated = hasFreelancerAuthCookie(request.cookies);

  if (isFreelancerRoute(pathname)) {
    if (!freelancerAuthenticated) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      const returnTo = `${pathname}${search}`;
      if (safeReturnPath(returnTo) === returnTo) loginUrl.searchParams.set('returnTo', returnTo);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isPublicRoute(pathname)) {
    // /login and /signup are never redirected at the edge: a signed-in visitor sees an explicit
    // "continue or sign out" choice rendered by the page instead of being forwarded silently.
    return NextResponse.next();
  }

  if (!authenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    const returnTo = `${pathname}${search}`;
    if (safeReturnPath(returnTo) === returnTo) loginUrl.searchParams.set('returnTo', returnTo);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|icon.png|apple-icon.png|opengraph-image|twitter-image|sitemap.xml|robots.txt|brand/|marketing/|images/|api/).*)'],
};
