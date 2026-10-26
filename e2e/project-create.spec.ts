import { expect, test, type Page } from '@playwright/test';
import { signIn } from './helpers';

/**
 * A project is saved all at once or not at all. When something goes wrong, the studio fixes it and presses Save
 * again: it must never find a project that was "already created" by the failed try.
 */
test.describe('creating a project is all or nothing', () => {
  test.beforeEach(async ({ page }) => { await signIn(page); });

  async function fillForm(page: Page, title: string, phone: string) {
    await page.goto('/projects/new');
    await page.getByPlaceholder('e.g. Vikram & Meera Royal Wedding').fill(title);
    await page.getByPlaceholder('+1 415 555 0132').fill(phone);
    await page.getByRole('button', { name: /^2\s*Budget/ }).click();
    await page.getByPlaceholder('e.g. 350000').fill('200000');
    await page.getByPlaceholder('e.g. 100000').fill('50000');
    await page.getByRole('button', { name: /^5\s*Tasks/ }).click();
  }

  const projectsNamed = async (page: Page, title: string) => (await (await page.request.get(`/api/v1/projects?search=${encodeURIComponent(title)}&limit=10`)).json()).data as Array<{ id: string; name: string }>;

  test('a rejected save leaves nothing behind, and saving again after the fix makes exactly one project', async ({ page }) => {
    const stamp = Date.now();
    const title = `Atomic Couple ${stamp}`;
    const keys: Array<string | undefined> = [];
    let spoiled = false;
    await page.route('**/api/v1/projects', async (route) => {
      const request = route.request();
      if (request.method() !== 'POST') { await route.continue(); return; }
      keys.push(request.headers()['idempotency-key']);
      if (!spoiled) {
        // The first try goes out with an advance the server will not accept.
        spoiled = true;
        const body = JSON.parse(request.postData() ?? '{}');
        body.advancePayment = { ...body.advancePayment, amount: 0 };
        await route.continue({ postData: JSON.stringify(body) });
        return;
      }
      await route.continue();
    });

    await fillForm(page, title, `9${String(stamp).slice(-9)}`);
    await page.getByRole('button', { name: 'Save & Create Project' }).click();
    await expect(page.getByText('Enter an amount above zero').first()).toBeVisible();
    await expect(page).toHaveURL(/\/projects\/new$/);
    // The server refused it, so there is no half-made project to find.
    expect(await projectsNamed(page, title)).toHaveLength(0);

    // Nothing needs fixing in the form itself here, so pressing Save again is the "fix, then retry".
    await page.getByRole('button', { name: 'Save & Create Project' }).click();
    await expect(page).toHaveURL(/\/projects$/);
    const made = await projectsNamed(page, title);
    expect(made).toHaveLength(1);
    const payments = (await (await page.request.get(`/api/v1/payments?projectId=${made[0].id}`)).json()).data as Array<{ amount: string }>;
    expect(payments.map((p) => Number(p.amount))).toEqual([50000]);
    expect(keys).toHaveLength(2);
    expect(keys[0]).toMatch(/^project-/);
  });

  test('a save whose answer is lost does not make a second project when pressed again', async ({ page }) => {
    const stamp = Date.now();
    const title = `Lost Answer ${stamp}`;
    const replayed: string[] = [];
    let dropped = false;
    page.on('response', (r) => { if (r.url().endsWith('/api/v1/projects') && r.request().method() === 'POST' && r.headers()['idempotency-replayed']) replayed.push(r.headers()['idempotency-replayed']); });
    await page.route('**/api/v1/projects', async (route) => {
      if (route.request().method() === 'POST' && !dropped) {
        dropped = true;
        await route.fetch(); // the server saves the project...
        await route.abort('connectionreset'); // ...but the answer never reaches the browser
        return;
      }
      await route.continue();
    });

    await fillForm(page, title, `9${String(stamp).slice(-9)}`);
    await page.getByRole('button', { name: 'Save & Create Project' }).click();
    await expect(page.getByText(/Unable to reach|try again/i).first()).toBeVisible();
    await page.getByRole('button', { name: 'Save & Create Project' }).click();
    await expect(page).toHaveURL(/\/projects$/);
    expect(await projectsNamed(page, title)).toHaveLength(1);
    expect(replayed).toEqual(['true']);
  });
});
