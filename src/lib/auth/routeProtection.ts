import { BRAND } from '@/config/brand';
export const ACCESS_COOKIE = `${BRAND.cookiePrefix}_access_token`;
export const REFRESH_COOKIE = `${BRAND.cookiePrefix}_refresh_token`;
export const CLIENT_SESSION_COOKIE = `${BRAND.cookiePrefix}_client_session`;
export const FREELANCER_ACCESS_COOKIE = `${BRAND.cookiePrefix}_freelancer_access_token`;
export const FREELANCER_REFRESH_COOKIE = `${BRAND.cookiePrefix}_freelancer_refresh_token`;
export const FREELANCER_SESSION_COOKIE = `${BRAND.cookiePrefix}_freelancer_session`;

const PUBLIC_PREFIXES = [
  // A shared gallery is opened by family who have no CRM account; the token in
  // the URL is the credential and the API enforces revocation, expiry and any
  // password before returning a single photograph.
  '/share',
  '/login',
  '/pricing',
  '/features',
  '/studios',
  '/clients',
  '/contact',
  '/services',
  '/privacy',
  '/terms',
  '/client',
  '/freelancers',
  '/freelancers/join',
  '/panel',
];

const PUBLIC_FREELANCER_ROUTES = ['/freelancer/login', '/freelancer/join', '/freelancer/onboarding'];
const PROTECTED_FREELANCER_PREFIXES = ['/freelancer'];

const PUBLIC_ROUTES = [
  '/',
];

const PUBLIC_FILES = [
  '/favicon.ico',
  '/icon.svg',
  '/robots.txt',
  '/sitemap.xml',
];

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (PUBLIC_FILES.includes(pathname)) return true;
  if (PUBLIC_FREELANCER_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return true;
  return PUBLIC_PREFIXES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isFreelancerRoute(pathname: string): boolean {
  return PROTECTED_FREELANCER_PREFIXES.some((route) => pathname === route || pathname.startsWith(`${route}/`)) &&
    !PUBLIC_FREELANCER_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isFrameworkRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/brand/')
  );
}

export function hasAuthCookie(cookies: { has: (name: string) => boolean }): boolean {
  return cookies.has(ACCESS_COOKIE) || cookies.has(REFRESH_COOKIE) || cookies.has(CLIENT_SESSION_COOKIE);
}

export function hasFreelancerAuthCookie(cookies: { has: (name: string) => boolean }): boolean {
  return cookies.has(FREELANCER_ACCESS_COOKIE) || cookies.has(FREELANCER_REFRESH_COOKIE) || cookies.has(FREELANCER_SESSION_COOKIE);
}

export function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  const pathname = value.split(/[?#]/, 1)[0] || '/';
  if (isPublicRoute(pathname) || isFrameworkRoute(pathname)) return '/dashboard';
  return value;
}
