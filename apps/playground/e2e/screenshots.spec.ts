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

test('screenshots of standalone and animated characters', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('');
  await page.locator('#name-input').fill('Claudette');
  await page.getByRole('radio', { name: 'Standalone' }).check({ force: true });
  await page.locator('#size-input').fill('200');
  await page.screenshot({ path: shot('09-standalone-light'), fullPage: true });

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.locator('#animate-input').check();
  await page.locator('#state-input').selectOption('sleeping');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: shot('10-standalone-sleeping-dark'), fullPage: true });

  await page.emulateMedia({ colorScheme: 'light' });
  await page.locator('#state-input').selectOption('error');
  await page.waitForTimeout(700);
  await page.locator('main.themes').screenshot({ path: shot('11-error-glow') });

  await page.locator('#state-input').selectOption('idle');
  await page.locator('#mono-input').check();
  await page.locator('main.themes').screenshot({ path: shot('12-no-colour') });

  // Every state of every theme, side by side
  await page.goto('lab.html');
  await expect(page.locator('body[data-ready="true"]')).toBeAttached();
  await page.evaluate(() => {
    const { createAvatar, THEME_IDS, STATES } = window.chara;
    const stage = document.getElementById('stage')!;
    document.querySelector('p')?.remove();
    document.body.style.cssText =
      'margin:0;font:500 13px ui-monospace,monospace;background:#f4f4f1;color:#62656f';
    stage.style.cssText =
      'display:grid;grid-template-columns:repeat(7,150px);gap:6px 10px;padding:24px;text-align:center;width:max-content';
    let html = '';
    for (const label of [...STATES, 'no colour']) html += `<div>${label}</div>`;
    for (const theme of THEME_IDS) {
      for (const state of STATES) {
        html += createAvatar('Claudette', { theme, variant: 'standalone', animated: true, state, size: 150 });
      }
      html += createAvatar('Claudette', { theme, variant: 'standalone', mono: true, size: 150 });
    }
    stage.innerHTML = html;
  });
  await page.waitForTimeout(1300);
  await page.locator('#stage').screenshot({ path: shot('13-every-state') });
});
