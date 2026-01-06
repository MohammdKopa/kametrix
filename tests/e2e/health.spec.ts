import { test, expect } from '@playwright/test';

/**
 * Smoke tests for Kametrix application
 * These tests verify basic functionality is working
 *
 * Tags:
 * - @smoke: Quick health verification tests
 * - @critical: Critical path tests that must pass
 */

test.describe('Health Check @smoke', () => {
  test('API health endpoint returns OK', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('status');
  });

  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Kametrix/i);
  });
});

test.describe('Authentication Pages @smoke', () => {
  test('Login page loads', async ({ page }) => {
    await page.goto('/login');

    // Check for login form elements
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByRole('button', { name: /login|anmelden|sign in/i })).toBeVisible();
  });

  test('Register page loads', async ({ page }) => {
    await page.goto('/register');

    // Check for registration form
    await expect(page.locator('form')).toBeVisible();
  });
});

test.describe('Critical Paths @critical @smoke', () => {
  test('Navigation works', async ({ page }) => {
    await page.goto('/');

    // Verify page loads without errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check no critical console errors (filter out expected warnings)
    const criticalErrors = consoleErrors.filter(
      error => !error.includes('404') && !error.includes('hydration')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('Static assets load correctly', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('requestfailed', request => {
      // Only track critical asset failures
      const url = request.url();
      if (url.includes('/_next/') || url.includes('/images/')) {
        failedRequests.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(failedRequests).toHaveLength(0);
  });
});

test.describe('API Endpoints @smoke', () => {
  test('Health endpoint structure is correct', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Verify expected health check structure
    expect(data.status).toBeDefined();
  });
});
