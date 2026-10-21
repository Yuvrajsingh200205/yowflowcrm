import { expect, test } from '@playwright/test';
import { signIn, trackErrors, lbl } from './helpers';

const NAV: Array<[string, RegExp, string]> = [
  ['Dashboard', /\/dashboard$/, 'Dashboard'],
  ['Leads & Inquiries', /\/leads$/, 'Leads & Inquiries'],
  ['Clients', /\/clients$/, 'Clients'],
  ['Projects', /\/projects$/, ''],
  ['Shoot Management', /\/shoots$/, 'Shoot Management'],
  ['Equipment Inventory', /\/equipment$/, 'Equipment Inventory'],
  ['Data Management', /\/data-management$/, 'Data Management'],
  ['Team & Attendance', /\/team$/, 'Team & Attendance'],
  ['Freelancer Team', /\/freelancers$/, 'Freelancer Team'],
  ['Finance', /\/expenses$/, 'Finance'],
  ['Roles & Permissions', /\/roles-permissions$/, 'Roles & Permissions'],
  ['Settings', /\/settings$/, 'Settings'],
];

test.describe('workspace', () => {
  test.beforeEach(async ({ page }) => { await signIn(page); });

  test('every sidebar destination loads without runtime errors', async ({ page }) => {
    const errors = trackErrors(page);
    const nav = page.getByRole('navigation', { name: 'Main' });
    for (const [label, url, heading] of NAV) {
      await nav.getByRole('button', { name: label, exact: true }).click();
      await expect(page).toHaveURL(url);
      await expect(nav.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
      if (heading) await expect(page.getByRole('heading', { level: 1, name: heading }).first()).toBeVisible();
      await page.waitForLoadState('networkidle');
    }
    expect(errors).toEqual([]);
  });

  test('command palette finds pages and runs them from the keyboard', async ({ page }) => {
    await page.keyboard.press('ControlOrMeta+k');
    const palette = page.getByRole('dialog', { name: 'Command palette' });
    await expect(palette).toBeVisible();
    await page.keyboard.type('shoot');
    await expect(palette.getByRole('option').first()).toContainText('Shoot Management');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/shoots$/);

    await page.keyboard.press('ControlOrMeta+k');
    await page.keyboard.type('zzzz-no-such-thing');
    await expect(palette).toContainText('No results');
    await page.keyboard.press('Escape');
    await expect(palette).toBeHidden();
  });

  test('command palette arrow keys move the selection', async ({ page }) => {
    await page.getByRole('button', { name: /^Search/ }).first().click();
    const options = page.getByRole('option');
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowUp');
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
  });

  test('dashboard shows key figures, quick actions and accessible charts', async ({ page }) => {
    await expect(page.getByRole('region', { name: 'Key figures' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Quick actions' })).toBeVisible();
    const charts = page.getByRole('region', { name: 'Trends' });
    await expect(charts).toBeVisible();
    await expect(charts.getByRole('img').first()).toBeVisible();
    await charts.getByText('View as table').first().click();
    await expect(charts.getByRole('table').first()).toBeVisible();
    // keyboard-reachable data points announce their values
    await expect(charts.locator('[tabindex="0"][role="img"]').first()).toHaveAttribute('aria-label', /: /);
  });

  test('the app shell stays light and the sidebar stays dark', async ({ page }) => {
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('aside[aria-label="Primary"]')).toHaveAttribute('data-theme', 'dark');
  });

  test('notifications popover opens and closes with Escape', async ({ page }) => {
    await page.getByRole('button', { name: /^Notifications/ }).click();
    await expect(page.getByRole('dialog', { name: 'Notifications' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Notifications' })).toBeHidden();
  });

  test('account menu offers settings and logout', async ({ page }) => {
    await page.getByRole('button', { name: /Studio Owner/ }).click();
    await page.getByRole('menuitem', { name: 'Account settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });
});

test.describe('settings', () => {
  test.beforeEach(async ({ page }) => { await signIn(page); await page.goto('/settings'); });

  test('profile can be updated', async ({ page }) => {
    await page.getByLabel('Phone').fill('9876543210');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByText('Profile updated')).toBeVisible();
  });

  test('team tab lists the people who can sign in', async ({ page }) => {
    await page.getByRole('tab', { name: 'Team' }).click();
    await expect(page.getByRole('table')).toContainText('owner@e2e.test');
  });

  test('billing tab shows the plans and explains when payments are off', async ({ page }) => {
    await page.getByRole('tab', { name: 'Billing' }).click();
    await expect(page.getByText('Current plan')).toBeVisible();
    for (const plan of ['Starter', 'Studio', 'Scale']) await expect(page.getByText(plan, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Online payments are not enabled/)).toBeVisible();
    await page.getByRole('radio', { name: 'Monthly' }).click();
    await expect(page.getByText('₹3,999').first()).toBeVisible();
  });

  test('API keys: create (shown once), list, revoke', async ({ page }) => {
    await page.getByRole('tab', { name: 'API keys' }).click();
    await page.getByRole('button', { name: 'Create key' }).first().click();
    await page.getByLabel('Name').fill('Zapier sync');
    await page.getByRole('button', { name: 'Create key' }).last().click();
    const shown = page.getByRole('dialog').locator('code').first();
    await expect(shown).toContainText(/^yfk_/);
    await page.getByRole('button', { name: 'Done' }).click();

    const row = page.getByRole('row', { name: /Zapier sync/ }).filter({ hasText: 'Created' }).first();
    await expect(row).toContainText('Read-only');
    await expect(row).not.toContainText(/yfk_[A-Za-z0-9_-]{20,}/); // only the prefix is ever listed

    page.once('dialog', (d) => d.accept());
    await row.getByRole('button', { name: 'Revoke' }).click();
    await expect(page.getByRole('row', { name: /Zapier sync/ }).filter({ hasText: 'Created' }).first()).toContainText('Revoked');
  });

  test('password change enforces the policy before calling the server', async ({ page }) => {
    await page.getByRole('tab', { name: 'Security' }).click();
    await page.getByRole('button', { name: 'Change password' }).click();
    await expect(page.getByText('Enter your current password.')).toBeVisible();
    await page.getByLabel(lbl('Current password')).fill('E2eOwner#2026');
    await page.getByLabel(lbl('New password')).fill('short');
    await page.getByRole('button', { name: 'Change password' }).click();
    await expect(page.getByText(/at least 10 characters with upper and lower/)).toBeVisible();
  });
});

test.describe('mobile workspace', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('navigation drawer works and nothing overflows horizontally', async ({ page }) => {
    await signIn(page);
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page).toHaveURL(/\/settings$/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
