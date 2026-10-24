import { describe, expect, it } from 'vitest';
import {
  ACCESS_COOKIE,
  CLIENT_SESSION_COOKIE,
  FREELANCER_ACCESS_COOKIE,
  FREELANCER_REFRESH_COOKIE,
  FREELANCER_SESSION_COOKIE,
  REFRESH_COOKIE,
  hasAuthCookie,
  hasFreelancerAuthCookie,
  isFrameworkRoute,
  isKnownAppRoute,
  isFreelancerRoute,
  isPublicRoute,
  safeReturnPath,
} from './routeProtection';

const cookies = (...names: string[]) => ({
  has: (name: string) => names.includes(name),
});

describe('route protection helpers', () => {
  it('keeps login and public freelancer registration routes public', () => {
    expect(isPublicRoute('/login')).toBe(true);
    // Family opening a shared gallery have no account; the token is the credential.
    expect(isPublicRoute('/share/abc123')).toBe(true);
    expect(isPublicRoute('/share')).toBe(true);
    expect(isPublicRoute('/freelancer/login')).toBe(true);
    expect(isPublicRoute('/freelancer/join')).toBe(true);
    expect(isPublicRoute('/freelancer/onboarding')).toBe(true);
    expect(isPublicRoute('/for-freelancers')).toBe(true);
    // the CRM workspace route of the same name root must stay protected
    expect(isPublicRoute('/freelancers')).toBe(false);
    expect(isPublicRoute('/dashboard')).toBe(false);
  });

  it('keeps the customer booking page and quote link public, and the staff Quotes screens protected', () => {
    // Customers have no account; the slug or token in the URL is the credential.
    expect(isPublicRoute('/enquire/lumen-studio')).toBe(true);
    expect(isPublicRoute('/quote/aB3_-xyzaB3_-xyzaB3_-xyz')).toBe(true);
    // "/quotes" shares a prefix with "/quote" but is the staff screen.
    expect(isPublicRoute('/quotes')).toBe(false);
    expect(isPublicRoute('/sales-setup')).toBe(false);
    expect(isKnownAppRoute('/quotes')).toBe(true);
    expect(isKnownAppRoute('/sales-setup')).toBe(true);
    expect(safeReturnPath('/quotes')).toBe('/quotes');
    expect(safeReturnPath('/enquire/lumen-studio')).toBe('/dashboard');
  });

  it('marks freelancer portal pages protected without sending them to internal CRM auth', () => {
    expect(isFreelancerRoute('/freelancer/dashboard')).toBe(true);
    expect(isFreelancerRoute('/freelancer/profile')).toBe(true);
    expect(isFreelancerRoute('/freelancer/portfolio')).toBe(true);
    expect(isFreelancerRoute('/freelancer/availability')).toBe(true);
    expect(isFreelancerRoute('/freelancer/subscription')).toBe(true);
    expect(isFreelancerRoute('/freelancer/connections')).toBe(true);
    expect(isFreelancerRoute('/freelancer/assignments')).toBe(true);
    expect(isFreelancerRoute('/freelancer/payments')).toBe(true);
    expect(isFreelancerRoute('/freelancer/login')).toBe(false);
    expect(isFreelancerRoute('/freelancer/join')).toBe(false);
    expect(isFreelancerRoute('/freelancer/onboarding')).toBe(false);
  });

  it('ignores framework and API paths', () => {
    expect(isFrameworkRoute('/_next/static/chunk.js')).toBe(true);
    expect(isFrameworkRoute('/api/v1/auth/me')).toBe(true);
    expect(isFrameworkRoute('/images/hero-aperture.svg')).toBe(true);
    expect(isFrameworkRoute('/projects/new')).toBe(false);
  });

  it('accepts backend auth cookies or the frontend session marker so sessions can reach the app', () => {
    expect(hasAuthCookie(cookies())).toBe(false);
    expect(hasAuthCookie(cookies(ACCESS_COOKIE))).toBe(true);
    expect(hasAuthCookie(cookies(REFRESH_COOKIE))).toBe(true);
    expect(hasAuthCookie(cookies(CLIENT_SESSION_COOKIE))).toBe(true);
  });

  it('accepts only freelancer cookies or the non-secret freelancer marker for portal routes', () => {
    expect(hasFreelancerAuthCookie(cookies())).toBe(false);
    expect(hasFreelancerAuthCookie(cookies(FREELANCER_ACCESS_COOKIE))).toBe(true);
    expect(hasFreelancerAuthCookie(cookies(FREELANCER_REFRESH_COOKIE))).toBe(true);
    expect(hasFreelancerAuthCookie(cookies(FREELANCER_SESSION_COOKIE))).toBe(true);
    expect(hasFreelancerAuthCookie(cookies(ACCESS_COOKIE, REFRESH_COOKIE))).toBe(false);
  });

  it('allows only protected local return paths', () => {
    expect(safeReturnPath('/projects/new')).toBe('/projects/new');
    expect(safeReturnPath('/dashboard?_rsc=abc')).toBe('/dashboard?_rsc=abc');
    expect(safeReturnPath('/login')).toBe('/dashboard');
    expect(safeReturnPath('/for-freelancers')).toBe('/dashboard');
    expect(safeReturnPath('/freelancer/login')).toBe('/dashboard');
    expect(safeReturnPath('/freelancer/join')).toBe('/dashboard');
    expect(safeReturnPath('/freelancer/onboarding?token=secret')).toBe('/dashboard');
    expect(safeReturnPath('https://evil.test')).toBe('/dashboard');
    expect(safeReturnPath('//evil.test')).toBe('/dashboard');
    expect(safeReturnPath(null)).toBe('/dashboard');
  });

  it('serves marketing and account pages publicly', () => {
    for (const path of ['/', '/features', '/pricing', '/about', '/contact', '/changelog', '/privacy', '/terms', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/for-freelancers']) {
      expect(isPublicRoute(path), path).toBe(true);
    }
  });

  it('keeps every CRM workspace route protected (marketing pages must never shadow them)', () => {
    for (const path of ['/dashboard', '/clients', '/freelancers', '/leads', '/projects', '/shoots', '/expenses', '/team', '/settings', '/roles-permissions']) {
      expect(isPublicRoute(path), path).toBe(false);
    }
  });

  it('treats unknown URLs as not part of the app so they can 404', () => {
    expect(isKnownAppRoute('/this-page-does-not-exist')).toBe(false);
    expect(isKnownAppRoute('/projects/123')).toBe(true);
    expect(isKnownAppRoute('/freelancer/dashboard')).toBe(true);
    expect(isKnownAppRoute('/leads')).toBe(true);
  });

  it('derives cookie names from the brand prefix', () => {
    expect(ACCESS_COOKIE).toBe('yf_access_token');
    expect(REFRESH_COOKIE).toBe('yf_refresh_token');
  });
});
