'use client';
import { BRAND } from '@/config/brand';

type AuthDebugDetails = Record<string, unknown>;

const enabled = () =>
  typeof window !== 'undefined' &&
  process.env.NODE_ENV !== 'production' &&
  window.localStorage.getItem(`${BRAND.cookiePrefix}.auth.debug`) !== '0';

function sanitize(details: AuthDebugDetails): AuthDebugDetails {
  const redacted = new Set(['token', 'accessToken', 'refreshToken', 'authorization', 'cookie', 'cookies', 'password']);
  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => [
      key,
      redacted.has(key.toLowerCase()) ? '[redacted]' : value,
    ]),
  );
}

export function authEvent(type: string, details: AuthDebugDetails = {}): void {
  if (!enabled()) return;
  // Keep the object expandable in DevTools without ever printing credentials.
  console.info('[AUTH EVENT]', {
    type,
    time: new Date().toISOString(),
    ...sanitize(details),
  });
}

export function authTimer(type: string, details: AuthDebugDetails = {}): void {
  if (!enabled()) return;
  console.info('[AUTH TIMER]', {
    type,
    time: new Date().toISOString(),
    ...sanitize(details),
  });
}
