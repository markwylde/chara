import { expect, type Page, test } from '@playwright/test';

// Captures the playground's key states for review. Runs only when SCREENSHOT_DIR is set:
//   SCREENSHOT_DIR=/path/to/dir npm run test:e2e
const dir = process.env.SCREENSHOT_DIR;
test.skip(!dir, 'Set SCREENSHOT_DIR to capture screenshots');

const shot = (name: string) => `${dir}/${name}.png`;

const pick = (page: Page, group: string, value: string) =>
  page.locator(`input[name="${group}"][value="${value}"]`).check({ force: true });

test('screenshots of the studio', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 1360, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('?n=Claudette');
  await page.waitForTimeout(600);
  await page.screenshot({ path: shot('01-studio-dark'), fullPage: true });

  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('?n=Claudette&t=mecha&st=working&is=44&ct=light');
  await page.waitForTimeout(600);
  await page.screenshot({ path: shot('02-studio-light-mecha-working'), fullPage: true });

  await page.goto('?n=Claudette&v=0&r=50&s=160&t=sigil&bg=clear');
  await page.locator('#copy-output').click();
  await expect(page.locator('#notice')).toContainText('Copied');
  await page.locator('main.studio').screenshot({ path: shot('03-tile-circle-copied') });

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('?n=Claudette&is=56&st=thinking');
  await page.waitForTimeout(600);
  await page.locator('section.context').screenshot({ path: shot('04-in-your-app-large-icons') });

  await page.goto('?n=Claudette&st=success&gc=40&gs=96');
  await page.waitForTimeout(600);
  await page.locator('section.gallery').screenshot({ path: shot('05-gallery-animated') });

  await page.goto('?n=Claudette&st=sleeping&m=1&bg=custom&bc=%23ffd9a8');
  await page.locator('summary').click();
  await page.waitForTimeout(1200);
  await page.locator('main.studio').screenshot({ path: shot('06-sleeping-mono-custom-backdrop') });

  await page.setViewportSize({ width: 400, height: 860 });
  await page.goto('?n=Claudette');
  await page.screenshot({ path: shot('07-mobile'), fullPage: true });
});

test('screenshot of the clipboard fallback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
    });
  });
  await page.setViewportSize({ width: 1360, height: 900 });
  await page.goto('');
  await pick(page, 'output', 'svg');
  await page.locator('#copy-output').click();
  await expect(page.locator('#copy-fallback')).toBeVisible();
  await page.locator('main.studio').screenshot({ path: shot('08-clipboard-fallback') });
});

test('screenshot of every state', async ({ page }) => {
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
