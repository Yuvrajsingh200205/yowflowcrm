import type { NextConfig } from 'next';

const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
const configuredApiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, '');
const publicApiProxyTarget = publicApiUrl?.startsWith('http')
  ? publicApiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')
  : undefined;
const apiProxyTarget =
  configuredApiProxyTarget ??
  publicApiProxyTarget ??
  (process.env.NODE_ENV !== 'production' && (publicApiUrl?.startsWith('/') ?? true) ? 'http://localhost:5050' : undefined);

// A production build must never fall back to someone else's backend: fail loudly instead.
if (process.env.NODE_ENV === 'production' && !apiProxyTarget && (publicApiUrl?.startsWith('/') ?? true) && process.env.NEXT_PHASE !== 'phase-export') {
  throw new Error('API_PROXY_TARGET is required for production builds (the origin of your backend, e.g. https://api.example.com).');
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets the E2E suite build into its own directory without disturbing a running dev server.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  outputFileTracingRoot: process.cwd(),
  /**
   * Proxy browser API calls through Next so auth cookies stay first-party to
   * the CRM origin. This avoids third-party cookie loss on /auth/refresh when
   * the backend is hosted on a separate domain.
   */
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [{
      source: '/api/v1/:path*',
      destination: `${apiProxyTarget}/api/v1/:path*`,
    }];
  },
};

export default nextConfig;
