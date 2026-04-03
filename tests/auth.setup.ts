import { Page, expect } from '@playwright/test';

/**
 * Logs in via the demo account button on /login.
 * Call this in beforeEach or at the start of tests that need auth.
 */
export async function loginAsDemo(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /Demo Account/i }).click();
  // Wait for redirect to dashboard
  await page.waitForURL('/', { timeout: 30000 });
}
