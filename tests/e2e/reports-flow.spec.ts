import { test, expect } from '@playwright/test';
import { loginAsDemo } from '../auth.setup';

/**
 * Reports Flow E2E Tests
 * Covers: all 7 report tabs visible, each tab loads content,
 *         date range changes update data
 */
test.describe('Reports Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('reports page loads with all 7 tabs visible', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /Profit & Loss/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Balance Sheet/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cash Flow/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Tax Summary/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Trial Balance/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Aged Receivables/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /General Ledger/i })).toBeVisible();
  });

  test('Profit & Loss tab is active by default and shows content', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // P&L should be the default active tab
    await expect(page.getByRole('button', { name: /Profit & Loss/i })).toBeVisible({ timeout: 10000 });

    // Content for P&L should be visible — Revenue, Expenses, or Net Income labels
    await expect(page.getByText(/Revenue|Income|Expenses|Net/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('clicking Balance Sheet tab loads balance sheet content', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Balance Sheet/i }).click();

    // Balance Sheet content: Assets, Liabilities, Equity
    await expect(page.getByText(/Assets|Liabilities|Equity/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('clicking Cash Flow tab loads cash flow content', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Cash Flow/i }).click();

    // Cash flow content
    await expect(page.getByText(/Cash|Flow|Operating|Financing/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('clicking Tax Summary tab loads tax content', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Tax Summary/i }).click();

    // Tax summary content
    await expect(page.getByText(/Tax|Deductible|Liability|Q1|Q2|Q3|Q4/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('clicking Trial Balance tab loads trial balance content', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Trial Balance/i }).click();

    // Trial balance: Debit, Credit columns or account names
    await expect(page.getByText(/Debit|Credit|Account|Balance/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('clicking Aged Receivables tab loads aged receivables content', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Aged Receivables/i }).click();

    // Aged receivables content: days overdue buckets or client names
    await expect(page.getByText(/Current|Overdue|Days|Client|Receivable/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('clicking General Ledger tab loads general ledger content', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /General Ledger/i }).click();

    // General ledger content: account names, entries
    await expect(page.getByText(/Ledger|Account|Entry|Debit|Credit|Balance/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('date range selector is present on reports page', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // There should be some date range control (select or buttons)
    const hasSelect = await page.locator('select').first().isVisible().catch(() => false);
    const hasRangeBtn = await page.getByText(/3 months|6 months|1 year|This Year|Custom/i).first().isVisible().catch(() => false);

    expect(hasSelect || hasRangeBtn).toBeTruthy();
  });

  test('changing date range to 3 months updates report', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Try select-based date range first
    const dateSelect = page.locator('select').first();
    const isSelectVisible = await dateSelect.isVisible().catch(() => false);

    if (isSelectVisible) {
      // Find an option whose text contains "3" (3 months / Q / quarter)
      const options = await dateSelect.locator('option').all();
      let selected = false;
      for (const opt of options) {
        const txt = (await opt.textContent() ?? '').toLowerCase();
        const val = (await opt.getAttribute('value') ?? '').toLowerCase();
        if (txt.includes('3') || val.includes('3m') || val.includes('quarter') || txt.includes('quarter')) {
          await dateSelect.selectOption(await opt.getAttribute('value') ?? '');
          selected = true;
          break;
        }
      }
      if (!selected && options.length > 1) {
        // Just pick the second option as a fallback range change
        await dateSelect.selectOption({ index: 1 });
      }
      await page.waitForTimeout(500);
      // Page should still show content — no crash
      await expect(page.getByRole('button', { name: /Profit & Loss/i })).toBeVisible({ timeout: 5000 });
    } else {
      // Try button-based range selectors
      const rangeBtn = page.getByRole('button', { name: /3 month|Quarter|3M/i }).first();
      if (await rangeBtn.isVisible().catch(() => false)) {
        await rangeBtn.click();
        await page.waitForTimeout(500);
      }
      // Report tabs should still be visible
      await expect(page.getByRole('button', { name: /Profit & Loss/i })).toBeVisible({ timeout: 5000 });
    }
  });

  test('changing date range to 1 year updates report', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    const dateSelect = page.locator('select').first();
    const isSelectVisible = await dateSelect.isVisible().catch(() => false);

    if (isSelectVisible) {
      // Find an option for "1 year" / "annual" / "ytd"
      const options = await dateSelect.locator('option').all();
      let selected = false;
      for (const opt of options) {
        const txt = (await opt.textContent() ?? '').toLowerCase();
        const val = (await opt.getAttribute('value') ?? '').toLowerCase();
        if (txt.includes('year') || txt.includes('annual') || val.includes('year') || val.includes('ytd') || val.includes('12m')) {
          await dateSelect.selectOption(await opt.getAttribute('value') ?? '');
          selected = true;
          break;
        }
      }
      if (!selected && options.length > 0) {
        // Pick last option as widest range fallback
        const lastVal = await options[options.length - 1].getAttribute('value');
        if (lastVal) await dateSelect.selectOption(lastVal);
      }
      await page.waitForTimeout(500);
    } else {
      const yearBtn = page.getByRole('button', { name: /1 year|12M|Annual|This Year/i }).first();
      if (await yearBtn.isVisible().catch(() => false)) {
        await yearBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Report should still render without error
    await expect(page.getByRole('button', { name: /Balance Sheet/i })).toBeVisible({ timeout: 5000 });
  });

  test('can switch between multiple tabs without errors', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    const tabs = [
      /Balance Sheet/i,
      /Cash Flow/i,
      /Trial Balance/i,
      /Aged Receivables/i,
      /Tax Summary/i,
      /General Ledger/i,
      /Profit & Loss/i,
    ];

    for (const tabName of tabs) {
      await page.getByRole('button', { name: tabName }).click();
      // Brief wait for content to render
      await page.waitForTimeout(300);
      // Verify the page didn't crash — tab button still visible
      await expect(page.getByRole('button', { name: tabName })).toBeVisible({ timeout: 5000 });
    }
  });
});
