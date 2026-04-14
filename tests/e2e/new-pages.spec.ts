import { test, expect } from '@playwright/test';
import { loginAsDemo } from '../auth.setup';

test.describe('Payroll Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('loads with stat cards and employee table', async ({ page }) => {
    await page.goto('/payroll');
    await page.waitForLoadState('networkidle');

    // Stat cards
    await expect(page.getByText('Payroll This Month', { exact: false })).toBeVisible();
    await expect(page.getByText('YTD Payroll', { exact: false })).toBeVisible();
    await expect(page.getByText('Active Employees', { exact: false })).toBeVisible();

    // Tabs
    await expect(page.getByRole('button', { name: /Employees/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Payroll History/i })).toBeVisible();

    // Seed employee visible in the table
    await expect(page.getByRole('table').getByText('Sarah Johnson')).toBeVisible();
  });

  test('can switch to payroll history tab', async ({ page }) => {
    await page.goto('/payroll');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Payroll History/i }).click();
    // History tab — specific period date string present
    await expect(page.getByText('Mar 15, 2026 – Mar 30, 2026')).toBeVisible({ timeout: 10000 });
  });

  test('Add Employee button opens dialog', async ({ page }) => {
    await page.goto('/payroll');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Add Employee/i }).first().click();
    // Dialog should open with form
    await expect(page.getByPlaceholder(/Jane Smith/i)).toBeVisible();
  });

  test('can add a new employee', async ({ page }) => {
    await page.goto('/payroll');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Add Employee/i }).first().click();

    await page.getByPlaceholder(/Jane Smith/i).fill('Test Employee');
    await page.getByPlaceholder(/jane@company.com/i).fill('test.emp@company.com');
    await page.getByPlaceholder(/Senior Developer/i).fill('QA Engineer');
    // Rate is required — fill salary amount
    await page.getByPlaceholder('75000').fill('60000');

    // Submit — wait for button to be enabled then click
    const submitBtn = page.getByRole('button', { name: /Add Employee/i }).last();
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();

    // New employee should appear in the list
    await expect(page.getByRole('table').getByText('Test Employee')).toBeVisible({ timeout: 10000 });
  });

  test('Run Payroll button opens dialog', async ({ page }) => {
    await page.goto('/payroll');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Run Payroll/i }).first().click();
    // Run payroll dialog
    await expect(page.getByText('Run Payroll').first()).toBeVisible();
    await expect(page.getByText(/Period Start/i)).toBeVisible();
  });
});

test.describe('Contractors Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('loads with stat cards and contractor table', async ({ page }) => {
    await page.goto('/contractors');
    await page.waitForLoadState('networkidle');

    // Stat cards
    await expect(page.getByText('Total Contractors', { exact: false })).toBeVisible();
    await expect(page.getByText('Total Paid YTD', { exact: false })).toBeVisible();
    await expect(page.getByText('Over $600', { exact: false })).toBeVisible();

    // Seed data — use table to avoid strict mode with mobile card duplicate
    await expect(page.getByRole('table').getByText('Alex Torres').first()).toBeVisible();
  });

  test('shows masked TIN in contractor table', async ({ page }) => {
    await page.goto('/contractors');
    await page.waitForLoadState('networkidle');

    // TIN should be masked — get the first matching cell
    await expect(page.getByRole('cell', { name: /\*\*\*-\*\*-/i }).first()).toBeVisible();
  });

  test('Add Contractor button opens dialog', async ({ page }) => {
    await page.goto('/contractors');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Add Contractor/i }).click();
    await expect(page.getByPlaceholder(/Alex Torres/i)).toBeVisible();
  });

  test('can add a new contractor', async ({ page }) => {
    await page.goto('/contractors');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Add Contractor/i }).click();

    await page.getByPlaceholder(/Alex Torres/i).fill('New Contractor');
    await page.getByPlaceholder(/contractor@email.com/i).fill('contractor@test.com');

    // Submit — wait for button to be enabled then click
    const submitBtn = page.getByRole('button', { name: /Add Contractor/i }).last();
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();

    await expect(page.getByRole('table').getByText('New Contractor').first()).toBeVisible({ timeout: 10000 });
  });

  test('can generate 1099 preview', async ({ page }) => {
    await page.goto('/contractors');
    await page.waitForLoadState('networkidle');

    // The 1099 preview button in the table — use the text content in the button
    const preview1099 = page.getByRole('button', { name: /1099/i }).first();
    await preview1099.click();

    // Dialog should show 1099-NEC form heading
    await expect(page.getByRole('heading', { name: /1099-NEC Form Preview/i })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Projects Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('loads with stat cards and project cards', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Stat cards
    await expect(page.getByText('Active Projects', { exact: false })).toBeVisible();
    await expect(page.getByText('Total Budget', { exact: false })).toBeVisible();

    // Seed project
    await expect(page.getByText('Website Redesign', { exact: false })).toBeVisible();
  });

  test('project cards show budget and progress bar', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Budget info should be visible
    await expect(page.getByText(/Budget/i).first()).toBeVisible();
    // Progress percentage visible
    await expect(page.getByText(/% used/i).first()).toBeVisible();
  });

  test('New Project button opens dialog', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /New Project/i }).click();
    // Dialog should open
    await expect(page.getByPlaceholder(/Website Redesign/i)).toBeVisible({ timeout: 10000 });
  });

  test('can add a new project', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /New Project/i }).click();

    await page.getByPlaceholder(/Website Redesign/i).fill('Test Project Alpha');
    await page.getByPlaceholder(/Acme Corp/i).fill('Acme Corp');

    await page.getByRole('button', { name: /Create Project/i }).click();

    await expect(page.getByRole('heading', { name: 'Test Project Alpha' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('can expand project card for details', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Click on Website Redesign card heading to expand
    await page.getByRole('heading', { name: 'Website Redesign' }).click();

    // Expanded detail should show action buttons (Edit appears in expanded view)
    await expect(page.getByRole('button', { name: /Edit/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('status filter works', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // All projects visible initially
    await expect(page.getByText('Website Redesign')).toBeVisible();

    // Filter by completed - Brand Strategy should show, active ones hidden
    const statusFilter = page.getByRole('combobox').first();
    await statusFilter.selectOption('completed');
    await expect(page.getByText('Brand Strategy')).toBeVisible({ timeout: 5000 });
    // Active project should be hidden when filtering by completed
    await expect(page.getByText('Website Redesign')).not.toBeVisible({ timeout: 5000 });
  });
});
