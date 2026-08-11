import { test, expect } from '@playwright/test';

test.describe('Download game button', () => {
  test('shows the site title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MiraWebsite|mira-website/i);
  });

  test('shows the primary download button and the alternative link', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('primary-download')).toBeVisible();
    await expect(page.getByTestId('other-systems')).toBeVisible();
  });

  test('opens the OS chooser modal with all installer options', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('other-systems').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await expect(dialog.locator('li button')).toHaveCount(5);
  });

  test('closes the modal with the Escape key', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('other-systems').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
