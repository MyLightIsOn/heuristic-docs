import { test, expect } from '@playwright/test';

test.describe('Element Picker Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analyzer');
  });

  test('should display element picker by default', async ({ page }) => {
    const pickerTab = page.getByRole('tab', { name: /pick elements/i });
    await expect(pickerTab).toBeVisible();
    await expect(pickerTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should enable analyze button when elements selected', async ({ page }) => {
    // Initially disabled
    const analyzeBtn = page.getByRole('button', { name: /^analyze$/i });
    await expect(analyzeBtn).toBeDisabled();

    // Select a button element
    await page.getByLabel('Button', { exact: true }).check();
    await expect(analyzeBtn).toBeEnabled();

    // Check selection count
    await expect(page.getByText(/1 element selected/i)).toBeVisible();
  });

  test('should analyze elements and show results', async ({ page }) => {
    // Select multiple elements
    await page.getByLabel('Button', { exact: true }).check();
    await page.getByLabel('Text Input').check();
    await page.getByLabel('Checkbox', { exact: true }).check();

    // Should show 3 selected
    await expect(page.getByText(/3 elements selected/i)).toBeVisible();

    // Click analyze
    await page.getByRole('button', { name: /^analyze$/i }).click();

    // Wait for loading to complete
    await expect(page.getByText(/analyzing/i)).toBeHidden({ timeout: 10000 });

    // Should show results header
    await expect(page.getByRole('heading', { name: /analysis summary/i })).toBeVisible();

    // Should display heuristic cards
    const cards = page.locator('[data-testid="heuristic-card"]');
    await expect(cards.first()).toBeVisible();
  });

  test('should allow deselecting elements', async ({ page }) => {
    // Select element
    await page.getByLabel('Button', { exact: true }).check();
    await expect(page.getByText(/1 element selected/i)).toBeVisible();

    // Deselect
    await page.getByLabel('Button', { exact: true }).uncheck();
    await expect(page.getByText(/0 elements selected/i)).toBeVisible();

    // Analyze button should be disabled
    const analyzeBtn = page.getByRole('button', { name: /^analyze$/i });
    await expect(analyzeBtn).toBeDisabled();
  });

  test('should handle all element groups', async ({ page }) => {
    // Form Elements
    await page.getByLabel('Text Input').check();
    await page.getByLabel('Checkbox', { exact: true }).check();

    // Interactive
    await page.getByLabel('Button', { exact: true }).check();
    await page.getByLabel('Modal / Dialog').check();

    // Content
    await page.getByLabel('Heading').check();
    await page.getByLabel('Paragraph').check();

    // Media
    await page.getByLabel('Image', { exact: true }).check();

    await expect(page.getByText(/7 elements selected/i)).toBeVisible();
  });
});
