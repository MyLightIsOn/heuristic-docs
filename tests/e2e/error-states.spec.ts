import { test, expect } from '@playwright/test';

test.describe('Error States and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analyzer');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/analyzer/match', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Try to analyze
    await page.getByLabel('Button', { exact: true }).check();
    await page.getByRole('button', { name: /^analyze$/i }).click();

    // Should show error message
    await expect(page.getByRole('heading', { name: /error/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/internal server error|failed to match heuristics/i)).toBeVisible();
  });

  test('should handle network failures', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true);

    await page.getByLabel('Button', { exact: true }).check();
    await page.getByRole('button', { name: /^analyze$/i }).click();

    // Should show error
    await expect(page.getByRole('heading', { name: /error/i })).toBeVisible({ timeout: 5000 });

    // Restore online
    await page.context().setOffline(false);
  });

  test('should handle invalid image file', async ({ page }) => {
    await page.getByRole('tab', { name: /upload image/i }).click();

    // The file input should have accept attribute to prevent invalid files
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('accept');
  });

  test('should handle empty results', async ({ page }) => {
    // Mock API returning no heuristics
    await page.route('**/api/analyzer/match', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          heuristics: [],
        }),
      });
    });

    await page.getByLabel('Button', { exact: true }).check();
    await page.getByRole('button', { name: /^analyze$/i }).click();

    await expect(page.getByText(/analyzing/i)).toBeHidden({ timeout: 10000 });

    // Should show analysis summary
    await expect(page.getByRole('heading', { name: /analysis summary/i })).toBeVisible();

    // Should show "All (0)" in filter button indicating zero results
    await expect(page.getByRole('button', { name: /all \(0\)/i })).toBeVisible();
  });

  test('should handle reset after error', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/analyzer/match', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Error' }),
      });
    });

    await page.getByLabel('Button', { exact: true }).check();
    await page.getByRole('button', { name: /^analyze$/i }).click();
    await expect(page.getByRole('heading', { name: /error/i })).toBeVisible({ timeout: 5000 });

    // Should be able to try again after error
    // Check if we can select elements again (UI should allow retry)
    await page.getByLabel('Text Input').check();
    const analyzeBtn = page.getByRole('button', { name: /^analyze$/i });
    await expect(analyzeBtn).toBeEnabled();
  });

  test('should prevent double submission', async ({ page }) => {
    await page.getByLabel('Button', { exact: true }).check();

    // Click analyze
    await page.getByRole('button', { name: /^analyze$/i }).click();

    // Button should change to "Analyzing..." and be disabled during loading
    const analyzingBtn = page.getByRole('button', { name: /analyzing/i });
    await expect(analyzingBtn).toBeVisible({ timeout: 1000 });
    await expect(analyzingBtn).toBeDisabled();
  });
});
