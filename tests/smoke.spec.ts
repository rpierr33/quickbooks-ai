import { test, expect } from '@playwright/test';
import { loginAsDemo } from './auth.setup';

test.describe('Ledgr Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('dashboard loads with KPI cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Cash Balance', { exact: false })).toBeVisible();
    await expect(page.getByText('Net Profit', { exact: false })).toBeVisible();
    await expect(page.getByText('Monthly Overview')).toBeVisible();
    await expect(page.getByText('AI Insights', { exact: false })).toBeVisible();
  });

  test('transactions page loads', async ({ page }) => {
    await page.goto('/transactions');
    await expect(page).toHaveTitle(/Ledgr/);
  });

  test('clients page loads', async ({ page }) => {
    await page.goto('/clients');
    await expect(page.getByText('Active Contacts', { exact: false })).toBeVisible();
  });

  test('invoices page loads', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page).toHaveTitle(/Ledgr/);
  });

  test('reports page loads with all tabs', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('button', { name: /Profit & Loss/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Balance Sheet/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cash Flow/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Aged Receivables/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Trial Balance/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Tax Summary/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /General Ledger/i })).toBeVisible();
  });

  test('billing page loads with pricing tiers', async ({ page }) => {
    await page.goto('/billing');
    await expect(page.getByText('Choose your plan')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Starter' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Professional' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Enterprise' })).toBeVisible();
  });

  test('onboarding wizard loads', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.getByText('Welcome to Ledgr')).toBeVisible();
  });

  test('AI assistant page loads', async ({ page }) => {
    await page.goto('/ai');
    await expect(page).toHaveTitle(/Ledgr/);
  });

  test('scanner page loads with upload zone', async ({ page }) => {
    await page.goto('/scanner');
    await expect(page.getByText('Receipt Scanner')).toBeVisible();
    await expect(page.getByText('Upload a receipt or invoice')).toBeVisible();
  });

  // Sidebar is hidden on mobile, only test on desktop
  test('sidebar navigation has all links', async ({ page, browserName }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Sidebar hidden on mobile');
    await page.goto('/');
    const sidebar = page.locator('aside');
    await expect(sidebar.locator('text=Dashboard')).toBeVisible();
    await expect(sidebar.locator('text=Transactions')).toBeVisible();
    await expect(sidebar.locator('text=Clients & Vendors')).toBeVisible();
    await expect(sidebar.locator('text=Invoices')).toBeVisible();
    await expect(sidebar.locator('text=Reports')).toBeVisible();
    await expect(sidebar.locator('text=Receipt Scanner')).toBeVisible();
    await expect(sidebar.locator('text=Billing')).toBeVisible();
  });

  test('navigation works between pages', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Sidebar hidden on mobile');
    await page.goto('/');
    await page.locator('aside').locator('text=Transactions').click();
    await expect(page).toHaveURL('/transactions');
    await page.locator('aside').locator('text=Reports').click();
    await expect(page).toHaveURL('/reports');
  });
});
