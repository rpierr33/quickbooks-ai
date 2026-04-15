import { test, expect } from '@playwright/test';
import { loginAsDemo } from '../auth.setup';

/**
 * Invoice Flow E2E Tests
 * Covers: listing, 3-step create dialog, mark paid, PDF download trigger,
 *         invoice card details
 */
test.describe('Invoice Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('invoices page loads with Create Invoice button visible', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /Create Invoice/i })).toBeVisible({ timeout: 10000 });
  });

  test('invoices page shows summary stat cards when invoices exist', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForLoadState('networkidle');

    // Stats visible: Overdue, Outstanding, Paid
    await expect(page.getByText('Overdue', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Outstanding', { exact: false })).toBeVisible();
    await expect(page.getByText('Paid', { exact: false })).toBeVisible();
  });

  test('seeded invoices are visible as cards', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForLoadState('networkidle');

    // At least one invoice card should be visible from seed data
    // Seed has Acme Corp, Bright Ideas LLC, GreenLeaf Co invoices
    const firstCard = page.locator('div.group').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
  });

  test('Create Invoice button opens dialog — step 1 shows client info form', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Create Invoice/i }).click();

    // Step 1: Client Information
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Client Information')).toBeVisible();
    await expect(page.getByPlaceholder('Acme Corp')).toBeVisible();
    await expect(page.getByPlaceholder('billing@acme.com')).toBeVisible();
  });

  test('invoice creation — step 1: fill client info, advance to step 2', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Create Invoice/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Fill step 1
    await page.getByPlaceholder('Acme Corp').fill('E2E Test Client');
    await page.getByPlaceholder('billing@acme.com').fill('e2e@test.com');

    // Set due date
    const dueDateInput = page.locator('input[type="date"]').first();
    await dueDateInput.fill('2026-12-31');

    // Click Next
    await page.getByRole('button', { name: 'Next' }).click();

    // Should now show step 2: Line Items
    await expect(page.getByText('Line Items')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('Item description')).toBeVisible();
  });

  test('invoice creation — step 2: fill line item, advance to step 3', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Create Invoice/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Step 1: Client info
    await page.getByPlaceholder('Acme Corp').fill('E2E Test Client');
    await page.getByPlaceholder('billing@acme.com').fill('e2e@test.com');
    await page.locator('input[type="date"]').first().fill('2026-12-31');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2: Line items
    await expect(page.getByText('Line Items')).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Item description').fill('E2E Web Design Service');

    // Set rate — find the Rate input (second number input in the item row)
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(1).fill('750');

    // Click Next to go to review
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3: Review
    await expect(page.getByText('Review & Create')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('E2E Test Client')).toBeVisible();
    await expect(page.getByText('E2E Web Design Service', { exact: false })).toBeVisible();
  });

  test('invoice creation — full 3-step flow creates invoice in list', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Create Invoice/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Step 1
    await page.getByPlaceholder('Acme Corp').fill('E2E Full Flow Client');
    await page.getByPlaceholder('billing@acme.com').fill('full-flow@test.com');
    await page.locator('input[type="date"]').first().fill('2026-12-31');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2
    await expect(page.getByText('Line Items')).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Item description').fill('Full Flow Service');
    const rateInput = page.locator('input[type="number"]').nth(1);
    await rateInput.fill('1500');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3: Create
    await expect(page.getByText('Review & Create')).toBeVisible({ timeout: 5000 });
    const createBtn = page.getByRole('button', { name: /Create Invoice/i }).last();
    await createBtn.click();

    // Dialog should close and new invoice card should appear
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('E2E Full Flow Client')).toBeVisible({ timeout: 10000 });
  });

  test('new invoice appears with Draft status', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForLoadState('networkidle');

    // Create a new invoice
    await page.getByRole('button', { name: /Create Invoice/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Acme Corp').fill('Draft Status Client');
    await page.getByPlaceholder('billing@acme.com').fill('draft@test.com');
    await page.locator('input[type="date"]').first().fill('2026-12-31');
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Line Items')).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Item description').fill('Draft Invoice Item');
    await page.locator('input[type="number"]').nth(1).fill('100');
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Review & Create')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /Create Invoice/i }).last().click();

    // Find the new invoice card and check for draft status
    await expect(page.getByText('Draft Status Client')).toBeVisible({ timeout: 10000 });

    // The card for this client should show "draft" status badge
    const clientCard = page.locator('div.group').filter({ hasText: 'Draft Status Client' });
    await expect(clientCard.getByText('draft', { exact: false })).toBeVisible({ timeout: 5000 });
  });

  test('mark paid button changes invoice status', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForLoadState('networkidle');

    // Create an invoice to mark paid
    await page.getByRole('button', { name: /Create Invoice/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Acme Corp').fill('Mark Paid Client');
    await page.getByPlaceholder('billing@acme.com').fill('paid@test.com');
    await page.locator('input[type="date"]').first().fill('2026-12-31');
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Line Items')).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Item description').fill('Service to Mark Paid');
    await page.locator('input[type="number"]').nth(1).fill('200');
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Review & Create')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /Create Invoice/i }).last().click();

    // Wait for invoice to appear
    await expect(page.getByText('Mark Paid Client')).toBeVisible({ timeout: 10000 });

    // Hover over the card to reveal action buttons
    const invoiceCard = page.locator('div.group').filter({ hasText: 'Mark Paid Client' });
    await invoiceCard.hover();

    // Click Mark Paid
    const markPaidBtn = invoiceCard.getByRole('button', { name: /Mark Paid/i });
    await expect(markPaidBtn).toBeVisible({ timeout: 5000 });
    await markPaidBtn.click();

    // Status should change to "paid"
    await expect(invoiceCard.getByText('paid', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('PDF download button is present on invoice cards', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForLoadState('networkidle');

    // Wait for invoice cards to render
    await expect(page.locator('div.group').first()).toBeVisible({ timeout: 10000 });

    // Hover the first card to reveal action buttons
    await page.locator('div.group').first().hover();

    // PDF button should be visible
    await expect(page.locator('button', { hasText: 'PDF' }).first()).toBeVisible({ timeout: 5000 });
  });

  test('back button navigates between steps in create dialog', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Create Invoice/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Advance to step 2
    await page.getByPlaceholder('Acme Corp').fill('Back Button Test');
    await page.locator('input[type="date"]').first().fill('2026-12-31');
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Line Items')).toBeVisible({ timeout: 5000 });

    // Click Back — should return to step 1
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByText('Client Information')).toBeVisible({ timeout: 5000 });
    // Client name should be preserved
    await expect(page.getByPlaceholder('Acme Corp')).toHaveValue('Back Button Test');
  });

  test('invoice export button is visible when invoices exist', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForLoadState('networkidle');

    // Wait for invoices to load
    await expect(page.locator('div.group').first()).toBeVisible({ timeout: 10000 });

    // Export button should be visible
    await expect(page.getByRole('button', { name: /Export/i })).toBeVisible({ timeout: 5000 });
  });
});
