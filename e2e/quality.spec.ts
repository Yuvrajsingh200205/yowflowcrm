import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { signIn } from './helpers';

const SHOTS = path.join(__dirname, '.artifacts', 'screenshots');
const PUBLIC_PAGES = ['/', '/features', '/pricing', '/about', '/contact', '/changelog', '/privacy', '/terms', '/login', '/signup', '/forgot-password'];
const APP_PAGES = ['/dashboard', '/leads', '/projects', '/settings'];
const WIDTHS = [375, 768, 1440];

async function scrollThrough(page: import('@playwright/test').Page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(80); }
  await page.evaluate(() => window.scrollTo(0, 0));
}

test.describe('accessibility (axe, WCAG 2.1 A/AA)', () => {
  for (const url of PUBLIC_PAGES) {
    test(`public ${url} has no serious or critical violations`, async ({ page }) => {
      await page.goto(url);
      await scrollThrough(page);
      await page.waitForTimeout(500);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
  for (const url of APP_PAGES) {
    test(`app ${url} has no serious or critical violations`, async ({ page }) => {
      await signIn(page);
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
});

test.describe('responsive screenshots (375 / 768 / 1440) and layout integrity', () => {
  test.beforeAll(() => { fs.mkdirSync(SHOTS, { recursive: true }); });
  for (const url of PUBLIC_PAGES) {
    test(`public ${url}`, async ({ page }) => {
      for (const w of WIDTHS) {
        await page.setViewportSize({ width: w, height: 900 });
        await page.goto(url);
        await scrollThrough(page);
        await page.waitForTimeout(400);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${url} @${w}`).toBeLessThanOrEqual(1);
        await page.screenshot({ path: path.join(SHOTS, `${url === '/' ? 'home' : url.slice(1)}-${w}.png`), fullPage: true });
      }
    });
  }
  for (const url of APP_PAGES) {
    test(`app ${url}`, async ({ page }) => {
      await signIn(page);
      for (const w of WIDTHS) {
        await page.setViewportSize({ width: w, height: 900 });
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(800);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${url} @${w}`).toBeLessThanOrEqual(1);
        await page.screenshot({ path: path.join(SHOTS, `app${url.replace('/', '-')}-${w}.png`) });
      }
    });
  }
});
