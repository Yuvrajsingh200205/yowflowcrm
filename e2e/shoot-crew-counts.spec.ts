import { expect, test, type Page } from '@playwright/test';
import { signIn, trackErrors } from './helpers';

/**
 * Regression: crew slots added to a shoot without assigning anyone ("2 photographers,
 * 1 videographer, 1 assistant") used to vanish when the project was saved, so Shoot
 * Management showed "No crew assigned yet" instead of the required headcounts.
 */
test.describe('shoot crew headcounts', () => {
  test.beforeEach(async ({ page }) => { await signIn(page); });

  const stamp = Date.now();
  const titles = { abc: `ABC ${stamp}`, cde: `CDE ${stamp}`, fgh: `FGH ${stamp}` };

  const shootCard = (page: Page, title: string) =>
    page.getByTestId('shoot-card').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

  /** Projects render collapsed on /shoots; open them all so every shoot card is in the DOM. */
  async function openShoots(page: Page) {
    await page.getByRole('button', { name: 'Expand all' }).click();
  }

  async function expectBreakdown(page: Page, title: string, counts: Record<string, number>) {
    const breakdown = shootCard(page, title).getByTestId('team-breakdown');
    await expect(breakdown).toBeVisible();
    await expect(breakdown).not.toContainText('No crew assigned yet');
    for (const [role, count] of Object.entries(counts)) {
      await expect(breakdown).toContainText(new RegExp(`${role}:\\s*${count}(?!\\d)`));
    }
  }

  test('unassigned crew counts survive project creation and an edit', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/projects/new');
    await page.getByPlaceholder('e.g. Vikram & Meera Royal Wedding').fill(`Crew Count Wedding ${stamp}`);
    await page.getByPlaceholder('+1 415 555 0132').fill('9812345678');

    await page.getByRole('button', { name: /Shoot plan/ }).click();
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Add Shoot' }).click();
    const shootTitleInputs = page.getByPlaceholder('e.g. Ring Ceremony & Sangeet');
    await expect(shootTitleInputs).toHaveCount(3);
    await shootTitleInputs.nth(0).fill(titles.abc);
    await shootTitleInputs.nth(1).fill(titles.cde);
    await shootTitleInputs.nth(2).fill(titles.fgh);

    // A new shoot starts with 1 photographer, 1 videographer and 1 assistant slot, all unassigned.
    await page.getByTitle('Add +1 Photographer Slot').nth(0).click();
    await page.getByTitle('Add +1 Drone Operator Slot').nth(0).click();
    await page.getByTitle('Add +1 Drone Operator Slot').nth(1).click();
    await page.getByTitle('Add +1 Assistant Slot').nth(1).click();

    // The submit button only exists on the last wizard step.
    await page.getByRole('button', { name: /Save & Next: Tasks/ }).click();
    await page.getByRole('button', { name: 'Save & Create Project' }).click();
    // Saving closes the form and lands on the project list (the toast unmounts with the form).
    await expect(page.getByText(`Crew Count Wedding ${stamp}`).first()).toBeVisible();

    await page.goto('/shoots');
    await openShoots(page);
    await expectBreakdown(page, titles.abc, { Photographer: 2, Videographer: 1, Assistant: 1, 'Drone Operator': 1 });
    await expectBreakdown(page, titles.cde, { Photographer: 1, Videographer: 1, Assistant: 2, 'Drone Operator': 1 });
    await expectBreakdown(page, titles.fgh, { Photographer: 1, Videographer: 1, Assistant: 1 });

    // Fresh load from the API, not React state.
    await page.reload();
    await openShoots(page);
    await expectBreakdown(page, titles.abc, { Photographer: 2, Videographer: 1, Assistant: 1, 'Drone Operator': 1 });

    // Naming one photographer must not drop the slots that are still unassigned.
    await shootCard(page, titles.abc).getByRole('button', { name: /Assign \/ Edit Crew/ }).click();
    const crewForm = page.locator('form', { has: page.getByRole('button', { name: 'Save Crew Assignments' }) });
    await crewForm.getByPlaceholder('Person Name').first().fill('Ravi Walkin');
    const saved = page.waitForResponse((r) => /\/shoots\/[0-9a-f-]{36}$/.test(r.url()) && r.request().method() === 'PATCH');
    await crewForm.getByRole('button', { name: 'Save Crew Assignments' }).click();
    await saved;
    await page.waitForLoadState('networkidle');

    await page.reload();
    await openShoots(page);
    await expectBreakdown(page, titles.abc, { Photographer: 2, Videographer: 1, Assistant: 1, 'Drone Operator': 1 });
    await expectBreakdown(page, titles.cde, { Photographer: 1, Videographer: 1, Assistant: 2, 'Drone Operator': 1 });
    expect(errors).toEqual([]);
  });
});
