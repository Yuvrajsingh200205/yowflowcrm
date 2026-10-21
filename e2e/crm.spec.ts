import { expect, test } from '@playwright/test';
import { signIn, trackErrors } from './helpers';

test.describe('core CRM flows', () => {
  test.beforeEach(async ({ page }) => { await signIn(page); });

  test('create a lead, find it with filters, and see it in analytics', async ({ page }) => {
    const errors = trackErrors(page);
    const name = `E2E Couple ${Date.now()}`;
    await page.goto('/leads');
    await page.getByRole('button', { name: 'Add Lead' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // validation: mobile number is required
    await dialog.getByRole('button', { name: 'Save Lead Record' }).click();
    await expect(dialog).toBeVisible();

    await dialog.getByPlaceholder(/Aarav & Ishita/).fill(name);
    await dialog.getByPlaceholder('+1 415 555 0132').fill('9876543210');
    await dialog.getByPlaceholder('client@gmail.com').fill('couple@example.com');
    await dialog.getByRole('button', { name: 'Save Lead Record' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText(name)).not.toHaveCount(0);

    // filters narrow the list
    await page.getByLabel('Filter by status').selectOption('contacted');
    await expect(page.getByText(name)).toHaveCount(0);
    await page.getByLabel('Filter by status').selectOption('all');
    await expect(page.getByText(name)).not.toHaveCount(0);

    // analytics view renders
    await page.getByRole('button', { name: 'Analytics' }).click();
    await expect(page.getByText(/Total Leads|Conversion|Pipeline/i).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('leads page: cancel closes the modal without saving', async ({ page }) => {
    await page.goto('/leads');
    await page.getByRole('button', { name: 'Add Lead' }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('projects workspace shows summary figures and filters', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByText(/Total Projects/i).first()).toBeVisible();
    await page.getByRole('tab', { name: /Running/ }).click();
    await expect(page.getByRole('tab', { name: /Running/ })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: /All/ }).click();
    await expect(page.getByRole('tab', { name: /All/ })).toHaveAttribute('aria-selected', 'true');
  });

  test('a seeded project opens its detail view', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('button', { name: /Open Project/i }).first().click();
    await expect(page.getByRole('dialog').or(page.locator('.project-detail-shell')).first()).toBeVisible();
  });

  test('new project page loads its form', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/projects/new');
    await expect(page.getByRole('heading').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('shoots, finance, team and freelancer views render without errors', async ({ page }) => {
    const errors = trackErrors(page);
    for (const path of ['/shoots', '/expenses', '/team', '/freelancers', '/clients', '/equipment', '/data-management', '/roles-permissions']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main').first()).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('API docs are served by the backend', async ({ request }) => {
    const res = await request.get('http://localhost:5051/docs/');
    expect(res.status()).toBe(200);
  });
});
