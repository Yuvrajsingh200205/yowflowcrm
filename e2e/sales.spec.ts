import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { lbl, signIn, trackErrors } from './helpers';

const SLUG = 'e2e-studio';
const SHOTS = path.join(__dirname, '.artifacts', 'screenshots');
const DAY = 86_400_000;

/** A date `days` from now, as the pieces the calendar labels are made of (UTC, like the app). */
function dateIn(days: number) {
  const d = new Date(Date.now() + days * DAY);
  const weekday = d.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'UTC' });
  const month = d.toLocaleDateString('en-IN', { month: 'long', timeZone: 'UTC' });
  return { ymd: d.toISOString().slice(0, 10), label: `${weekday}, ${d.getUTCDate()} ${month} ${d.getUTCFullYear()}` };
}

async function shot(page: Page, name: string, fullPage = true) {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `sales-${name}.png`), fullPage, animations: 'disabled' });
}

/** Walks the customer calendar to a date and picks it. */
async function pickDate(page: Page, label: string) {
  const day = page.getByRole('button', { name: new RegExp(`^${label}, (available|limited)`) });
  for (let i = 0; i < 18 && !(await day.isVisible()); i++) {
    await page.getByRole('button', { name: 'Next month' }).click();
    await page.waitForTimeout(250);
  }
  await expect(day).toBeVisible();
  await day.click();
}

async function fillEnquiry(page: Page, o: { label: string; name: string; phone: string; email?: string; pkg: RegExp; days?: string; addon?: RegExp }) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await pickDate(page, o.label);
  if (o.days) await page.getByLabel('How many days?').selectOption(o.days);
  await page.getByRole('radio', { name: o.pkg }).check();
  if (o.addon) await page.getByRole('checkbox', { name: o.addon }).check();
  await page.getByLabel(/^Your name/).fill(o.name);
  await page.getByLabel(/^Mobile number/).fill(o.phone);
  if (o.email) await page.getByLabel(/^Email/).fill(o.email);
  await page.getByRole('checkbox', { name: /I agree that E2E Studio may contact me/ }).check();
}

async function setQuoteMode(page: Page, mode: RegExp) {
  await page.goto('/sales-setup');
  await page.getByRole('tab', { name: 'Booking page' }).click();
  await page.getByRole('radio', { name: mode }).check();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Booking page saved')).toBeVisible();
}

const shared: { quoteUrl?: string; declineUrl?: string } = {};

test.describe.serial('quote in seconds', () => {
  test('owner sets up the price list, business details, closed dates and the booking page', async ({ page }) => {
    const errors = trackErrors(page);
    await signIn(page);
    await page.goto('/sales-setup');
    await expect(page.getByRole('heading', { level: 2, name: 'Sales setup' })).toBeVisible();

    // An empty price list offers a starter set.
    await expect(page.getByText('Your price list is empty')).toBeVisible();
    await shot(page, 'setup-empty');
    await page.getByRole('button', { name: 'Use starter packages' }).click();
    await expect(page.getByText('Wedding Signature').first()).toBeVisible();
    await expect(page.getByText('Drone coverage').first()).toBeVisible();

    // Validation on the package form, then a real edit.
    await page.getByRole('button', { name: 'Add package' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Add package' }).click();
    await expect(dialog.getByText('Give it a name of at least 2 letters.')).toBeVisible();
    await expect(dialog.getByText('Enter the price (0 if it is included free).')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Edit Wedding Essentials' }).click();
    await page.getByRole('dialog').getByLabel(/^Price per day/).fill('50000');
    await page.getByRole('dialog').getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Wedding Essentials updated')).toBeVisible();
    await expect(page.getByText('₹50,000').first()).toBeVisible();
    await shot(page, 'setup-packages');

    // Business details and payments.
    await page.getByRole('tab', { name: 'Business & payments' }).click();
    await page.getByLabel('Phone', { exact: true }).fill('+91 98765 43210');
    await page.getByLabel('Email', { exact: true }).fill('hello@e2e-studio.test');
    await page.getByLabel('City', { exact: true }).fill('Pune');
    await page.getByLabel('GSTIN').fill('27ABCDE1234F1Z5');
    await page.getByLabel('UPI ID').fill('e2estudio@okhdfc');
    await page.getByLabel('Account holder name').fill('E2E Studio');
    await page.getByLabel('Bank name').fill('HDFC Bank');
    await page.getByLabel('Account number').fill('50100123456789');
    await page.getByLabel('IFSC code').fill('hdfc0001234');
    await page.getByLabel('Colour', { exact: true }).fill('#2f6f4f');
    // A bad UPI id is explained, not silently accepted.
    await page.getByLabel('UPI ID').fill('not a upi');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Enter a UPI ID like name@bank.')).toBeVisible();
    await page.getByLabel('UPI ID').fill('e2estudio@okhdfc');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Business details saved')).toBeVisible();
    await shot(page, 'setup-business');

    // Closed dates.
    await page.getByRole('tab', { name: 'Availability' }).click();
    await page.getByLabel(lbl('From')).fill('2027-03-10');
    await page.getByLabel(lbl('To')).fill('2027-03-12');
    await page.getByLabel(/^Reason/).fill('Family function');
    await page.getByRole('button', { name: 'Close dates' }).click();
    await expect(page.getByText('10 Mar 2027 to 12 Mar 2027')).toBeVisible();
    await shot(page, 'setup-availability');

    // The booking page: switch it on and send quotes instantly.
    await page.getByRole('tab', { name: 'Booking page' }).click();
    await expect(page.getByText('Switched off', { exact: true })).toBeVisible();
    await page.getByRole('switch', { name: 'Booking page is on' }).click();
    await page.getByRole('radio', { name: /Send the quote instantly/ }).check();
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Booking page saved')).toBeVisible();
    await expect(page.getByRole('tabpanel').getByText('Live', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Link customers open')).toHaveValue(new RegExp(`/enquire/${SLUG}$`));
    await expect(page.getByRole('img', { name: /QR code/ })).toBeVisible();
    await shot(page, 'setup-booking');
    expect(errors).toEqual([]);
  });

  test('a customer picks a date and package and gets a quote instantly, then accepts it', async ({ page }) => {
    const errors = trackErrors(page);
    const date = dateIn(75);
    await page.goto(`/enquire/${SLUG}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('E2E Studio');
    await shot(page, 'enquire-top', false);

    // Leaving things out is explained, field by field.
    await page.getByRole('button', { name: 'Get my quote now' }).click();
    // (the first message is also read out in a notice, hence .first())
    await expect(page.getByText('Pick your date from the calendar.').first()).toBeVisible();
    await expect(page.getByText('Enter your name.').first()).toBeVisible();

    await fillEnquiry(page, { label: date.label, name: 'Riya Kapoor', phone: '+91 98123 45678', email: 'riya@example.test', pkg: /Wedding Signature/, days: '2', addon: /Drone coverage/ });
    // 85,000 x 2 days + 12,000 drone = 1,82,000, plus 18% GST.
    await expect(page.getByText('₹2,14,760')).toBeVisible();
    await shot(page, 'enquire-filled');
    await page.getByRole('button', { name: 'Get my quote now' }).click();

    await page.waitForURL(/\/quote\/[A-Za-z0-9_-]{20,}/);
    shared.quoteUrl = page.url();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hello, Riya');
    await expect(page.getByText('Wedding Signature').first()).toBeVisible();
    await expect(page.getByText('₹2,14,760').first()).toBeVisible();
    await shot(page, 'quote-top');

    // The customer switches an add-on on and off; the server re-prices each time.
    const extra = page.getByRole('switch', { name: 'Include Pre-wedding shoot' });
    await extra.click();
    await expect(page.getByText('₹2,44,260').first()).toBeVisible();
    await extra.click();
    await expect(page.getByText('₹2,14,760').first()).toBeVisible();
    await expect(page.getByText('Advance (30%)')).toBeVisible();

    // Accepting needs a typed name and the box ticked.
    await page.getByRole('button', { name: 'Accept quotation' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Confirm booking' }).click();
    await expect(dialog.getByText('Type your full name to accept.')).toBeVisible();
    await expect(dialog.getByText('Please confirm that you agree to the quotation and its terms.')).toBeVisible();
    await dialog.getByLabel(/^Your full name/).fill('Riya Kapoor');
    await dialog.getByRole('checkbox', { name: /I agree to this quotation/ }).check();
    await dialog.getByRole('button', { name: 'Confirm booking' }).click();

    await expect(page.getByText('You’re booked')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pay your advance' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pay ₹64,428 with UPI' })).toHaveAttribute('href', /^upi:\/\/pay\?pa=e2estudio%40okhdfc/);
    await expect(page.getByText('50100123456789')).toBeVisible();
    await expect(page.getByRole('img', { name: /UPI QR code/ })).toBeVisible();
    await shot(page, 'quote-accepted');

    // The link keeps working after a reload and shows the same state.
    await page.reload();
    await expect(page.getByText('You’re booked')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('the staff see the booking: quote accepted, project, payment schedule and a draft invoice', async ({ page }) => {
    await signIn(page);
    await page.goto('/quotes');
    await expect(page.getByRole('heading', { level: 2, name: 'Quotes' })).toBeVisible();
    await page.getByRole('tab', { name: 'All quotes' }).click();
    await page.getByLabel('Search quotes').fill('Riya');
    const row = page.getByRole('row', { name: /Riya Kapoor/ });
    await expect(row).toContainText('Accepted');
    await expect(row).toContainText('₹2,14,760');
    await shot(page, 'quotes-all');
    await row.getByRole('button', { name: /QTN-/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Booked as PRJ-/)).toBeVisible();
    await expect(dialog.getByText('Accepted by Riya Kapoor')).toBeVisible();
    await expect(dialog.getByText('Advance')).toBeVisible();
    await expect(dialog.getByText(/Accepted by Riya Kapoor/).first()).toBeVisible();
    await expect(dialog.getByText('Opened by the customer for the first time')).toBeVisible();
    await shot(page, 'quote-detail');

    // The PDF button opens a new tab (headless Chromium downloads instead of rendering, so the file itself is checked over the API).
    const [popup] = await Promise.all([page.waitForEvent('popup'), dialog.getByRole('button', { name: 'PDF' }).first().click()]);
    await popup.close().catch(() => undefined);
    const list = await page.request.get('/api/v1/quotations?search=Riya&limit=5');
    const quoteId = (await list.json()).data[0].id as string;
    const staffPdf = await page.request.get(`/api/v1/quotations/${quoteId}/pdf`);
    expect(staffPdf.headers()['content-type']).toContain('application/pdf');
    expect((await staffPdf.body()).subarray(0, 4).toString()).toBe('%PDF');
    const token = new URL(shared.quoteUrl!).pathname.split('/').pop();
    const publicPdf = await page.request.get(`/api/v1/public/quotes/${token}/pdf`);
    expect(publicPdf.status()).toBe(200);
    expect((await publicPdf.body()).subarray(0, 4).toString()).toBe('%PDF');

    // The booking also made a draft invoice: it can be downloaded and then marked as issued.
    const invoice = dialog.getByRole('region', { name: 'Invoice' });
    await expect(invoice.getByText(/INV-/)).toBeVisible();
    await expect(invoice.getByText('Draft')).toBeVisible();
    const invoices = await (await page.request.get('/api/v1/invoices?limit=5')).json();
    const invoicePdf = await page.request.get(`/api/v1/invoices/${invoices.data[0].id}/pdf`);
    expect(invoicePdf.headers()['content-type']).toContain('application/pdf');
    expect((await invoicePdf.body()).subarray(0, 4).toString()).toBe('%PDF');
    await invoice.getByRole('button', { name: 'Mark as issued' }).click();
    await page.getByRole('dialog', { name: /Mark INV-.* as issued\?/ }).getByRole('button', { name: 'Mark as issued' }).click();
    await expect(invoice.getByText('Issued')).toBeVisible();

    await dialog.getByRole('button', { name: 'Open project' }).click();
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}/);
  });

  test('a booked date disappears from the customer calendar', async ({ page }) => {
    const date = dateIn(75);
    await page.goto(`/enquire/${SLUG}`);
    const day = page.getByRole('button', { name: new RegExp(`^${date.label}, fully booked`) });
    for (let i = 0; i < 18 && !(await day.isVisible()); i++) {
      await page.getByRole('button', { name: 'Next month' }).click();
      await page.waitForTimeout(250);
    }
    await expect(day).toBeVisible();
    await expect(day).toHaveAttribute('aria-disabled', 'true');
    // A person can still tap it; nothing must get selected. (force: Playwright treats aria-disabled as not clickable.)
    await day.click({ force: true });
    await expect(page.getByText(/is available$/)).toHaveCount(0);
    await expect(day).toHaveAttribute('aria-pressed', 'false');
    await shot(page, 'enquire-booked');
  });

  test('closed dates cannot be picked either', async ({ page }) => {
    await page.goto(`/enquire/${SLUG}`);
    const day = page.getByRole('button', { name: /^Wednesday, 10 March 2027, closed/ });
    for (let i = 0; i < 24 && !(await day.isVisible()); i++) {
      await page.getByRole('button', { name: 'Next month' }).click();
      await page.waitForTimeout(250);
    }
    await expect(day).toHaveAttribute('aria-disabled', 'true');
  });

  test('in approval mode an enquiry waits for the studio, which reviews, sends and sees the customer decline', async ({ page, browser }) => {
    await signIn(page);
    await setQuoteMode(page, /Prepare a draft, I send it/);

    const customer = await (await browser.newContext()).newPage();
    const date = dateIn(80);
    await customer.goto(`/enquire/${SLUG}`);
    await fillEnquiry(customer, { label: date.label, name: 'Meera Iyer', phone: '9988776655', pkg: /Wedding Essentials/ });
    await customer.getByRole('button', { name: 'Send enquiry' }).click();
    await expect(customer.getByRole('heading', { name: 'Thank you!' })).toBeVisible();
    await expect(customer).toHaveURL(new RegExp(`/enquire/${SLUG}$`));

    // The staff are told, and the notice opens the quote itself.
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /^Notifications/ }).click();
    await page.getByRole('button', { name: /New enquiry: Meera Iyer/ }).click();
    await expect(page.getByRole('dialog', { name: /Meera Iyer/ })).toBeVisible();
    await expect(page).toHaveURL(/\/quotes$/);

    // It is also on the Today list.
    await page.goto('/quotes');
    await expect(page.getByRole('heading', { name: 'Needs your review' })).toBeVisible();
    await shot(page, 'quotes-today');
    await page.getByRole('button', { name: 'Review & send' }).first().click();
    const dialog = page.getByRole('dialog').first();
    await expect(dialog.getByText('Needs review')).toBeVisible();
    await expect(dialog.getByText(/prepared automatically from an enquiry/)).toBeVisible();
    await dialog.getByRole('button', { name: 'Approve & send' }).click();

    const send = page.getByRole('dialog', { name: /Send this quote|Quote sent/ });
    await send.getByRole('radio', { name: /Copy link/ }).check();
    await send.getByRole('button', { name: 'Send quote' }).click();
    const link = send.getByLabel('Quote link');
    await expect(link).toBeVisible();
    shared.declineUrl = await link.inputValue();
    expect(shared.declineUrl).toMatch(/\/quote\/[A-Za-z0-9_-]{20,}$/);
    await send.getByRole('button', { name: 'Done' }).click();

    // The customer opens the link and declines with a reason.
    await customer.goto(new URL(shared.declineUrl).pathname);
    await expect(customer.getByRole('heading', { level: 1 })).toHaveText('Hello, Meera');
    await customer.getByRole('button', { name: 'Decline' }).click();
    await customer.getByLabel(/Anything you would like to tell the studio/).fill('Too expensive for now');
    await customer.getByRole('dialog').getByRole('button', { name: 'Decline' }).click();
    await expect(customer.getByText('This quotation was declined')).toBeVisible();
    await customer.context().close();

    // The studio sees the status and the reason.
    await page.reload();
    await page.getByRole('tab', { name: 'All quotes' }).click();
    await page.getByLabel('Search quotes').fill('Meera');
    await expect(page.getByRole('row', { name: /Meera Iyer/ })).toContainText('Declined');
    await page.getByRole('row', { name: /Meera Iyer/ }).getByRole('button', { name: /QTN-/ }).click();
    await expect(page.getByRole('dialog').getByText('Declined: “Too expensive for now”').first()).toBeVisible();
  });

  test('staff build a quote from a lead, edit it, send it and book it', async ({ page }) => {
    const errors = trackErrors(page);
    await signIn(page);
    const eventDate = dateIn(95).ymd;
    const created = await page.request.post('/api/v1/leads', { data: { name: 'Kabir Malhotra', phone: '9811122233', email: 'kabir@example.test', eventType: 'WEDDING', eventDate } });
    expect(created.ok()).toBeTruthy();

    // Quoting straight from the lead's row opens the form with that lead already chosen.
    await page.goto('/leads');
    await page.getByRole('row', { name: /Kabir Malhotra/ }).getByRole('button', { name: 'Create quote' }).click();
    await expect(page).toHaveURL(/\/quotes$/);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Kabir Malhotra')).toBeVisible();
    await expect(dialog.getByLabel('Search leads')).toHaveCount(0);

    // Without a package the form says what is missing.
    await dialog.getByRole('button', { name: 'Create quote' }).click();
    await expect(dialog.getByText('Choose a package, or “Custom quote”.')).toBeVisible();
    await dialog.getByLabel(/^Package/).selectOption({ label: 'Wedding Signature · ₹85,000 per day' });
    await dialog.getByRole('button', { name: 'Create quote' }).click();

    // The new quote opens as a draft with the package priced from the price list.
    const detail = page.getByRole('dialog', { name: /Kabir Malhotra/ });
    await expect(detail.getByText('Draft', { exact: true })).toBeVisible();
    await expect(detail.getByText('₹1,00,300.00').first()).toBeVisible();
    await shot(page, 'quote-draft');

    // Edit: two days instead of one, and a discount. Per-day lines follow the event.
    await detail.getByRole('button', { name: 'Edit', exact: true }).click();
    const builder = page.getByRole('dialog', { name: /Edit QTN-/ });
    await builder.getByLabel('Days', { exact: true }).fill('2');
    await builder.getByLabel('Overall discount').fill('10000');
    // 85,000 x 2 days = 1,70,000; GST 18% on the item = 30,600; less 10,000 discount = 1,90,600.
    await expect(builder.getByText('₹1,90,600.00').first()).toBeVisible();
    await shot(page, 'quote-builder');
    await builder.getByRole('button', { name: 'Save quote' }).click();
    await expect(page.getByText('Quote saved')).toBeVisible();
    await expect(detail.getByText('₹1,90,600.00').first()).toBeVisible();

    // Send by link, then book it by hand.
    await detail.getByRole('button', { name: 'Send', exact: true }).click();
    const send = page.getByRole('dialog', { name: /Send this quote|Quote sent/ });
    await send.getByRole('radio', { name: /Copy link/ }).check();
    await send.getByRole('button', { name: 'Send quote' }).click();
    await expect(send.getByLabel('Quote link')).toBeVisible();
    await send.getByRole('button', { name: 'Done' }).click();
    await detail.getByRole('button', { name: 'Book now' }).click();
    await page.getByRole('dialog', { name: 'Book this quote now?' }).getByRole('button', { name: 'Book it' }).click();
    await expect(page.getByText(/Booked as PRJ-/).first()).toBeVisible();
    await expect(detail.getByText('Accepted', { exact: true })).toBeVisible();

    // The lead's row now shows the quote's state instead of a button.
    await page.goto('/leads');
    const leadRow = page.getByRole('row', { name: /Kabir Malhotra/ });
    await expect(leadRow.getByRole('button', { name: /Open quote QTN-.*Accepted/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('links that lead nowhere say so plainly', async ({ page }) => {
    await page.goto('/enquire/no-such-studio');
    await expect(page.getByRole('heading', { name: 'This booking page isn’t available' })).toBeVisible();
    await page.goto('/quote/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    await expect(page.getByRole('heading', { name: 'This link isn’t working' })).toBeVisible();
  });
});

test.describe('quality: accessibility and small screens', () => {
  const axe = async (page: Page) => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    return results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
  };

  test('the booking page and the quote page have no serious accessibility violations', async ({ page }) => {
    await page.goto(`/enquire/${SLUG}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('E2E Studio');
    await page.waitForTimeout(600);
    expect(await axe(page)).toEqual([]);
    expect(shared.quoteUrl, 'run after the quote test').toBeTruthy();
    await page.goto(new URL(shared.quoteUrl!).pathname);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hello, Riya');
    await page.waitForTimeout(600);
    expect(await axe(page)).toEqual([]);
  });

  test('the staff screens have no serious accessibility violations', async ({ page }) => {
    await signIn(page);
    for (const url of ['/quotes', '/sales-setup']) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(600);
      expect(await axe(page), url).toEqual([]);
    }
    await page.goto('/sales-setup');
    for (const tab of ['Booking page', 'Availability', 'Business & payments', 'Reminders']) {
      await page.getByRole('tab', { name: tab }).click();
      await page.waitForTimeout(500);
      expect(await axe(page), tab).toEqual([]);
    }
  });

  test('nothing overflows on a 375px phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.goto(`/enquire/${SLUG}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('E2E Studio');
    expect(await overflow(), 'enquire').toBeLessThanOrEqual(1);
    await shot(page, 'enquire-375');
    await page.goto(new URL(shared.quoteUrl!).pathname);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hello, Riya');
    expect(await overflow(), 'quote').toBeLessThanOrEqual(1);
    await shot(page, 'quote-375');
    await signIn(page);
    for (const url of ['/quotes', '/sales-setup']) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(600);
      expect(await overflow(), url).toBeLessThanOrEqual(1);
      await shot(page, `${url.slice(1)}-375`);
    }
  });
});
