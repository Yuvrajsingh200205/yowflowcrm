import { expect, test } from '@playwright/test';
import { formAlert, OWNER, signIn, trackErrors, uniqueEmail, waitForMail, lbl } from './helpers';

test.describe('authentication and account lifecycle', () => {
  test('logged-out visitors are redirected from the workspace to login, and returned after signing in', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fprojects/);
    await page.getByLabel('Email').fill(OWNER.email);
    await page.getByLabel(lbl('Password')).fill(OWNER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/projects/);
  });

  test('wrong password shows an error without leaking which field was wrong', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(OWNER.email);
    await page.getByLabel(lbl('Password')).fill('definitely-wrong-1A');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(formAlert(page)).toContainText(/invalid email or password/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test('empty submit shows field errors and password can be revealed', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Enter your email address.')).toBeVisible();
    await expect(page.getByText('Enter your password.')).toBeVisible();
    const pw = page.getByLabel(lbl('Password'));
    await pw.fill('secret');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(pw).toHaveAttribute('type', 'text');
  });

  test('session survives a reload, then logout ends it', async ({ page }) => {
    await signIn(page);
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
    await page.getByRole('button', { name: /Studio Owner/ }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('signup creates a workspace, shows the verify banner, and verifying clears it', async ({ page }) => {
    const email = uniqueEmail('founder');
    await page.goto('/signup?plan=studio');
    await page.getByRole('button', { name: 'Create workspace' }).click();
    await expect(page.getByText('Enter your studio name.')).toBeVisible();

    await page.getByLabel('Studio name').fill('Lumen & Co');
    await page.getByLabel('Your name').fill('Asha Rao');
    await page.getByLabel('Work email').fill(email);
    await page.getByLabel(lbl('Password')).fill('weakpass');
    await page.getByRole('button', { name: 'Create workspace' }).click();
    await expect(page.getByText(/at least 10 characters with upper and lower/)).toBeVisible();

    await page.getByLabel(lbl('Password')).fill('Sup3rSecret!x');
    await page.getByRole('button', { name: 'Create workspace' }).click();

    // Signing up does not sign anyone in: the owner lands on the login page and signs in themselves.
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
    await expect(page.getByText(/Your workspace is ready/)).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveValue(email);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel(lbl('Password')).fill('Sup3rSecret!x');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.getByRole('status').filter({ hasText: 'Verify your email' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Get started with Yowflow/ })).toBeVisible();

    const link = await waitForMail('verify-email', email);
    await page.goto(link);
    await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible();
    await page.goto('/dashboard');
    await expect(page.getByRole('status').filter({ hasText: 'Verify your email' })).toHaveCount(0);
  });

  test('duplicate signup is rejected with a clear message', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Studio name').fill('Dupe Studio');
    await page.getByLabel('Your name').fill('Owner Again');
    await page.getByLabel('Work email').fill(OWNER.email);
    await page.getByLabel(lbl('Password')).fill('Sup3rSecret!x');
    await page.getByRole('button', { name: 'Create workspace' }).click();
    await expect(formAlert(page)).toContainText(/already exists/i);
  });

  test('forgot password → reset link → sign in with the new password; the link is single-use', async ({ page }) => {
    const email = uniqueEmail('reset');
    await page.goto('/signup');
    await page.getByLabel('Studio name').fill('Reset Studio');
    await page.getByLabel('Your name').fill('Rina Shah');
    await page.getByLabel('Work email').fill(email);
    await page.getByLabel(lbl('Password')).fill('OldPassw0rd!x');
    await page.getByRole('button', { name: 'Create workspace' }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });

    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible();

    const link = await waitForMail('reset-password', email);
    await page.goto(link);
    await page.getByLabel(lbl('New password')).fill('BrandNew#Pass9');
    await page.getByLabel(lbl('Confirm new password')).fill('Mismatch#Pass9');
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page.getByText('The passwords don’t match.')).toBeVisible();
    await page.getByLabel(lbl('Confirm new password')).fill('BrandNew#Pass9');
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page).toHaveURL(/\/login/);

    await signIn(page, email, 'BrandNew#Pass9');
    await page.context().clearCookies();
    await page.goto(link); // used link
    await page.getByLabel(lbl('New password')).fill('AnotherOne#99x');
    await page.getByLabel(lbl('Confirm new password')).fill('AnotherOne#99x');
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(formAlert(page)).toContainText(/invalid or has expired/i);
  });

  test('forgot password never reveals whether an account exists', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill('nobody-here@e2e.test');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible();
  });

  test('bad or missing tokens are handled gracefully', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByRole('heading', { name: /link isn’t valid/ })).toBeVisible();
    await page.goto('/verify-email?token=' + 'x'.repeat(43));
    await expect(page.getByRole('heading', { name: /couldn’t verify/ })).toBeVisible();
  });

  test('login page has no console errors', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
