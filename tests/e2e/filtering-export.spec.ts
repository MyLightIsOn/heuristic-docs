import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Filtering and Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analyzer');

    // Select elements and analyze
    await page.getByLabel('Button', { exact: true }).check();
    await page.getByLabel('Text Input').check();
    await page.getByRole('button', { name: /^analyze$/i }).click();
    await expect(page.getByText(/analyzing/i)).toBeHidden({ timeout: 10000 });
  });

  test.describe('Filtering', () => {
    test('should show all heuristics by default', async ({ page }) => {
      // All filter should be active (default variant)
      const allFilter = page.getByRole('button', { name: /all \(\d+\)/i });
      await expect(allFilter).toBeVisible();

      // Should display cards
      const cards = page.locator('[data-testid="heuristic-card"]');
      await expect(cards.first()).toBeVisible();
    });

    test('should filter by designer', async ({ page }) => {
      // Click designer filter
      await page.getByRole('button', { name: /designer \(\d+\)/i }).click();

      // Should show designer heuristics
      const cards = page.locator('[data-testid="heuristic-card"]');
      await expect(cards.first()).toBeVisible();
    });

    test('should filter by developer', async ({ page }) => {
      // Click developer filter
      await page.getByRole('button', { name: /developer \(\d+\)/i }).click();

      // Should show developer heuristics
      const cards = page.locator('[data-testid="heuristic-card"]');
      await expect(cards.first()).toBeVisible();
    });

    test('should switch between filters', async ({ page }) => {
      // Filter by designer
      await page.getByRole('button', { name: /designer \(\d+\)/i }).click();
      await expect(page.locator('[data-testid="heuristic-card"]').first()).toBeVisible();

      // Switch to developer
      await page.getByRole('button', { name: /developer \(\d+\)/i }).click();
      await expect(page.locator('[data-testid="heuristic-card"]').first()).toBeVisible();

      // Switch back to all
      await page.getByRole('button', { name: /all \(\d+\)/i }).click();
      await expect(page.locator('[data-testid="heuristic-card"]').first()).toBeVisible();
    });
  });

  test.describe('Export', () => {
    test('should display export button', async ({ page }) => {
      const exportBtn = page.getByRole('button', { name: /export/i });
      await expect(exportBtn).toBeVisible();
      await expect(exportBtn).toBeEnabled();
    });

    test('should show export options dropdown', async ({ page }) => {
      await page.getByRole('button', { name: /export/i }).click();

      await expect(page.getByRole('menuitem', { name: /pdf/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /markdown/i })).toBeVisible();
    });

    test('should download markdown file', async ({ page }) => {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');

      // Click export
      await page.getByRole('button', { name: /export/i }).click();
      await page.getByRole('menuitem', { name: /markdown/i }).click();

      // Wait for download
      const download = await downloadPromise;

      // Check filename pattern
      expect(download.suggestedFilename()).toMatch(/a11y-checklist-\d{4}-\d{2}-\d{2}\.md/);

      // Save and verify content
      const downloadPath = path.join(__dirname, '..', 'downloads', download.suggestedFilename());
      await download.saveAs(downloadPath);

      const content = fs.readFileSync(downloadPath, 'utf-8');
      expect(content).toContain('# Accessibility Heuristics Checklist');
      expect(content).toContain('- [ ]');

      // Cleanup
      fs.unlinkSync(downloadPath);
    });

    test('should download PDF file', async ({ page }) => {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');

      // Click export
      await page.getByRole('button', { name: /export/i }).click();
      await page.getByRole('menuitem', { name: /pdf/i }).click();

      // Wait for download
      const download = await downloadPromise;

      // Check filename pattern
      expect(download.suggestedFilename()).toMatch(/a11y-checklist-\d{4}-\d{2}-\d{2}\.pdf/);

      // Save file (can't easily verify PDF content in E2E test)
      const downloadPath = path.join(__dirname, '..', 'downloads', download.suggestedFilename());
      await download.saveAs(downloadPath);

      // Verify file exists and has content
      const stats = fs.statSync(downloadPath);
      expect(stats.size).toBeGreaterThan(0);

      // Cleanup
      fs.unlinkSync(downloadPath);
    });
  });
});
