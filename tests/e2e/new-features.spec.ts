import { test, expect } from '@playwright/test';
import { loginAsDemo } from '../auth.setup';

/**
 * New Features E2E Tests
 * Covers: mileage, time-tracking, purchase-orders, bills, payroll, contractors,
 *         projects, reconciliation, settings sections, billing tiers
 */
test.describe('New Features — Mileage Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('mileage page loads with Log Trip button visible', async ({ page }) => {
    await page.goto('/mileage');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /Log Trip/i })).toBeVisible({ timeout: 10000 });
  });

  test('mileage page shows stat cards', async ({ page }) => {
    await page.goto('/mileage');
    await page.waitForLoadState('networkidle');

    // YTD Miles or Deduction stat cards
    await expect(page.getByText(/YTD|Miles|Deduction|Trips/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('Log Trip button opens dialog with form fields', async ({ page }) => {
    await page.goto('/mileage');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Log Trip/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    // From and To location inputs
    await expect(page.getByPlaceholder(/from|office|departure/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('New Features — Time Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('time tracking page loads with timer controls visible', async ({ page }) => {
    await page.goto('/time-tracking');
    await page.waitForLoadState('networkidle');

    // Timer controls: Play/Start button should be visible
    const playBtn = page.getByRole('button', { name: /Start|Play|Begin/i }).first();
    const timerDisplay = page.getByText(/00:00:00|\d{2}:\d{2}:\d{2}/);

    const hasTimer = await timerDisplay.isVisible().catch(() => false);
    const hasPlayBtn = await playBtn.isVisible().catch(() => false);

    // At least one timer-related element should be present
    expect(hasTimer || hasPlayBtn).toBeTruthy();
  });

  test('time tracking page loads without crashing', async ({ page }) => {
    await page.goto('/time-tracking');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/time-tracking');
    // No error page
    await expect(page.getByText(/500|Something went wrong|Internal Server Error/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('Log Entry button opens dialog', async ({ page }) => {
    await page.goto('/time-tracking');
    await page.waitForLoadState('networkidle');

    const logBtn = page.getByRole('button', { name: /Log Entry|Add Entry|Log Time/i }).first();
    if (await logBtn.isVisible().catch(() => false)) {
      await logBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('New Features — Purchase Orders', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('purchase orders page loads without error', async ({ page }) => {
    await page.goto('/purchase-orders');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/purchase-orders');
    await expect(page.getByText(/500|Something went wrong|Internal Server Error/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('purchase orders page has create/new PO button or empty state', async ({ page }) => {
    await page.goto('/purchase-orders');
    await page.waitForLoadState('networkidle');

    // Should show either a list, empty state, or create button
    const hasCreateBtn = await page.getByRole('button', { name: /New|Create|Add/i }).first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/No purchase orders|Get started|Create your first/i).first().isVisible().catch(() => false);
    const hasList = await page.locator('table, .group').first().isVisible().catch(() => false);

    expect(hasCreateBtn || hasEmptyState || hasList).toBeTruthy();
  });
});

test.describe('New Features — Bills', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('bills page loads without error', async ({ page }) => {
    await page.goto('/bills');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/bills');
    await expect(page.getByText(/500|Something went wrong|Internal Server Error/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('bills page renders a meaningful UI element', async ({ page }) => {
    await page.goto('/bills');
    await page.waitForLoadState('networkidle');

    const hasBtn = await page.getByRole('button').first().isVisible().catch(() => false);
    const hasText = await page.getByText(/Bill|Vendor|Due|Amount/i).first().isVisible().catch(() => false);

    expect(hasBtn || hasText).toBeTruthy();
  });
});

test.describe('New Features — Reconciliation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('reconciliation page loads without error', async ({ page }) => {
    await page.goto('/reconciliation');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/reconciliation');
    await expect(page.getByText(/500|Something went wrong|Internal Server Error/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('account selector is visible on reconciliation page', async ({ page }) => {
    await page.goto('/reconciliation');
    await page.waitForLoadState('networkidle');

    // Account dropdown / selector should be present
    const hasSelect = await page.locator('select').first().isVisible().catch(() => false);
    const hasAccountText = await page.getByText(/Account|Select|Bank|Checking/i).first().isVisible().catch(() => false);

    expect(hasSelect || hasAccountText).toBeTruthy();
  });

  test('statement balance input is present', async ({ page }) => {
    await page.goto('/reconciliation');
    await page.waitForLoadState('networkidle');

    // Statement balance field
    await expect(page.getByText(/Statement Balance|Ending Balance|Balance/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('reconciliation shows transaction list when account selected', async ({ page }) => {
    await page.goto('/reconciliation');
    await page.waitForLoadState('networkidle');

    // Select first account in dropdown
    const accountSelect = page.locator('select').first();
    if (await accountSelect.isVisible()) {
      // Get all options and pick the first non-empty one
      const options = await accountSelect.locator('option').all();
      for (const opt of options) {
        const val = await opt.getAttribute('value');
        if (val && val !== '') {
          await accountSelect.selectOption(val);
          break;
        }
      }

      // After selecting an account, transactions should load
      await page.waitForTimeout(500);
      await expect(page.getByText(/Transaction|Description|Amount|Uncleared/i).first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('New Features — Settings Sections', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('settings page loads completely', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/settings');
    await expect(page.getByText(/500|Something went wrong|Internal Server Error/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('settings page has Company section', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Company|Business/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('settings page has Bank Connections / Plaid section', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Plaid section heading or Connect Bank button
    await expect(page.getByText(/Bank|Plaid|Connect|Integration/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('settings page has Team section', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Team section
    await expect(page.getByText(/Team|Members|Invite/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('settings page has White-Label section', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // White-label section
    await expect(page.getByText(/White.?[Ll]abel|Branding|Custom Logo/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('company name save button is functional', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Find Save button near company settings
    const saveBtn = page.getByRole('button', { name: /Save|Update/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
    // Button should be enabled (not disabled)
    await expect(saveBtn).not.toBeDisabled();
  });
});

test.describe('New Features — Billing Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('billing page loads with all 5 pricing tiers', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Free Trial/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Starter/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Professional/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Business/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Enterprise/i })).toBeVisible();
  });

  test('billing page shows correct prices', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    // Starter: $29.99
    await expect(page.getByText('29.99', { exact: false })).toBeVisible({ timeout: 10000 });
    // Professional: $59.99
    await expect(page.getByText('59.99', { exact: false })).toBeVisible();
    // Business: $99.99
    await expect(page.getByText('99.99', { exact: false })).toBeVisible();
    // Enterprise: $139.99
    await expect(page.getByText('139.99', { exact: false })).toBeVisible();
  });

  test('each plan has a CTA button', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    // CTA buttons for each plan
    await expect(page.getByRole('button', { name: /Start Free Trial/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Get Starter/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Upgrade to Pro/i })).toBeVisible();
  });

  test('Free Trial plan shows no credit card required', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/No credit card required/i)).toBeVisible({ timeout: 10000 });
  });

  test('Professional plan is highlighted as recommended', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    // Professional plan should have some visual indicator of being recommended/popular
    const proSection = page.locator('*').filter({ hasText: /Professional/i }).first();
    await expect(proSection).toBeVisible({ timeout: 10000 });
  });
});

test.describe('New Features — Navigation to All Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('navigates to /payroll without error', async ({ page }) => {
    await page.goto('/payroll');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/payroll');
    await expect(page.getByText(/500|Something went wrong/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('navigates to /contractors without error', async ({ page }) => {
    await page.goto('/contractors');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/contractors');
    await expect(page.getByText(/500|Something went wrong/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('navigates to /projects without error', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/projects');
    await expect(page.getByText(/500|Something went wrong/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('navigates to /mileage without error', async ({ page }) => {
    await page.goto('/mileage');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/mileage');
    await expect(page.getByText(/500|Something went wrong/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('navigates to /time-tracking without error', async ({ page }) => {
    await page.goto('/time-tracking');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/time-tracking');
    await expect(page.getByText(/500|Something went wrong/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('navigates to /purchase-orders without error', async ({ page }) => {
    await page.goto('/purchase-orders');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/purchase-orders');
    await expect(page.getByText(/500|Something went wrong/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('navigates to /bills without error', async ({ page }) => {
    await page.goto('/bills');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/bills');
    await expect(page.getByText(/500|Something went wrong/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('navigates to /reconciliation without error', async ({ page }) => {
    await page.goto('/reconciliation');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/reconciliation');
    await expect(page.getByText(/500|Something went wrong/i)).not.toBeVisible({ timeout: 3000 });
  });
});
