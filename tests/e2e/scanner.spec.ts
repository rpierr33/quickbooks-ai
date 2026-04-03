import { test, expect } from '@playwright/test';
import { loginAsDemo } from '../auth.setup';

test.describe('Receipt Scanner', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('scanner page loads with upload zone', async ({ page }) => {
    await page.goto('/scanner');
    await expect(page.getByText('Receipt Scanner')).toBeVisible();
    await expect(page.getByText('Upload a receipt or invoice')).toBeVisible();
    await expect(page.getByRole('button', { name: /Choose File/i })).toBeVisible();
  });

  test('shows how-it-works sidebar on desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Sidebar panel hidden on mobile');
    await page.goto('/scanner');
    await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
    await expect(page.getByText('AI Extracts')).toBeVisible();
    await expect(page.getByText('Review & Edit')).toBeVisible();
  });

  test('shows scanner stats', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Stats panel hidden on mobile');
    await page.goto('/scanner');
    await expect(page.getByText('Scanner Stats')).toBeVisible();
    await expect(page.getByText('Total scanned')).toBeVisible();
    await expect(page.getByText('Saved as expenses')).toBeVisible();
  });

  test('loads receipt data and shows stats', async ({ page }) => {
    await page.goto('/scanner');
    await expect(page.getByRole('heading', { name: 'Receipt Scanner' })).toBeVisible();
    // Stats prove the GET API works and seed data loads
    await expect(page.getByText('Total scanned')).toBeVisible();
    // History button badge shows count from seed data
    const historyBtn = page.getByRole('button', { name: /History/i });
    await expect(historyBtn).toBeVisible();
    await expect(historyBtn).toContainText('3');
  });

  test('history shows correct status badges', async ({ page }) => {
    await page.goto('/scanner');
    await page.getByRole('button', { name: /History/i }).click();
    // From seed data: 2 saved, 1 confirmed
    await expect(page.getByText('Saved').first()).toBeVisible();
  });

  test('switches back to scan mode from history', async ({ page }) => {
    await page.goto('/scanner');
    await page.getByRole('button', { name: /History/i }).click();
    await expect(page.getByText('Scan History')).toBeVisible();
    await page.getByRole('button', { name: /Scan/i }).first().click();
    await expect(page.getByText('Upload a receipt or invoice')).toBeVisible();
  });

  test('upload zone accepts file input click', async ({ page }) => {
    await page.goto('/scanner');
    // Verify the hidden file input exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp,image/gif,application/pdf');
  });

  test('scanner is in sidebar navigation', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Sidebar hidden on mobile');
    await page.goto('/');
    const sidebar = page.locator('aside');
    await expect(sidebar.getByText('Receipt Scanner')).toBeVisible();
  });

  test('scanner is in mobile bottom nav', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Only test on mobile');
    await page.goto('/');
    const nav = page.locator('nav').last();
    await expect(nav.getByText('Scan')).toBeVisible();
  });

  test('navigates to scanner from sidebar', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Sidebar hidden on mobile');
    // Already on dashboard from loginAsDemo
    const sidebar = page.locator('aside');
    await expect(sidebar.getByText('Receipt Scanner')).toBeVisible();
    await sidebar.getByText('Receipt Scanner').click();
    await expect(page).toHaveURL('/scanner');
    await expect(page.getByRole('heading', { name: 'Receipt Scanner' })).toBeVisible();
  });
});
