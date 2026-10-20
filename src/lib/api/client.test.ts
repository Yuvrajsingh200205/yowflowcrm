import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `client.ts` reads `window`/`document` at module load, so each test installs a
 * minimal browser surface and then imports a fresh copy of the module. Fresh
 * imports also reset the module-level single-flight state between tests.
 */
function installBrowser(initialCookie = '') {
  const store = new Map<string, string>();
  let cookie = initialCookie;

  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };

  const documentStub = {
    get cookie() {
      return cookie;
    },
    set cookie(value: string) {
      const [pair] = value.split(';');
      const name = pair.split('=')[0].trim();
      const maxAge = /Max-Age=(-?\d+)/i.exec(value)?.[1];
      const others = cookie
        .split(';')
        .map((c) => c.trim())
        .filter((c) => c && !c.startsWith(`${name}=`));
      if (maxAge === '0') {
        cookie = others.join('; ');
        return;
      }
      cookie = [...others, pair.trim()].join('; ');
    },
  };

  vi.stubGlobal('window', {
    localStorage,
    setTimeout,
    clearTimeout,
    location: { origin: 'http://localhost:3000' },
  });
  vi.stubGlobal('localStorage', localStorage);
  vi.stubGlobal('document', documentStub);
  return { store, readCookie: () => cookie };
}

const importClient = async () => {
  vi.resetModules();
  return import('./client');
};

describe('api client session storage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('never writes the access or refresh token into localStorage', async () => {
    const { store } = installBrowser();
    const { setAuthTokens } = await importClient();

    setAuthTokens({
      accessToken: 'header.payload.signature',
      refreshToken: 'a-refresh-token',
      accessTokenExpiresIn: 900,
      refreshTokenExpiresIn: 604800,
    });

    expect([...store.keys()]).toHaveLength(0);
    expect(JSON.stringify([...store.entries()])).not.toContain('a-refresh-token');
  });

  it('purges tokens left in localStorage by an older build', async () => {
    const { store } = installBrowser();
    store.set('yf.accessToken', 'legacy-access');
    store.set('yf.refreshToken', 'legacy-refresh');

    const { setAuthTokens } = await importClient();
    setAuthTokens(null);

    expect(store.get('yf.accessToken')).toBeUndefined();
    expect(store.get('yf.refreshToken')).toBeUndefined();
  });

  it('tracks the session with the readable hint cookie only', async () => {
    const { readCookie } = installBrowser();
    const { setAuthTokens, hasStoredSession } = await importClient();

    expect(hasStoredSession()).toBe(false);

    setAuthTokens({ accessToken: 'a.b.c', accessTokenExpiresIn: 900, refreshTokenExpiresIn: 604800 });
    expect(hasStoredSession()).toBe(true);
    expect(readCookie()).toContain('yf_client_session=1');
    // The flag carries no credential.
    expect(readCookie()).not.toContain('a.b.c');

    setAuthTokens(null);
    expect(hasStoredSession()).toBe(false);
  });

  it('issues one /auth/refresh for concurrent callers', async () => {
    installBrowser('yf_client_session=1');
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({
        success: true,
        data: { tokens: { accessToken: 'a.b.c', accessTokenExpiresIn: 900 } },
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { refreshSession } = await importClient();
    const results = await Promise.all([refreshSession(), refreshSession(), refreshSession()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results.every((r) => r.ok)).toBe(true);
  });

  it('gives up and clears the session when a refresh is rejected', async () => {
    const { readCookie } = installBrowser('yf_client_session=1');
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: async () => ({ success: false, error: { code: 'UNAUTHENTICATED' } }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { refreshSession, hasStoredSession } = await importClient();
    const result = await refreshSession();

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ reason: 'invalid' });
    // The cleared hint cookie is what stops the app retrying /me -> /refresh.
    expect(hasStoredSession()).toBe(false);
    expect(readCookie()).not.toContain('yf_client_session=1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry a rejected refresh on the next call', async () => {
    installBrowser('yf_client_session=1');
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: async () => ({ success: false, error: { code: 'UNAUTHENTICATED' } }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { refreshSession, hasStoredSession } = await importClient();
    await refreshSession();
    expect(hasStoredSession()).toBe(false);

    // Callers gate on hasStoredSession(), so a second refresh is never armed.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
