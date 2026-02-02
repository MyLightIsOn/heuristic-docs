import { test, expect } from '@playwright/test';

test.describe('Text Description Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analyzer');
    await page.getByRole('tab', { name: /describe/i }).click();
  });

  test('should display text input interface', async ({ page }) => {
    const textarea = page.getByPlaceholder(/describe.*component/i);
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeEditable();
  });

  test('should disable analyze button when empty', async ({ page }) => {
    const analyzeBtn = page.getByRole('button', { name: /analyze component/i });
    await expect(analyzeBtn).toBeDisabled();
  });

  test('should enable analyze button with text', async ({ page }) => {
    const textarea = page.getByPlaceholder(/describe.*component/i);
    await textarea.fill('A login form with email and password fields');

    const analyzeBtn = page.getByRole('button', { name: /analyze component/i });
    await expect(analyzeBtn).toBeEnabled();
  });

  test('should show character count', async ({ page }) => {
    const textarea = page.getByPlaceholder(/describe.*component/i);
    const testText = 'A simple button component';

    await textarea.fill(testText);

    // Should show character count
    await expect(page.getByText(new RegExp(`${testText.length}`))).toBeVisible();
  });

  test('should show error when API fails', async ({ page }) => {
    const textarea = page.getByPlaceholder(/describe.*component/i);
    await textarea.fill('A navigation menu with dropdown items and search functionality');

    // Click analyze
    await page.getByRole('button', { name: /analyze component/i }).click();

    // Wait for loading
    await expect(page.getByText(/analyzing/i)).toBeHidden({ timeout: 30000 });

    // Should show error (API will fail with test key)
    await expect(page.getByText(/error/i).first()).toBeVisible();
  });

  test('should handle long descriptions', async ({ page }) => {
    const textarea = page.getByPlaceholder(/describe.*component/i);
    const longText = 'A complex dashboard interface with multiple sections including: a top navigation bar with logo and user menu, a left sidebar with collapsible sections for navigation, a main content area with data tables showing user statistics, filtering controls at the top of the table, action buttons for each row, pagination controls at the bottom, and a footer with copyright information.';

    await textarea.fill(longText);

    const analyzeBtn = page.getByRole('button', { name: /analyze component/i });
    await expect(analyzeBtn).toBeEnabled();

    // Should show character count
    await expect(page.getByText(new RegExp(`${longText.length}`))).toBeVisible();
  });

  test('should allow retry after error', async ({ page }) => {
    const textarea = page.getByPlaceholder(/describe.*component/i);
    await textarea.fill('Test description');

    // Analyze
    await page.getByRole('button', { name: /analyze component/i }).click();
    await expect(page.getByText(/analyzing/i)).toBeHidden({ timeout: 30000 });

    // Should show error
    await expect(page.getByText(/error/i).first()).toBeVisible();

    // Should still show analyze button for retry
    const analyzeBtn = page.getByRole('button', { name: /analyze component/i });
    await expect(analyzeBtn).toBeVisible();

    // Can clear and enter new text
    await textarea.clear();
    await textarea.fill('New description');
    await expect(analyzeBtn).toBeEnabled();
  });
});
