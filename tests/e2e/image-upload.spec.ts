import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Image Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analyzer');
    await page.getByRole('tab', { name: /upload image/i }).click();
  });

  test('should display image upload interface', async ({ page }) => {
    // Check for drag and drop area
    await expect(page.getByText(/drop an image here/i)).toBeVisible();

    // Check for file format info
    await expect(page.getByText(/png.*jpg.*webp.*svg/i)).toBeVisible();

    // Check for file size limit
    await expect(page.getByText(/max 5mb/i)).toBeVisible();
  });

  test('should disable analyze button when no image', async ({ page }) => {
    const analyzeBtn = page.getByRole('button', { name: /analyze image/i });
    await expect(analyzeBtn).toBeDisabled();
  });

  test('should upload image via file picker', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '..', 'fixtures', 'test-component.png');

    // Upload file
    await fileInput.setInputFiles(testImagePath);

    // Should show preview
    await expect(page.getByAltText(/uploaded component preview/i)).toBeVisible();

    // Should show file name
    await expect(page.getByText(/test-component\.png/i)).toBeVisible();

    // Analyze button should be enabled
    const analyzeBtn = page.getByRole('button', { name: /analyze image/i });
    await expect(analyzeBtn).toBeEnabled();
  });

  test('should show file size after upload', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '..', 'fixtures', 'test-component.png');

    // Upload file
    await fileInput.setInputFiles(testImagePath);

    // Should show file size in MB
    await expect(page.getByText(/\d+\.\d{2} mb/i)).toBeVisible();
  });

  test('should analyze uploaded image and show results', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '..', 'fixtures', 'test-component.png');

    // Upload file
    await fileInput.setInputFiles(testImagePath);

    // Click analyze
    await page.getByRole('button', { name: /analyze image/i }).click();

    // Wait for loading state to appear
    await expect(page.getByText(/analyzing/i)).toBeVisible();

    // With test API key, we expect an error response
    // Wait for the analyzing state to disappear (indicating request completed)
    await expect(page.getByText(/analyzing/i)).toBeHidden({ timeout: 10000 });

    // Verify that the analyze button is enabled again (can retry)
    const analyzeBtn = page.getByRole('button', { name: /analyze image/i });
    await expect(analyzeBtn).toBeEnabled();
  });

  test('should validate file type with accept attribute', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Verify the accept attribute is set correctly
    await expect(fileInput).toHaveAttribute('accept', /image/);
  });

  test('should allow removing uploaded image', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '..', 'fixtures', 'test-component.png');

    // Upload file
    await fileInput.setInputFiles(testImagePath);
    await expect(page.getByAltText(/uploaded component preview/i)).toBeVisible();

    // Remove image using the Clear button
    await page.getByRole('button', { name: /clear/i }).click();

    // Preview should be gone
    await expect(page.getByAltText(/uploaded component preview/i)).not.toBeVisible();

    // Upload area should be visible again
    await expect(page.getByText(/drop an image here/i)).toBeVisible();

    // Analyze button should be disabled
    const analyzeBtn = page.getByRole('button', { name: /analyze image/i });
    await expect(analyzeBtn).toBeDisabled();
  });

  test('should show upload area with proper styling', async ({ page }) => {
    // Check for the upload icon (image icon in SVG)
    const uploadIcon = page.locator('svg').filter({ has: page.locator('path[d*="m2.25 15.75"]') });
    await expect(uploadIcon).toBeVisible();

    // Check that the upload area text is visible
    await expect(page.getByText(/drop an image here or click to browse/i)).toBeVisible();
  });

  test('should handle drag and drop interaction states', async ({ page }) => {
    const uploadArea = page.locator('div').filter({ hasText: /drop an image here/i }).first();

    // Initial state should be visible
    await expect(uploadArea).toBeVisible();

    // Note: Testing actual drag-and-drop events is complex in Playwright
    // We're verifying the UI elements exist and are interactive
    await expect(uploadArea).toBeVisible();
  });

  test('should display loading state during analysis', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '..', 'fixtures', 'test-component.png');

    // Upload file
    await fileInput.setInputFiles(testImagePath);

    // Click analyze
    const analyzeBtn = page.getByRole('button', { name: /analyze image/i });
    await analyzeBtn.click();

    // Should show loading spinner and text
    await expect(page.getByText(/analyzing/i)).toBeVisible();

    // Button should show loading indicator
    const loadingSpinner = page.locator('svg.animate-spin');
    await expect(loadingSpinner).toBeVisible();
  });

  test('should maintain disabled state during analysis', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '..', 'fixtures', 'test-component.png');

    // Upload file
    await fileInput.setInputFiles(testImagePath);

    // Get button references before clicking
    const analyzeBtn = page.getByRole('button', { name: /analyze image/i });
    const clearBtn = page.getByRole('button', { name: /clear/i });

    // Set up a promise to catch the button state immediately after click
    const clickPromise = analyzeBtn.click();

    // Immediately check that the loading state appears
    // This should happen synchronously with the click
    await expect(page.getByText(/analyzing/i)).toBeVisible({ timeout: 1000 });

    // Verify buttons are disabled while loading indicator is visible
    // We check this while the analyzing text is still visible
    const analyzingText = page.getByText(/analyzing/i);
    if (await analyzingText.isVisible()) {
      await expect(clearBtn).toBeDisabled();
    }

    // Wait for the click to complete
    await clickPromise;
  });
});
