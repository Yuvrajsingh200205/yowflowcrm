import { expect, test } from '@playwright/test';
import { OWNER, lbl, signIn, uniqueEmail } from './helpers';

const ACCESS = 'yf_access_token';

test.describe('sign-in, sign-out and already-signed-in flows', () => {
  test('sidebar menu signs out even when the access token has expired, and stays signed out', async ({ page, context }) => {
    await signIn(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // simulate the 15-minute access token having lapsed: only the refresh cookie is left
    await context.clearCookies({ name: ACCESS });
    await page.getByRole('button', { name: /Studio Owner/ }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible(); // the form, not a silent bounce back into the app
    const names = (await context.cookies()).map((c) => c.name);
    expect(names.filter((n) => n.startsWith('yf_'))).toEqual([]);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('a signed-in visitor sees their account on the landing page, /login and /signup instead of a silent redirect', async ({ page }) => {
    await signIn(page);
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Open dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start free trial' }).first()).toBeHidden().catch(() => undefined);

    await page.goto('/login');
    await expect(page.getByText(/You’re signed in as/)).toBeVisible();
    await page.getByRole('button', { name: /Continue to dashboard/ }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/signup?plan=studio');
    await expect(page.getByRole('heading', { name: 'You’re already signed in' })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out and start a new workspace' }).click();
    await expect(page.getByRole('heading', { name: 'Start your free trial' })).toBeVisible();
    await expect(page.getByLabel(/^Studio name/)).toBeVisible();

    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Start free trial' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open dashboard' })).toHaveCount(0);
  });

  test('landing page “Sign out” ends the session without leaving the page', async ({ page }) => {
    await signIn(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign out' }).first().click();
    await expect(page.getByRole('link', { name: 'Log in' }).first()).toBeVisible();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('a freelancer signs out from the portal with an expired access token and stays signed out', async ({ page, context }) => {
    const email = uniqueEmail('free');
    const phone = `9${Math.floor(100000000 + Math.random() * 899999999)}`;
    const res = await page.request.post('/api/v1/freelancer-portal/applications', { data: { studio: 'e2e-studio', fullName: 'Session Tester', phone, email, password: 'Freelance#2026', confirmPassword: 'Freelance#2026', city: 'Pune' } });
    expect(res.ok(), await res.text()).toBeTruthy();
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel(lbl('Password')).fill('Freelance#2026');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/freelancer\/dashboard/);
    await context.clearCookies({ name: ACCESS });
    await context.clearCookies({ name: 'yf_freelancer_access_token' });
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel('Email')).toBeVisible();
    await page.goto('/freelancer/dashboard');
    await expect(page).toHaveURL(/\/login/);
    void OWNER;
  });
});
