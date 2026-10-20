import { NextRequest, NextResponse } from 'next/server';
import { hasAuthCookie, hasFreelancerAuthCookie, isFrameworkRoute, isFreelancerRoute, isPublicRoute, safeReturnPath } from '@/lib/auth/routeProtection';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isFrameworkRoute(pathname)) return NextResponse.next();

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
    if (pathname === '/login' && authenticated) {
      const target = safeReturnPath(request.nextUrl.searchParams.get('returnTo'));
      if (freelancerAuthenticated || target.startsWith('/freelancer/')) return NextResponse.next();
      const redirectTo = request.nextUrl.clone();
      redirectTo.pathname = target;
      redirectTo.search = '';
      return NextResponse.redirect(redirectTo);
    }
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|brand/|images/|api/).*)'],
};
