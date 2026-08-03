import { test, expect } from '@playwright/test';

test.describe('Jobs page', () => {
  test('lists the open positions', async ({ page }) => {
    await page.goto('/jobs');

    await expect(page.getByRole('heading', { name: 'Join the team', level: 1 })).toBeVisible();
    await expect(page.getByTestId('job-card')).toHaveCount(2);
    await expect(page.getByTestId('job-count')).toContainText('2 open positions');
  });

  test('expands a posting and offers an email application', async ({ page }) => {
    await page.goto('/jobs');

    await page.getByRole('button', { name: /Developer/ }).click();
    const detail = page.getByTestId('job-details');
    await expect(detail).toBeVisible();
    await expect(detail).toContainText('Proficiency in Rust, Java or TypeScript');
    await expect(detail).toContainText('Approx. €400–€500 per month');
    await expect(page.getByTestId('job-apply')).toHaveAttribute(
      'href',
      /^mailto:jobs@tilt-us\.com\?subject=/,
    );
  });
});
