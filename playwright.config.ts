import { defineConfig, devices } from '@playwright/test';

const PORT = 3002; // must be in the backend's CORS allowlist
const BACKEND = 'http://localhost:5051';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1, // one shared, seeded database
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'off' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: [
    {
      command: 'bash e2e/scripts/start-backend.sh',
      url: `${BACKEND}/api/v1/auth/me`,
      // 401 is the healthy answer for an anonymous /auth/me
      ignoreHTTPSErrors: true,
      timeout: 180_000,
      reuseExistingServer: !process.env.E2E_FRESH,
      stdout: 'pipe',
    },
    {
      command: `NEXT_DIST_DIR=.next-e2e API_PROXY_TARGET=${BACKEND} NEXT_PUBLIC_API_URL=/api/v1 sh -c "npx next build --webpack && npx next start -p ${PORT}"`,
      url: `http://localhost:${PORT}/`,
      timeout: 300_000,
      reuseExistingServer: !process.env.E2E_FRESH,
    },
  ],
});
