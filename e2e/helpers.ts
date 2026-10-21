import fs from 'fs';
import path from 'path';
import { expect, type Page } from '@playwright/test';

/** Matches a form label exactly, tolerating the visual required-asterisk. */
export const lbl = (text: string) => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*?$`);

export const OWNER = { email: 'owner@e2e.test', password: 'E2eOwner#2026' };
const LOG = path.join(__dirname, '.artifacts', 'backend.log');

/** Unique e-mail per run so tests never collide on the shared database. */
export const uniqueEmail = (tag: string) => `${tag}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@e2e.test`;

/** Dev mail is logged by the backend (no SMTP). Returns the app path + token from the newest matching mail. */
export function latestMailLink(kind: 'verify-email' | 'reset-password', to: string): string {
  const lines = fs.readFileSync(LOG, 'utf8').split('\n').reverse();
  for (const line of lines) {
    if (!line.includes('mail (dev, not sent)') || !line.includes(kind)) continue;
    try {
      const j = JSON.parse(line.slice(line.indexOf('{')));
      if (j.to !== to) continue;
      const m = /https?:\/\/[^\s"]+?(\/(?:verify-email|reset-password)\?token=[^\s"\\]+)/.exec(j.body);
      if (m) return m[1];
    } catch { /* not a JSON line */ }
  }
  throw new Error(`No ${kind} mail found for ${to}`);
}

export async function waitForMail(kind: 'verify-email' | 'reset-password', to: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    try { return latestMailLink(kind, to); } catch { await new Promise((r) => setTimeout(r, 250)); }
  }
  throw new Error(`Timed out waiting for ${kind} mail to ${to}`);
}

export async function signIn(page: Page, email = OWNER.email, password = OWNER.password) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel(lbl('Password')).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

/** Collects console errors and failed same-origin requests (excluding aborted navigations). */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource.*(401|403)/.test(m.text())) errors.push(`console: ${m.text()}`); });
  return errors;
}

/** The inline form error (Next also renders an empty role=alert route announcer). */
export const formAlert = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');
