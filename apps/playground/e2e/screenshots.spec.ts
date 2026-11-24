import { expect, test } from '@playwright/test';

// Captures the playground's key states for review. Runs only when SCREENSHOT_DIR is set:
//   SCREENSHOT_DIR=/path/to/dir npm run test:e2e
const dir = process.env.SCREENSHOT_DIR;
test.skip(!dir, 'Set SCREENSHOT_DIR to capture screenshots');

const shot = (name: string) => `${dir}/${name}.png`;

test('screenshots of key states', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto('');
  await page.locator('#name-input').fill('Claudette');
  await page.screenshot({ path: shot('01-overview-light'), fullPage: true });

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: shot('02-overview-dark'), fullPage: true });

  await page.locator('#radius-input').fill('50');
  await page.locator('#size-input').fill('140');
  await page.locator('section[data-theme-id="sigil"]').screenshot({ path: shot('03-sigil-circle-large') });

  await page.locator('#radius-input').fill('24');
  await page.getByRole('radio', { name: 'Critter' }).check({ force: true });
  await page.locator('section.gallery').screenshot({ path: shot('04-gallery-critter') });
  await page.getByRole('radio', { name: 'Sigil' }).check({ force: true });
  await page.locator('section.gallery').screenshot({ path: shot('05-gallery-sigil') });

  await page.locator('section[data-theme-id="critter"]').getByRole('button', { name: 'Copy React' }).click();
  await expect(page.locator('#notice')).toContainText('Copied');
  await page.screenshot({ path: shot('06-copied-confirmation') });

  await page.setViewportSize({ width: 400, height: 860 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('');
  await page.screenshot({ path: shot('07-mobile'), fullPage: false });
});

test('screenshot of the clipboard fallback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
    });
  });
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto('');
  await page.locator('section[data-theme-id="mecha"]').getByRole('button', { name: 'Copy SVG' }).click();
  await expect(page.locator('#copy-fallback')).toBeVisible();
  await page.screenshot({ path: shot('08-clipboard-fallback') });
});
