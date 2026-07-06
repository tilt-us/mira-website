import { test, expect } from '@playwright/test';

test.describe('Main page', () => {
  test('shows the hero, news, events and a Discord link', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'Mira', level: 1 }),
    ).toBeVisible();
    await expect(page.locator('#news')).toBeVisible();
    await expect(page.locator('#events')).toBeVisible();
    await expect(page.getByTestId('discord-link')).toBeVisible();
  });
});
