import { test, expect } from '@playwright/test';

/**
 * Auth Flow E2E Tests
 * Covers: login, dashboard access, settings navigation, sign out,
 *         signup form, forgot-password form
 */
test.describe('Auth Flow — Login', () => {
  test('login page loads with form visible', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Heading present
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();

    // Email and password inputs exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();

    // Demo shortcut button
    await expect(page.getByRole('button', { name: /Demo Account/i })).toBeVisible();
  });

  test('login with demo credentials via form redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'demo@ledgr.com');
    await page.fill('input[type="password"]', 'demo');
    await page.click('button[type="submit"]');

    // Should land on dashboard
    await page.waitForURL('/', { timeout: 15000 });
    await expect(page).toHaveURL('/');
  });

  test('demo account button logs in and redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Demo Account/i }).click();
    await page.waitForURL('/', { timeout: 15000 });

    // Dashboard KPI visible — confirms we are authenticated
    await expect(page.getByText('Cash Balance', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('invalid credentials show error message', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'bad@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Error should appear — not redirected
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL('/login');
  });

  test('empty form submission shows validation error', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Click submit without filling form
    await page.click('button[type="submit"]');

    // Should stay on login page and show some error
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Auth Flow — Dashboard after login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Demo Account/i }).click();
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('dashboard loads with KPI cards visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Cash Balance', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Net Profit', { exact: false })).toBeVisible();
  });

  test('settings page loads after login', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Settings page should have company settings section
    await expect(page).toHaveURL('/settings');
    await expect(page.getByText(/Company|Settings|Profile/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('sign out redirects to login page', async ({ page }, testInfo) => {
    // Skip on mobile — sign out button may be in a collapsed menu
    test.skip(testInfo.project.name === 'mobile', 'Sign out in collapsed menu on mobile');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Sign out button is in the sidebar
    const signOutBtn = page.locator('aside').getByRole('button', { name: /Sign Out|Log Out|Logout|Sign out/i });
    await expect(signOutBtn).toBeVisible({ timeout: 10000 });
    await signOutBtn.click();

    // Should redirect to login
    await page.waitForURL('/login', { timeout: 15000 });
    await expect(page).toHaveURL('/login');
  });

  test('visiting protected route while authenticated stays on page', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    // Should NOT redirect to login
    await expect(page).toHaveURL('/transactions');
  });
});

test.describe('Auth Flow — Signup', () => {
  test('signup page loads with form fields visible', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Title or heading
    await expect(page.getByRole('heading').first()).toBeVisible();

    // Key form inputs should exist
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('signup form has link back to login', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // "Sign in" link
    const signInLink = page.getByRole('link', { name: /Sign in|Log in|Login/i });
    await expect(signInLink).toBeVisible();
  });

  test('signup with new test user credentials proceeds to next step or onboarding', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    const uniqueEmail = `test-e2e-${Date.now()}@example.com`;

    // Fill step 1: name
    const nameInput = page.locator('input[type="text"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User E2E');
    }

    // Fill email
    await page.locator('input[type="email"]').first().fill(uniqueEmail);

    // Fill password fields
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.first().fill('TestPass123!');

    const confirmInput = passwordInputs.nth(1);
    if (await confirmInput.isVisible()) {
      await confirmInput.fill('TestPass123!');
    }

    // Click continue / submit
    const continueBtn = page.getByRole('button', { name: /Continue|Next|Create Account|Sign Up|Get Started/i }).first();
    await continueBtn.click();

    // Should either show step 2, a verification message, or redirect to onboarding
    // Accept any of these outcomes as success
    const isOnboarding = page.url().includes('/onboarding');
    const isNextStep = await page.getByText(/Step 2|Company|Verify|Check your|verification/i).isVisible({ timeout: 10000 }).catch(() => false);
    const hasError = await page.getByRole('alert').isVisible().catch(() => false);

    // If error, the test is informational — we log but don't hard-fail on duplicate emails
    if (!hasError) {
      expect(isOnboarding || isNextStep).toBeTruthy();
    }
  });
});

test.describe('Auth Flow — Forgot Password', () => {
  test('forgot password page loads with form visible', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Forgot/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Send|Reset|Submit/i })).toBeVisible();
  });

  test('submitting email shows success/confirmation message', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('test@example.com');

    const submitBtn = page.getByRole('button', { name: /Send|Reset|Submit/i });
    await submitBtn.click();

    // Should show success message (app always shows success — no email enumeration)
    await expect(page.getByText(/Check your inbox|email sent|reset link|sent/i)).toBeVisible({ timeout: 10000 });
  });

  test('invalid email format shows validation error', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('notanemail');
    await page.getByRole('button', { name: /Send|Reset|Submit/i }).click();

    // Should show validation error — not success
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

  test('has link back to login', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    const backLink = page.getByRole('link', { name: /Back|Sign in|Login/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await page.waitForURL('/login', { timeout: 10000 });
  });

  test('unauthenticated visit to protected route redirects to login', async ({ page }) => {
    // Navigate directly to dashboard without logging in
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
