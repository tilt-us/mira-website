import { test, expect } from '@playwright/test';

test.describe('Main page', () => {
  test('shows the hero, the combined news section and a Discord link', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Mira', level: 1 })).toBeVisible();
    await expect(page.locator('#news')).toBeVisible();
    // News and events live in one carousel now.
    await expect(page.getByTestId('event-carousel')).toHaveCount(1);
    await expect(page.getByTestId('discord-link')).toBeVisible();
  });

  test('lets the visitor look up a champion', async ({ page }) => {
    await page.goto('/');

    const tabs = page.getByTestId('character-tab');
    await expect(tabs).toHaveCount(4);
    await expect(page.getByTestId('showcase-name')).toHaveText('Lira');

    await tabs.nth(1).click();
    await expect(page.getByTestId('showcase-name')).toHaveText('Ignara');
  });

  test('keeps the header fixed while scrolling', async ({ page }) => {
    await page.goto('/');

    const header = page.getByTestId('site-header');
    await page.mouse.wheel(0, 1500);
    await expect(header).toBeVisible();
    // Still glued to the viewport top after scrolling.
    expect((await header.boundingBox())?.y).toBe(0);
  });

  test('links to the jobs page from the footer', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('navigation', { name: 'Company' }).getByText('Jobs').click();
    await expect(page).toHaveURL(/\/jobs$/);
    await expect(page.getByRole('heading', { name: 'Join the team', level: 1 })).toBeVisible();
  });
});
