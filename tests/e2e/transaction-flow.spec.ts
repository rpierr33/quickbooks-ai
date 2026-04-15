import { test, expect } from '@playwright/test';
import { loginAsDemo } from '../auth.setup';

/**
 * Transaction Flow E2E Tests
 * Covers: listing, create, edit, delete, search, date range filter
 */
test.describe('Transaction Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('transactions page loads with seeded data visible', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    // Search bar and Add Transaction button should be visible
    await expect(page.getByPlaceholder(/Search transactions/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Add Transaction/i })).toBeVisible();

    // Seed data: "Office Rent" should be present in the list
    await expect(page.getByText('Office Rent', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('Add Transaction button opens dialog', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Add Transaction/i }).click();

    // Dialog should appear with description input
    await expect(page.getByPlaceholder(/AWS Monthly Bill/i)).toBeVisible({ timeout: 5000 });
  });

  test('can create a new expense transaction', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Add Transaction/i }).click();

    // Step 1: Fill description and amount
    await page.getByPlaceholder(/AWS Monthly Bill/i).fill('E2E Test Expense');
    await page.locator('input[type="number"]').first().fill('123.45');

    // Type should default to expense — verify select exists
    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption('expense');

    // Proceed to step 2
    const nextBtn = page.getByRole('button', { name: /Next|Continue/i }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }

    // Step 2: Save transaction
    const saveBtn = page.getByRole('button', { name: /Save|Create|Add|Submit/i }).last();
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // New transaction should appear in list
    await expect(page.getByText('E2E Test Expense')).toBeVisible({ timeout: 10000 });
  });

  test('can create a new income transaction', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Add Transaction/i }).click();

    await page.getByPlaceholder(/AWS Monthly Bill/i).fill('E2E Test Income');
    await page.locator('input[type="number"]').first().fill('500.00');

    // Change type to income
    await page.locator('select').first().selectOption('income');

    // Proceed / save
    const nextBtn = page.getByRole('button', { name: /Next|Continue/i }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }

    const saveBtn = page.getByRole('button', { name: /Save|Create|Add|Submit/i }).last();
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    await expect(page.getByText('E2E Test Income')).toBeVisible({ timeout: 10000 });
  });

  test('can edit an existing transaction', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    // Wait for transactions to load
    await expect(page.getByText('Office Rent', { exact: false })).toBeVisible({ timeout: 10000 });

    // Click the first edit (pencil) button — use title attribute
    const editBtn = page.locator('button[title="Edit"]').first();
    await editBtn.click();

    // Edit dialog should open — description input is populated
    const descInput = page.getByPlaceholder(/AWS Monthly Bill/i);
    await expect(descInput).toBeVisible({ timeout: 5000 });

    // Change the description
    await descInput.fill('Updated E2E Transaction');

    // Save
    const saveBtn = page.getByRole('button', { name: /Save|Update|Edit/i }).last();
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // Updated text should appear
    await expect(page.getByText('Updated E2E Transaction')).toBeVisible({ timeout: 10000 });
  });

  test('can delete a transaction with confirmation', async ({ page }) => {
    // First: create a transaction so we have one to delete
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Add Transaction/i }).click();
    await page.getByPlaceholder(/AWS Monthly Bill/i).fill('DELETE ME E2E');
    await page.locator('input[type="number"]').first().fill('1.00');

    const nextBtn = page.getByRole('button', { name: /Next|Continue/i }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }
    const saveBtn = page.getByRole('button', { name: /Save|Create|Add|Submit/i }).last();
    await saveBtn.click();

    await expect(page.getByText('DELETE ME E2E')).toBeVisible({ timeout: 10000 });

    // Click delete button for that row — use title="Delete"
    // Find the row containing "DELETE ME E2E" and click its delete button
    const row = page.locator('tr, div[style]').filter({ hasText: 'DELETE ME E2E' }).first();
    const deleteBtn = row.locator('button[title="Delete"]');
    await deleteBtn.click();

    // Confirmation dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Confirm deletion — look for confirm/delete button in dialog
    const confirmBtn = page.getByRole('dialog').getByRole('button', { name: /Delete|Confirm|Yes/i });
    await confirmBtn.click();

    // Transaction should no longer be visible
    await expect(page.getByText('DELETE ME E2E')).not.toBeVisible({ timeout: 10000 });
  });

  test('search filter narrows results', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    // Wait for data to load
    await expect(page.getByText('Office Rent', { exact: false })).toBeVisible({ timeout: 10000 });

    // Search for a specific term
    await page.getByPlaceholder(/Search transactions/i).fill('AWS');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // AWS transactions should be visible
    await expect(page.getByText('AWS', { exact: false })).toBeVisible({ timeout: 5000 });

    // Office Rent should NOT be visible when searching for AWS
    await expect(page.getByText('Office Rent - October', { exact: false })).not.toBeVisible({ timeout: 3000 });
  });

  test('type filter — income only shows income transactions', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Office Rent', { exact: false })).toBeVisible({ timeout: 10000 });

    // Select "Income" type filter
    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption('income');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Income badge should be visible
    await expect(page.getByText('income', { exact: false }).first()).toBeVisible({ timeout: 5000 });

    // Expense-only items like "Office Rent" should be hidden
    await expect(page.getByText('Office Rent - October')).not.toBeVisible({ timeout: 3000 });
  });

  test('date range filter — Last 30 days applies', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Office Rent', { exact: false })).toBeVisible({ timeout: 10000 });

    // Select "Last 30 days" — this is the second select
    const dateSelect = page.locator('select').nth(1);
    await dateSelect.selectOption('30d');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Older seed transactions (Oct 2025) should not be visible
    await expect(page.getByText('Office Rent - October')).not.toBeVisible({ timeout: 3000 });
  });

  test('CSV export button is visible when transactions exist', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Office Rent', { exact: false })).toBeVisible({ timeout: 10000 });

    // CSV button should be visible
    await expect(page.getByText('CSV')).toBeVisible({ timeout: 5000 });
  });
});
