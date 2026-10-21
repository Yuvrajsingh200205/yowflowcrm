import fs from 'fs';
import path from 'path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { OWNER, lbl, signIn, trackErrors, uniqueEmail, waitForMail } from './helpers';

// A real 640x420 JPEG so the backend's thumbnail pipeline runs on genuine image bytes.
const JPEG = fs.readFileSync(path.join(__dirname, 'fixtures', 'photo.jpg'));

const PORTAL_PASSWORD = 'Portal#Pass2026x';
const api = async <T>(request: APIRequestContext, method: 'post' | 'patch' | 'get', path: string, data?: unknown): Promise<T> => {
  const res = await request[method](`/api/v1${path}`, data === undefined ? {} : { data });
  expect(res.ok(), `${method.toUpperCase()} ${path} → ${res.status()} ${await res.text()}`).toBeTruthy();
  return (await res.json()).data as T;
};

async function upload(request: APIRequestContext, projectId: string, name: string, section: string) {
  const intent = await api<{ bucket: string; objectKey: string; uploadUrl: string; requiredHeaders: Record<string, string> }>(request, 'post', `/projects/${projectId}/gallery/upload-intent`, { originalName: name, mimeType: 'image/jpeg' });
  // The signed storage URL is absolute (it points at the API origin), exactly as the browser uses it.
  const put = await request.put(intent.uploadUrl, { headers: { ...intent.requiredHeaders, 'content-type': 'image/jpeg' }, data: JPEG });
  expect(put.status()).toBeLessThan(300);
  await api(request, 'post', `/projects/${projectId}/gallery/media`, { originalName: name, mimeType: 'image/jpeg', bucket: intent.bucket, objectKey: intent.objectKey, sizeBytes: JPEG.length, sectionName: section });
}


/** Published gallery with `photos` images, an invited + signed-in couple. Everything via the API for speed. */
async function publishedPortal(page: Page, browser: import('@playwright/test').Browser, photos: number) {
  const email = uniqueEmail('couple');
  const title = `Scale Couple ${Date.now()}`;
  await signIn(page);
  const client = await api<{ id: string }>(page.request, 'post', '/clients', { displayName: title, primaryPhone: '9812345679', primaryEmail: email });
  const project = await api<{ id: string }>(page.request, 'post', '/projects', { clientId: client.id, name: title, type: 'WEDDING', weddingDate: '2027-02-10', totalQuotation: '120000.00', events: [{ name: 'Reception', eventDate: '2027-02-10', venueName: 'Taj' }] });
  const batch = 6;
  for (let i = 0; i < photos; i += batch) {
    await Promise.all(Array.from({ length: Math.min(batch, photos - i) }, (_, k) => upload(page.request, project.id, `p-${i + k}.jpg`, 'Reception')));
  }
  await api(page.request, 'patch', `/projects/${project.id}/gallery`, { status: 'PUBLISHED', albumSelectionTarget: 20 });
  await api(page.request, 'post', `/clients/${client.id}/portal-access`, { email, fullName: 'Isha Rao' });
  const link = await waitForMail('accept-invite', email);
  const token = new URL(link, 'http://x').searchParams.get('token')!;
  const context = await browser.newContext({ baseURL: 'http://localhost:3002' });
  const accept = await context.request.post(`/api/v1/portal/auth/invite/${token}/accept`, { data: { password: PORTAL_PASSWORD } });
  expect(accept.ok()).toBeTruthy();
  return { context, projectId: project.id, title, cp: await context.newPage() };
}

test.describe('client portal, end to end', () => {
  test('studio invites the couple, publishes the gallery, and the couple uses it', async ({ page, browser, request }) => {
    test.setTimeout(180_000);
    const email = uniqueEmail('couple');
    const title = `Portal Couple ${Date.now()}`;

    // ── Studio: set up a client + project with photographs, through the API for speed ──
    await signIn(page);
    const client = await api<{ id: string }>(page.request, 'post', '/clients', { displayName: title, primaryPhone: '9812345678', primaryEmail: email });
    const project = await api<{ id: string }>(page.request, 'post', '/projects', {
      clientId: client.id, name: title, type: 'WEDDING', weddingDate: '2027-01-20', totalQuotation: '300000.00',
      events: [{ name: 'Wedding Ceremony', eventDate: '2027-01-20', venueName: 'The Leela' }],
    });
    for (let i = 0; i < 4; i++) await upload(page.request, project.id, `wedding-${i}.jpg`, 'Wedding');
    await upload(page.request, project.id, 'private-0.jpg', 'Private');

    // ── Studio UI: invite, then publish ──
    await page.goto('/clients');
    await page.getByLabel('Search clients').fill(title);
    await page.getByRole('button', { name: /Portal access/ }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Not published yet')).toBeVisible();

    // hide the private section and allow downloads in the wedding section
    await dialog.getByRole('listitem').filter({ hasText: 'Private' }).getByLabel('Visible to client').uncheck();
    await dialog.getByRole('listitem').filter({ hasText: 'Wedding' }).getByLabel('Allow downloads').check();
    await dialog.getByRole('listitem').filter({ hasText: 'Wedding' }).getByLabel('Allow sharing').check();
    await dialog.getByLabel('Album photographs to choose').fill('2');
    await dialog.getByLabel('Welcome message').fill('Congratulations from all of us!');
    await dialog.getByRole('button', { name: 'Save settings' }).click();
    await expect(page.getByText('Gallery settings saved')).toBeVisible();

    await dialog.getByRole('tab', { name: 'Access' }).click();
    await dialog.getByLabel(lbl('Name')).fill('Aarav Sharma');
    await dialog.getByLabel(lbl('Email')).fill(email);
    await dialog.getByRole('button', { name: 'Send invite' }).click();
    await expect(dialog.getByText(email)).toBeVisible();

    await dialog.getByRole('tab', { name: 'Gallery' }).click();
    page.once('dialog', (d) => d.accept());
    await dialog.getByRole('button', { name: 'Publish and notify' }).click();
    await expect(dialog.getByText('Published to the portal')).toBeVisible();
    await page.keyboard.press('Escape');

    // ── Couple: accept the invite from the e-mailed link, in a fresh browser ──
    const couple = await browser.newContext({ baseURL: 'http://localhost:3002' });
    const cp = await couple.newPage();
    const errors = trackErrors(cp);
    await cp.goto(await waitForMail('accept-invite', email));
    await expect(cp.getByRole('heading', { name: /Hello, Aarav/ })).toBeVisible();
    await cp.getByLabel(lbl('Create a password')).fill(PORTAL_PASSWORD);
    await cp.getByLabel(lbl('Confirm password')).fill(PORTAL_PASSWORD);
    await cp.getByRole('button', { name: 'Set password and continue' }).click();
    await expect(cp).toHaveURL(/\/client$/);
    await expect(cp.getByRole('heading', { name: /Welcome/ })).toBeVisible();
    await expect(cp.getByText(/photographs ready/)).toBeVisible();

    // overview, payments
    await cp.getByRole('link', { name: new RegExp(title) }).click();
    await expect(cp).toHaveURL(/\/client\/projects\//);
    await expect(cp.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(cp.getByText('Wedding Ceremony')).toBeVisible();
    await cp.getByRole('tab', { name: 'payments' }).click();
    await expect(cp.getByText('₹3,00,000').first()).toBeVisible();

    // gallery: the hidden section never appears
    await cp.getByRole('tab', { name: 'gallery' }).click();
    await expect(cp.getByText('Congratulations from all of us!')).toBeVisible();
    await expect(cp.getByRole('group', { name: 'Sections' }).getByRole('button', { name: /Wedding/ })).toBeVisible();
    await expect(cp.getByRole('group', { name: 'Sections' }).getByRole('button', { name: /Private/ })).toHaveCount(0);
    const photos = cp.getByRole('list', { name: 'Photographs' }).getByRole('listitem');
    await expect(photos).toHaveCount(4);
    await expect(photos.first().locator('img')).toHaveJSProperty('complete', true);

    // favourites and album picks (cap = 2) with live counters
    const grid = cp.getByRole('list', { name: 'Photographs' });
    await grid.getByRole('button', { name: 'Add to favourites' }).first().click({ force: true });
    await expect(cp.getByText(/1 favourite/)).toBeVisible();
    for (let i = 0; i < 2; i++) await grid.getByRole('button', { name: 'Add to album' }).first().click({ force: true });
    await expect(cp.getByText('2 of 2 album photographs')).toBeVisible();
    await grid.getByRole('button', { name: 'Add to album' }).first().click({ force: true });
    await expect(cp.getByText('Your album is full')).toBeVisible();
    await cp.getByRole('button', { name: 'Send selection to studio' }).click();
    await expect(cp.getByText('Album selection sent')).toBeVisible();

    // favourites filter
    await cp.getByRole('group', { name: 'Filter photographs' }).getByRole('button', { name: 'Favourites' }).click();
    await expect(photos).toHaveCount(1);
    await cp.getByRole('group', { name: 'Filter photographs' }).getByRole('button', { name: 'All' }).click();
    await expect(photos).toHaveCount(4);

    // lightbox: keyboard navigation, note to studio, download allowed
    await grid.getByRole('button', { name: /^Open/ }).first().click();
    const lightbox = cp.getByRole('dialog');
    await expect(lightbox.getByRole('img')).toBeVisible();
    await cp.keyboard.press('ArrowRight');
    await expect(lightbox.getByText('2 / 4')).toBeVisible();
    await expect(lightbox.getByRole('button', { name: 'Download original' })).toBeVisible();
    await lightbox.getByRole('button', { name: 'Notes for the studio' }).click();
    await lightbox.getByLabel('Your note').fill('Please brighten this one');
    await lightbox.getByRole('button', { name: 'Send to studio' }).click();
    await expect(lightbox.getByText('Please brighten this one')).toBeVisible();
    await cp.keyboard.press('Escape');
    await expect(cp.getByRole('dialog')).toHaveCount(0);

    // request
    await cp.getByRole('tab', { name: 'requests' }).click();
    await cp.getByRole('button', { name: 'New request' }).first().click();
    const rd = cp.getByRole('dialog');
    await rd.getByLabel(lbl('Title')).fill('Change the highlight song');
    await rd.getByLabel(lbl('Details')).fill('Please use the second song in the highlight film.');
    await rd.getByRole('button', { name: 'Send request' }).click();
    await expect(cp.getByText('Change the highlight song')).toBeVisible();

    // sharing
    await cp.getByRole('tab', { name: 'sharing' }).click();
    await cp.getByRole('button', { name: 'New link' }).first().click();
    await cp.getByRole('dialog').getByLabel(lbl('Name')).fill('For the family');
    await cp.getByRole('dialog').getByRole('button', { name: 'Create and copy' }).click();
    await expect(cp.getByText('For the family')).toBeVisible();

    // ── Studio sees the activity and replies ──
    await page.goto('/clients');
    await page.getByLabel('Search clients').fill(title);
    await page.getByRole('button', { name: /Portal access/ }).first().click();
    const sd = page.getByRole('dialog');
    await sd.getByRole('tab', { name: 'Activity' }).click();
    await expect(sd.getByText('Change the highlight song', { exact: true })).toBeVisible();
    await expect(sd.getByText('Please brighten this one')).toBeVisible();
    await expect(sd.getByText('Album selection (2)')).toBeVisible();
    await sd.getByLabel('Reply to Change the highlight song').fill('Done, the new song is in.');
    await sd.getByRole('button', { name: 'Reply' }).first().click();
    await expect(page.getByText('Reply sent').first()).toBeVisible();

    // ── Couple sees the reply and the notification ──
    await cp.reload();
    await cp.getByRole('tab', { name: 'requests' }).click();
    await expect(cp.getByText('Done, the new song is in.')).toBeVisible();
    await cp.getByRole('link', { name: /Notifications/ }).click();
    await expect(cp.getByText(/Update on your request/)).toBeVisible();
    await cp.getByRole('button', { name: 'Mark all as read' }).click();
    await expect(cp.getByRole('button', { name: 'Mark all as read' })).toHaveCount(0);

    // sign out → protected pages bounce to login; staff session is untouched
    await cp.getByRole('button', { name: 'Sign out' }).click();
    await expect(cp).toHaveURL(/\/client\/login/);
    await cp.goto('/client');
    await expect(cp).toHaveURL(/\/client\/login/);
    expect(errors).toEqual([]);
    await couple.close();
    void OWNER; void request;
  });

  test('login screen: wrong password, then right password; staff cookies cannot open the portal', async ({ page, browser }) => {
    await page.goto('/client/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Enter the email your studio invited.')).toBeVisible();
    await page.getByLabel(lbl('Email')).fill('nobody@e2e.test');
    await page.getByLabel(lbl('Password')).fill('WrongPassword#1');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert').filter({ hasText: /./ }).first()).toBeVisible();
    await expect(page).toHaveURL(/\/client\/login/);

    // a signed-in studio user has no portal session
    const staff = await browser.newContext({ baseURL: 'http://localhost:3002' });
    const sp = await staff.newPage();
    await signIn(sp);
    await sp.goto('/client');
    await expect(sp).toHaveURL(/\/client\/login/);
    await staff.close();
  });

  test('an invalid invitation link explains itself', async ({ page }) => {
    await page.goto(`/client/accept-invite?token=${'x'.repeat(43)}`);
    await expect(page.getByRole('heading', { name: /invitation link has expired/i })).toBeVisible();
  });

  test('portal screens are accessible and fit a 375px phone', async ({ page, browser }) => {
    test.setTimeout(120_000);
    const { context, cp, projectId } = await publishedPortal(page, browser, 6);
    await cp.setViewportSize({ width: 375, height: 800 });
    const targets = ['/client', `/client/projects/${projectId}`, `/client/projects/${projectId}?tab=gallery`, `/client/projects/${projectId}?tab=payments`, `/client/projects/${projectId}?tab=requests`, `/client/projects/${projectId}?tab=sharing`, '/client/notifications'];
    for (const url of targets) {
      await cp.goto(url);
      await cp.waitForLoadState('networkidle');
      await cp.waitForTimeout(400);
      const overflow = await cp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${url} scrolls sideways`).toBeLessThanOrEqual(1);
      const results = await new AxeBuilder({ page: cp }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${url} ${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    }
    for (const url of ['/client/login', '/client/forgot-password']) {
      const anon = await browser.newContext({ baseURL: 'http://localhost:3002', viewport: { width: 375, height: 800 } });
      const fresh = await anon.newPage();
      await fresh.goto(url);
      const results = await new AxeBuilder({ page: fresh }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${url} ${v.id}`)).toEqual([]);
      await anon.close();
    }
    await context.close();
  });

  test('a large gallery loads in pages and stays fast', async ({ page, browser }) => {
    test.setTimeout(240_000);
    const COUNT = 130;
    const { context, cp, projectId } = await publishedPortal(page, browser, COUNT);
    const requests: string[] = [];
    cp.on('request', (r) => { if (r.url().includes('/gallery/media')) requests.push(r.url()); });
    const started = Date.now();
    await cp.goto(`/client/projects/${projectId}?tab=gallery`);
    const photos = cp.getByRole('list', { name: 'Photographs' }).getByRole('listitem');
    await expect(photos).toHaveCount(48);
    expect(Date.now() - started, 'first page of photographs').toBeLessThan(5_000);
    // the browser only decodes what it needs: thumbnails, never originals
    const sizes = await cp.evaluate(() => performance.getEntriesByType('resource').filter((e) => /\/files\//.test(e.name)).map((e) => (e as PerformanceResourceTiming).transferSize));
    expect(Math.max(0, ...sizes)).toBeLessThan(60_000);
    // scrolling pulls the following pages, with no duplicates, until everything is there
    for (let i = 0; i < 6 && (await photos.count()) < COUNT; i++) { await cp.mouse.wheel(0, 20_000); await cp.waitForTimeout(600); }
    await expect(photos).toHaveCount(COUNT);
    const ids = await photos.evaluateAll((els) => els.map((e) => e.querySelector('img')?.getAttribute('src') ?? ''));
    expect(new Set(ids).size).toBe(COUNT);
    expect(requests.length).toBeGreaterThanOrEqual(3);
    // photographs below the fold are lazy
    expect(await photos.nth(COUNT - 1).locator('img').getAttribute('loading')).toBe('lazy');
    await context.close();
  });

  test('a shared link opens in one click for anyone: paged gallery, lightbox, password, revoke', async ({ page, browser }) => {
    test.setTimeout(180_000);
    const { context, projectId } = await publishedPortal(page, browser, 60);
    const open = await api<{ id: string; token: string }>(page.request, 'post', `/projects/${projectId}/gallery/share-links`, { title: 'For family', accessType: 'VIEW_DOWNLOAD' });
    const locked = await api<{ id: string; token: string }>(page.request, 'post', `/projects/${projectId}/gallery/share-links`, { title: 'Private', accessType: 'VIEW_ONLY', password: 'Family#2026' });

    const guest = await browser.newContext({ baseURL: 'http://localhost:3002', viewport: { width: 375, height: 800 } });
    const gp = await guest.newPage();
    const errors = trackErrors(gp);
    await gp.goto(`/share/${open.token}`);
    await expect(gp.getByRole('heading', { level: 1 })).toBeVisible();
    const photos = gp.getByRole('list', { name: 'Photographs' }).getByRole('listitem');
    await expect(photos).toHaveCount(48);
    expect(await gp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await gp.mouse.wheel(0, 20_000);
    await expect(photos).toHaveCount(60);
    const axe = await new AxeBuilder({ page: gp }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);

    await photos.first().getByRole('button').click();
    const lb = gp.getByRole('dialog');
    await expect(lb.getByRole('img')).toBeVisible();
    await gp.keyboard.press('ArrowRight');
    await expect(lb.getByText('2 / 60')).toBeVisible();
    await expect(lb.getByRole('button', { name: 'Download original' })).toBeVisible();
    await gp.keyboard.press('Escape');

    // password gate
    await gp.goto(`/share/${locked.token}`);
    await expect(gp.getByRole('heading', { name: 'This gallery is private' })).toBeVisible();
    await gp.getByLabel(lbl('Password')).fill('wrong');
    await gp.getByRole('button', { name: 'View gallery' }).click();
    await expect(gp.getByText('That password isn’t correct.')).toBeVisible();
    await gp.getByLabel(lbl('Password')).fill('Family#2026');
    await gp.getByRole('button', { name: 'View gallery' }).click();
    await expect(photos.first()).toBeVisible();
    await expect(gp.getByRole('button', { name: 'Download original' })).toHaveCount(0);

    // revoked and unknown links say so plainly
    await api(page.request, 'post', `/projects/${projectId}/gallery/share-links`, { title: 'tmp', accessType: 'VIEW_ONLY' });
    const del = await page.request.delete(`/api/v1/projects/${projectId}/gallery/share-links/${open.id}`);
    expect(del.ok()).toBeTruthy();
    await gp.goto(`/share/${open.token}`);
    await expect(gp.getByRole('heading', { name: 'This link was turned off' })).toBeVisible();
    await gp.goto('/share/doesnotexist1234');
    await expect(gp.getByRole('heading', { name: /couldn’t find this gallery/ })).toBeVisible();
    expect(errors.filter((e) => !/40[134]/.test(e))).toEqual([]);
    await guest.close(); await context.close();
  });

  test('the original client gallery, Photos upload and Portal access all still work from Clients', async ({ page, context }) => {
    test.setTimeout(120_000);
    const errors = trackErrors(page);
    await signIn(page);
    const title = `Legacy Couple ${Date.now()}`;
    const client = await api<{ id: string }>(page.request, 'post', '/clients', { displayName: title, primaryPhone: '9812345611', primaryEmail: uniqueEmail('legacy') });
    const project = await api<{ id: string }>(page.request, 'post', '/projects', { clientId: client.id, name: title, type: 'WEDDING', weddingDate: '2027-03-01', totalQuotation: '90000.00' });
    await upload(page.request, project.id, 'legacy-0.jpg', 'Haldi');

    await page.goto('/clients');
    await page.getByLabel('Search clients').fill(title);
    const card = page.locator('article').filter({ hasText: title }).first();
    await expect(card).toBeVisible();

    // Photos modal (studio upload manager)
    await card.getByRole('button', { name: /Photos/ }).click();
    await expect(page.getByText('1 file in this gallery')).toBeVisible();
    await page.getByRole('button', { name: 'Done' }).click();

    // Portal access (new portal manager)
    await card.getByRole('button', { name: /Portal access/ }).click();
    await expect(page.getByRole('dialog').getByRole('tab', { name: 'Gallery' })).toBeVisible();
    await page.keyboard.press('Escape');

    // Open Portal → the original gallery page
    const popup = context.waitForEvent('page');
    await card.getByRole('button', { name: /Open Portal/ }).click();
    const gallery = await popup;
    await gallery.waitForLoadState('networkidle');
    await expect(gallery).toHaveURL(/\/client-gallery\//);
    await expect(gallery.getByText(/Application error|Something went wrong/i)).toHaveCount(0);
    await expect(gallery.locator('body')).not.toBeEmpty();
    expect(errors).toEqual([]);
  });
});
