import { test, expect } from '@playwright/test';

test('has app title', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/MiraWebsite|mira-website/i);
});

test('shows greeting', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hello, mira-website' })).toBeVisible();
});
