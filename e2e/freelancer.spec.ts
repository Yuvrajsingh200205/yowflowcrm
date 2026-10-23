import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';
import { expect, test, type Page } from '@playwright/test';
import { lbl, signIn, trackErrors, uniqueEmail } from './helpers';

const FREELANCER_PAGES = ['dashboard', 'assignments', 'availability', 'connections', 'find-vendor', 'notifications', 'payments', 'portfolio', 'profile', 'shoots', 'subscription', 'tasks', 'projects'];
const PHOTO = path.join(__dirname, 'fixtures', 'photo.jpg');
const PASSWORD = 'Freelance#2026';

async function fillJoinForm(page: Page, name: string, email: string, phone: string) {
  await page.getByLabel(/^Full name/).fill(name);
  await page.getByLabel(/^Email/).fill(email);
  await page.getByLabel(/^Mobile/).fill(phone);
  await page.getByLabel(/^Password/, { exact: false }).first().fill(PASSWORD);
  await page.getByLabel(/^Confirm password/).fill(PASSWORD);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel(/^Professional headline/).fill('Candid wedding photographer');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Skills & services').fill('Candid, Lightroom');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel(/^City/).fill('Jaipur');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel(/^Daily rate/).fill('8000');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Submit application' }).click();
}

test.describe('freelancer product, end to end', () => {
  test('join link → application → approval → plan → profile, availability, portfolio', async ({ page, browser }) => {
    test.setTimeout(240_000);
    const email = uniqueEmail('free');
    const phone = `9${Math.floor(100000000 + Math.random() * 899999999)}`;
    const name = `Rohan ${Date.now().toString().slice(-6)}`;
    const planName = `Starter listing ${Date.now().toString().slice(-6)}`;

    // studio shares its join link
    await signIn(page);
    await page.goto('/freelancers');
    await page.getByRole('button', { name: /Applications/ }).first().click();
    const joinLink = (await page.getByTestId('join-link').innerText()).trim();
    expect(joinLink).toContain('/freelancer/join?studio=e2e-studio');

    // freelancer applies through the link
    const fctx = await browser.newContext({ baseURL: 'http://localhost:3002' });
    const fp = await fctx.newPage();
    const errors = trackErrors(fp);
    await fp.goto(new URL(joinLink).pathname + new URL(joinLink).search);
    await expect(fp.getByRole('heading', { level: 1, name: /Join E2E Studio/ })).toBeVisible();
    await fillJoinForm(fp, name, email, phone);
    await expect(fp.getByRole('heading', { name: 'Application submitted' })).toBeVisible();

    // the application is visible to the studio and can be approved
    await page.reload();
    await page.getByRole('button', { name: /Applications/ }).first().click();
    const card = page.getByRole('article', { name: `Application from ${name}` });
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText(new RegExp(`${name} is approved`))).toBeVisible();

    // freelancer signs in and buys a plan
    await fp.goto('/login');
    await fp.getByLabel('Email').fill(email);
    await fp.getByLabel(lbl('Password')).fill(PASSWORD);
    await fp.getByRole('button', { name: 'Sign in' }).click();
    await expect(fp).toHaveURL(/\/freelancer\/dashboard/);

    await fp.goto('/freelancer/subscription');
    await expect(fp.getByText('Listed — Monthly')).toBeVisible();
    await fp.getByRole('button', { name: 'Pay and activate' }).first().click();
    await expect(fp.getByRole('alert').filter({ hasText: /not enabled/i })).toBeVisible(); // payments are not configured on this stack
    // a studio can also publish a free plan
    const plan = await page.request.post('/api/v1/freelancers/plans', { data: { name: planName, slug: `starter-${Date.now()}`, price: 0, billingInterval: 'MONTHLY', description: 'Free to start' } });
    expect(plan.ok(), await plan.text()).toBeTruthy();
    await fp.reload();
    await fp.locator('section', { hasText: planName }).getByRole('button', { name: 'Activate', exact: true }).click();
    await expect(fp.getByText(planName).first()).toBeVisible();
    await expect(fp.getByText(/Active ·/)).toBeVisible();

    // profile: fields save independently and stay saved
    await fp.goto('/freelancer/profile');
    await expect(fp.getByLabel('Name', { exact: true })).toHaveValue(name);
    await expect(fp.getByText('Searchable: Yes')).toBeVisible();
    await fp.getByLabel('About you').fill('Ten years of weddings.');
    await fp.getByLabel('Daily rate (₹)').fill('9500');
    await fp.getByLabel('Equipment').fill('Two bodies, 35mm and 85mm, two flashes');
    await fp.getByRole('button', { name: 'Save profile' }).click();
    await expect(fp.getByText('Profile updated.')).toBeVisible();
    await fp.reload();
    await expect(fp.getByLabel('About you')).toHaveValue('Ten years of weddings.');
    await expect(fp.getByLabel('Daily rate (₹)')).toHaveValue('9500');
    await fp.getByLabel('Professional headline').fill('Cinematic storyteller');
    await fp.getByRole('button', { name: 'Save profile' }).click();
    await expect(fp.getByText('Profile updated.')).toBeVisible();
    await fp.reload();
    await expect(fp.getByLabel('Professional headline')).toHaveValue('Cinematic storyteller');
    await expect(fp.getByLabel('About you')).toHaveValue('Ten years of weddings.'); // editing the headline did not wipe the bio
    await fp.getByLabel('Email', { exact: true }).fill('not-an-email');
    await fp.getByRole('button', { name: 'Save profile' }).click();
    await expect(fp.getByRole('alert').filter({ hasText: /valid email/i })).toBeVisible();

    // availability
    await fp.goto('/freelancer/availability');
    await fp.getByRole('button', { name: /^15\b/ }).first().click();
    await fp.getByRole('button', { name: 'Unavailable', exact: true }).click();
    await fp.getByRole('button', { name: /Save/ }).last().click();
    await expect(fp.getByRole('button', { name: /^15\s*Unavailable/ }).first()).toBeVisible();

    // portfolio upload with a real image
    await fp.goto('/freelancer/portfolio');
    await fp.locator('input[type=file]').setInputFiles(PHOTO);
    await fp.getByRole('button', { name: 'Add to portfolio' }).click();
    await expect(fp.getByText('Added to your portfolio.')).toBeVisible();
    const img = fp.locator('main img').first();
    await expect(img).toBeVisible();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), { timeout: 15_000 }).toBe(true);
    await fp.getByRole('button', { name: 'Hide from studios' }).click();
    await expect(fp.getByRole('button', { name: 'Show to studios' })).toBeVisible();
    fp.once('dialog', (d) => d.accept());
    await fp.getByRole('button', { name: /^Remove / }).click();
    await expect(fp.getByText('No work samples yet')).toBeVisible();

    // a listed freelancer is found by the studio, who marks interest; the freelancer accepts
    await page.goto('/freelancers');
    await page.getByRole('button', { name: /Find Freelancer/ }).first().click();
    await page.getByPlaceholder('Name, city, skill').fill(name);
    await page.getByRole('button', { name: 'Search', exact: true }).last().click();
    const found = page.locator('article').filter({ hasText: name });
    await expect(found).toBeVisible();
    await found.getByRole('button', { name: 'Interested' }).click();
    await page.getByRole('button', { name: /^Interested/ }).first().click();
    await expect(page.getByText(name).first()).toBeVisible();

    await fp.goto('/freelancer/connections');
    await expect(fp.getByRole('button', { name: 'Accept' }).first()).toBeVisible();
    await fp.getByRole('button', { name: 'Accept' }).first().click();
    await expect(fp.getByRole('button', { name: 'Accept' })).toHaveCount(0);

    expect(errors.filter((e) => !/40[0-9]|503/.test(e))).toEqual([]);
    await fctx.close();
  });

  test('every freelancer page loads cleanly and is accessible', async ({ page }) => {
    test.setTimeout(180_000);
    const email = uniqueEmail('free');
    const phone = `9${Math.floor(100000000 + Math.random() * 899999999)}`;
    const res = await page.request.post('/api/v1/freelancer-portal/applications', { data: { studio: 'e2e-studio', fullName: 'Meera Nair', phone, email, password: PASSWORD, confirmPassword: PASSWORD, city: 'Pune', primarySkill: 'CINEMATOGRAPHER', experienceYears: 5, expectedRate: '9000' } });
    expect(res.ok(), await res.text()).toBeTruthy();
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel(lbl('Password')).fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/freelancer\/dashboard/);

    const errors = trackErrors(page);
    const failed: string[] = [];
    page.on('response', (r) => { if (r.url().includes('/api/v1/') && r.status() >= 400 && r.status() !== 401) failed.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`); });
    const report: string[] = [];
    fs.mkdirSync(path.join(__dirname, '.artifacts', 'fl'), { recursive: true });
    for (const p of FREELANCER_PAGES) {
      await page.goto(`/freelancer/${p}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(400);
      if (/something went wrong|application error|could not load/i.test(await page.locator('body').innerText())) report.push(`${p}: error text on page`);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      for (const v of axe.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical')) report.push(`${p}: ${v.id} ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
      if (new URL(page.url()).pathname !== `/freelancer/${p}`) report.push(`${p}: redirected to ${page.url()}`);
    }
    expect(report).toEqual([]);
    expect(failed).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('join page without a studio link explains what to do, and an unknown studio is a clear error', async ({ page }) => {
    await page.goto('/freelancer/join?studio=no-such-studio');
    await expect(page.getByRole('heading', { name: 'Ask your studio for its join link' })).toBeVisible();
    await expect(page.getByText(/could not find that studio/i)).toBeVisible();
  });
});
