import { expect, test } from '@playwright/test';
import { trackErrors, lbl } from './helpers';

test.describe('marketing site', () => {
  test('home page tells the story and has no console errors', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/Yowflow/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Every lead, shoot and delivery');
    for (const h of ['The whole studio, in one workspace.', 'From first enquiry to final payment.', 'Questions, answered.']) {
      await expect(page.getByRole('heading', { name: h })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('navbar links reach every public page', async ({ page }) => {
    await page.goto('/');
    for (const [name, url, heading] of [['Features', /\/features$/, /Everything your studio runs on/], ['Pricing', /\/pricing$/, /Simple pricing/], ['Contact', /\/contact$/, /talk about your studio/]] as const) {
      await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name, exact: true }).click();
      await expect(page).toHaveURL(url);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
    }
  });

  test('pricing toggle switches between monthly and yearly prices', async ({ page }) => {
    await page.goto('/pricing');
    const studio = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Studio', exact: true }) });
    await expect(studio).toContainText('₹3,333'); // yearly default: 10 months / 12
    await page.getByRole('radio', { name: /Monthly/ }).click();
    await expect(studio).toContainText('₹3,999');
    await page.getByRole('radio', { name: /Yearly/ }).click();
    await expect(studio).toContainText('Billed ₹39,990 yearly');
  });

  test('plan buttons lead into signup with the chosen plan', async ({ page }) => {
    await page.goto('/pricing');
    await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Starter', exact: true }) }).getByRole('link', { name: 'Start free trial' }).click();
    await expect(page).toHaveURL(/\/signup\?plan=starter/);
  });

  test('FAQ accordion opens and closes with the keyboard', async ({ page }) => {
    await page.goto('/#faq');
    const q = page.getByText('Who owns my data?');
    await q.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Your data is stored in a standard PostgreSQL database')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Your data is stored in a standard PostgreSQL database')).toBeHidden();
  });

  test('contact form validates, then delivers a message', async ({ page }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByText('Tell us your name.')).toBeVisible();
    await expect(page.getByText(/valid email/)).toBeVisible();
    await expect(page.getByText(/at least 10 characters/)).toBeVisible();

    await page.getByLabel(lbl('Name')).fill('Dev Patel');
    await page.getByLabel('Work email').fill('dev@studio.test');
    await page.getByLabel('How can we help?').fill('We run a 12-person wedding studio and want a demo.');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('heading', { name: 'Message received' })).toBeVisible();
  });

  test('legal pages, changelog and about render', async ({ page }) => {
    for (const [path, h] of [['/privacy', 'Privacy policy'], ['/terms', 'Terms of service'], ['/changelog', 'What’s new.'], ['/about', /Software for the business side/]] as const) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(h);
    }
  });

  test('unknown pages show the branded 404', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('different shot');
    await page.getByRole('link', { name: 'Back to home' }).click();
    await expect(page).toHaveURL('/');
  });

  test('SEO files are served', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain('/pricing');
    const robots = await request.get('/robots.txt');
    expect(await robots.text()).toContain('Sitemap:');
    const home = await (await request.get('/')).text();
    expect(home).toContain('application/ld+json');
    expect(home).toContain('og:image');
  });

  test('mobile menu opens and navigates', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'Pricing' }).click();
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible(); // menu closed after navigating
  });
});
