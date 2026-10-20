import { authEvent } from '@/lib/auth/authDebug';
import { BRAND } from '@/config/brand';

export interface ApiMeta {
  requestId?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  [key: string]: unknown;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta: ApiMeta;
}

interface ApiErrorEnvelope {
  success: false;
  error?: { code?: string; message?: string; details?: unknown[] };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5050/api/v1';
const baseUrl = configuredApiUrl.replace(/[“”"']/g, '').trim().replace(/\/$/, '');

if (!/^(https?:\/\/|\/)/i.test(baseUrl)) {
  throw new Error('NEXT_PUBLIC_API_URL must be an absolute http(s) URL or an app-relative path.');
}

function apiBaseUrl(): string {
  if (typeof window === 'undefined' || baseUrl.startsWith('/')) return baseUrl;
  const url = new URL(baseUrl);
  if (url.origin === window.location.origin) return baseUrl;
  // In browsers, keep auth traffic same-origin and let Next proxy to the API.
  // Cross-site backend cookies are commonly blocked, which produces
  // `/auth/refresh` -> 401 "No refresh token supplied".
  return url.pathname.replace(/\/$/, '') || '/api/v1';
}

const REQUEST_TIMEOUT_MS = 15_000;
/**
 * Older builds mirrored the token pair into localStorage. Nothing reads them
 * any more — authentication is carried entirely by the backend's httpOnly
 * cookies — but they are purged whenever auth state is touched so an existing
 * browser does not keep a readable access token lying around.
 */
// Older builds (including the pre-rebrand `wpp.` keys) kept tokens in localStorage; purge them all.
const LEGACY_TOKEN_KEYS = ['wpp.accessToken', 'wpp.refreshToken', `${BRAND.cookiePrefix}.accessToken`, `${BRAND.cookiePrefix}.refreshToken`];
const CLIENT_SESSION_COOKIE = `${BRAND.cookiePrefix}_client_session`;
const DEFAULT_CLIENT_SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const ACCESS_TOKEN_REFRESH_WINDOW_MS = 90_000;

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresIn?: number;
  refreshTokenExpiresIn?: number;
}

interface RefreshSessionData {
  tokens: AuthTokens;
  user?: unknown;
}

type RefreshSessionResult =
  | { ok: true; data: RefreshSessionData }
  | { ok: false; reason: 'invalid'; status: number; message?: string }
  | { ok: false; reason: 'transient'; status: number; message?: string };

/**
 * The access and refresh tokens are never stored by this app. They live only in
 * the backend's httpOnly cookies, which the browser attaches automatically to
 * every same-origin `/api/v1` call (Next proxies those to the API, so the
 * cookies stay first-party). What is kept here is deliberately non-sensitive:
 *
 *  - `accessTokenExpiresAt`, in memory only, so the session can be renewed
 *    slightly before it lapses instead of after a user-visible 401.
 *  - `<prefix>_client_session`, a readable "this browser has a session" flag with no
 *    credential value, which lets the edge middleware and the session provider
 *    tell "signed out" apart from "cookie present but access token expired".
 */
let accessTokenExpiresAt: number | null = null;
let lastAuthWriteAt = 0;

function purgeLegacyTokenStorage(): void {
  if (typeof window === 'undefined') return;
  for (const key of LEGACY_TOKEN_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Private mode / blocked storage: nothing to purge.
    }
  }
}

// Purge on load too, so a browser upgrading to this build stops holding tokens
// even if it never signs in or out again.
purgeLegacyTokenStorage();

export function setAuthTokens(tokens: AuthTokens | null): void {
  if (typeof window === 'undefined') return;
  purgeLegacyTokenStorage();
  if (!tokens) {
    authEvent('TOKEN_CLEAR', { source: 'client.ts', reason: 'setAuthTokens_null' });
    accessTokenExpiresAt = null;
    document.cookie = `${CLIENT_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${sessionCookieSuffix()}`;
    return;
  }
  const nextExpiry = tokens.accessTokenExpiresIn
    ? Date.now() + tokens.accessTokenExpiresIn * 1000
    : null;
  if (accessTokenExpiresAt && nextExpiry && nextExpiry < accessTokenExpiresAt) {
    // An older in-flight response landing after a newer one must not move the
    // renewal schedule backwards.
    authEvent('TOKEN_WRITE_SKIPPED', {
      source: 'client.ts',
      reason: 'stale_expiry',
      existingExpiry: new Date(accessTokenExpiresAt).toISOString(),
      nextExpiry: new Date(nextExpiry).toISOString(),
    });
    return;
  }
  accessTokenExpiresAt = nextExpiry;
  lastAuthWriteAt = Date.now();
  const maxAge = tokens.refreshTokenExpiresIn ?? tokens.accessTokenExpiresIn ?? DEFAULT_CLIENT_SESSION_MAX_AGE;
  document.cookie = `${CLIENT_SESSION_COOKIE}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax${sessionCookieSuffix()}`;
  authEvent('TOKEN_WRITE', {
    source: 'client.ts',
    accessTokenExpiresAt: nextExpiry ? new Date(nextExpiry).toISOString() : null,
    clientSessionMaxAge: maxAge,
  });
}

/** `Secure` on HTTPS so the flag is not echoed over a plaintext downgrade. */
const sessionCookieSuffix = () =>
  typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';

function hasClientSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie.startsWith(`${CLIENT_SESSION_COOKIE}=`));
}

/** True when this browser still believes it holds a session. */
export function hasStoredSession(): boolean {
  return hasClientSessionCookie();
}

/** When the current access token lapses, or null if that is unknown. */
export function getAccessTokenExpiryMs(): number | null {
  return accessTokenExpiresAt;
}

let refreshInFlight: Promise<RefreshSessionResult> | null = null;

/**
 * Exchanges the httpOnly refresh cookie for a new access token. Single-flight,
 * so a burst of 401s from concurrent dashboard reads produces one refresh.
 */
export function refreshSession(): Promise<RefreshSessionResult> {
  if (refreshInFlight) {
    authEvent('REFRESH_JOIN', { source: 'client.ts' });
    return refreshInFlight;
  }
  refreshInFlight ??= (async () => {
    const startedAt = Date.now();
    try {
      authEvent('REFRESH_START', { source: 'client.ts', path: '/auth/refresh' });
      const response = await fetch(`${apiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const payload = await response.json().catch(() => null) as
        | { success?: boolean; data?: { tokens?: AuthTokens; user?: unknown } }
        | { success?: false; error?: { message?: string; code?: string } }
        | null;
      if (!response.ok || !payload?.success || !payload.data?.tokens?.accessToken) {
        const message = payload && 'error' in payload ? payload.error?.message : undefined;
        const reason = response.status === 401 || response.status === 403 ? 'invalid' : 'transient';
        authEvent('REFRESH_FAILED', {
          source: 'client.ts',
          path: '/auth/refresh',
          status: response.status,
          reason,
          message,
          setCookieReceived: response.headers.has('set-cookie'),
        });
        if (reason === 'invalid') {
          if (lastAuthWriteAt >= startedAt - 1_000) {
            // A newer successful refresh landed while this one was in flight.
            // Do not tear down a session that is demonstrably alive.
            authEvent('REFRESH_INVALID_IGNORED', {
              source: 'client.ts',
              reason: 'newer_session_present',
              refreshStartedAt: new Date(startedAt).toISOString(),
              lastAuthWriteAt: new Date(lastAuthWriteAt).toISOString(),
            });
            return { ok: false, reason: 'transient', status: response.status, message: 'Newer session already present' };
          }
          setAuthTokens(null);
        }
        return { ok: false, reason, status: response.status, message };
      }
      setAuthTokens(payload.data.tokens);
      authEvent('REFRESH_SUCCESS', {
        source: 'client.ts',
        path: '/auth/refresh',
        status: response.status,
        hasUser: Boolean(payload.data.user),
        setCookieReceived: response.headers.has('set-cookie'),
      });
      return { ok: true, data: { tokens: payload.data.tokens, user: payload.data.user } };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown refresh error';
      authEvent('REFRESH_FAILED', {
        source: 'client.ts',
        path: '/auth/refresh',
        status: 0,
        reason: 'transient',
        message,
      });
      return { ok: false, reason: 'transient', status: 0, message };
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

type Result = { data: unknown; meta: ApiMeta };

/**
 * GET de-duplication. Several panels legitimately need the same list, and
 * StrictMode mounts every effect twice, so identical reads used to become
 * identical concurrent requests. Callers that need certainty after a write
 * pass `fresh: true`, which also drops the entry for that path.
 */
const inFlight = new Map<string, Promise<Result>>();
const recent = new Map<string, { at: number; result: Result }>();
const DEDUPE_WINDOW_MS = 3_000;

/**
 * Reads that are the same for the whole session. The permission catalogue is
 * seeded server-side and never changes while the app is open, so refetching it
 * after every write only added latency to the roles screen.
 */
const SESSION_STABLE_PATHS = ['/permissions'];
const SESSION_TTL_MS = 10 * 60_000;

const isSessionStable = (path: string) => SESSION_STABLE_PATHS.includes(path);
const ttlFor = (path: string) => (isSessionStable(path) ? SESSION_TTL_MS : DEDUPE_WINDOW_MS);

export function invalidateReadCache(pathPrefix?: string): void {
  if (!pathPrefix) {
    for (const key of [...recent.keys()]) {
      if (!isSessionStable(key)) recent.delete(key);
    }
    return;
  }
  for (const key of [...recent.keys()]) {
    if (key.startsWith(pathPrefix)) recent.delete(key);
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number; fresh?: boolean } = {},
): Promise<{ data: T; meta: ApiMeta }> {
  const method = (init.method ?? 'GET').toUpperCase();
  if (method !== 'GET') {
    // Any write can change any list; the next read must hit the network.
    const result = await performRequest<T>(path, init);
    invalidateReadCache();
    return result;
  }

  if (init.fresh) {
    recent.delete(path);
    inFlight.delete(path);
  } else {
    const hit = recent.get(path);
    if (hit && Date.now() - hit.at < ttlFor(path)) {
      return hit.result as { data: T; meta: ApiMeta };
    }
    const pending = inFlight.get(path);
    if (pending) return pending as Promise<{ data: T; meta: ApiMeta }>;
  }

  const request = performRequest<T>(path, init)
    .then((result) => {
      recent.set(path, { at: Date.now(), result });
      return result;
    })
    .finally(() => inFlight.delete(path));

  inFlight.set(path, request as Promise<Result>);
  return request;
}

/** Authenticated binary download with the same one-time refresh behavior as API JSON calls. */
export async function apiBlobRequest(path: string, isRetry = false): Promise<{ blob: Blob; filename: string | null }> {
  const headers = new Headers({ Accept: 'application/pdf' });
  await renewIfExpiring(path);
  try {
    const response = await fetch(`${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`, { headers, credentials: 'include' });
    if (response.status === 401 && !isRetry && hasStoredSession()) {
      authEvent('API_401', { source: 'client.ts', path, kind: 'blob', retry: false });
      const refreshed = await refreshSession();
      if (refreshed.ok) return apiBlobRequest(path, true);
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as ApiErrorEnvelope | null;
      throw new ApiError(response.status, payload?.error?.message ?? statusMessage(response.status), payload?.error?.code, payload?.error?.details);
    }
    const disposition = response.headers.get('content-disposition');
    const filename = disposition?.match(/filename="?([^";]+)"?/i)?.[1] ?? null;
    return { blob: await response.blob(), filename };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'Unable to download the report. Check your connection and try again.');
  }
}

const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

/**
 * Renews the session cookie shortly before the access token lapses, so a long
 * page session does not have to surface a 401 first. Single-flight, and never
 * on the auth endpoints themselves — refreshing before a login or a refresh
 * would be the first step of an infinite loop.
 */
async function renewIfExpiring(path: string): Promise<void> {
  if (NO_REFRESH_PATHS.includes(path)) return;
  const expiresAt = getAccessTokenExpiryMs();
  if (expiresAt === null) return;
  if (expiresAt - Date.now() > ACCESS_TOKEN_REFRESH_WINDOW_MS) return;
  await refreshSession();
}

function linkedSignal(timeoutMs: number, externalSignal?: AbortSignal): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const abort = () => controller.abort();
  externalSignal?.addEventListener('abort', abort, { once: true });
  if (externalSignal?.aborted) controller.abort();
  return {
    signal: controller.signal,
    cleanup: () => {
      window.clearTimeout(timeout);
      externalSignal?.removeEventListener('abort', abort);
    },
  };
}

async function performRequest<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
  isRetry = false,
): Promise<{ data: T; meta: ApiMeta }> {
  const method = (init.method ?? 'GET').toUpperCase();
  const { signal, cleanup } = linkedSignal(init.timeoutMs ?? REQUEST_TIMEOUT_MS, init.signal ?? undefined);
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  await renewIfExpiring(path);

  try {
    const response = await fetch(`${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`, {
      ...init,
      headers,
      credentials: 'include',
      signal,
    });
    if (response.status === 204) return { data: undefined as T, meta: {} };

    if (
      response.status === 401 &&
      !isRetry &&
      !NO_REFRESH_PATHS.includes(path) &&
      hasStoredSession()
    ) {
      // The access token lives ~15 minutes; renew it once and replay the call
      // so an expired token never surfaces as a lost session.
      authEvent('API_401', { source: 'client.ts', path, method, retry: false });
      const renewed = await refreshSession();
      if (renewed.ok) return performRequest<T>(path, init, true);
    }

    const payload = await response.json().catch(() => null) as ApiEnvelope<T> | ApiErrorEnvelope | null;
    if (!response.ok || !payload || !payload.success) {
      const error = payload as ApiErrorEnvelope | null;
      authEvent('API_ERROR', {
        source: 'client.ts',
        path,
        method,
        status: response.status,
        code: error?.error?.code,
        message: error?.error?.message ?? statusMessage(response.status),
      });
      throw new ApiError(
        response.status,
        error?.error?.message ?? statusMessage(response.status),
        error?.error?.code,
        error?.error?.details,
      );
    }
    return { data: payload.data, meta: payload.meta ?? {} };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'This is taking longer than expected. Please try again.');
    }
    throw new ApiError(0, 'Unable to reach the CRM service. Check your connection and try again.');
  } finally {
    cleanup();
  }
}

function statusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Please check the submitted information.',
    401: 'Your session has expired. Please sign in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested record was not found.',
    409: 'This action conflicts with the current record state.',
    422: 'The request could not be processed. Please check the form.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'The CRM service encountered an error. Please try again.',
    503: 'The CRM service is temporarily unavailable. Please try again shortly.',
  };
  return messages[status] ?? 'The request could not be completed.';
}
