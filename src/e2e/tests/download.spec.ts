import { test, expect } from '@playwright/test';

test.describe('Download game button', () => {
  test('shows the site title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MiraWebsite|mira-website/i);
  });

  test('shows the primary download button and the alternative link', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('primary-download')).toBeVisible();
    await expect(page.getByTestId('other-systems')).toBeVisible();
  });

  test('opens the OS chooser modal with all installer links', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('other-systems').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const links = dialog.locator('a[href]');
    await expect(links).toHaveCount(5);

    const hrefs = await links.evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? ''),
    );
    for (const href of hrefs) {
      // Links should point at the installer endpoint and include either a versioned installer
      // filename or the macOS install script.
      expect(href).toMatch(
        /localhost:8080\/downloads\/game-sources\/installer\/(install-macos\.sh|mira-installer-\d+\.\d+\.\d+-)/,
      );
    }
  });

  test('closes the modal with the Escape key', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('other-systems').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
