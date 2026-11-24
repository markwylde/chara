import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { createAvatar, createAvatarDataUri } from '../../../packages/chara/src/index';

const golden = fileURLToPath(new URL('../../../packages/chara/test/__golden__/', import.meta.url));

test('golden avatars rendered in Chromium match the Node snapshots', async ({ page }) => {
  await page.goto('golden.html');
  await expect(page.locator('body[data-ready="true"]')).toBeAttached();
  const outputs = JSON.parse((await page.locator('#golden').textContent()) ?? '{}') as Record<string, string>;
  const keys = Object.keys(outputs);
  expect(keys).toHaveLength(216);
  for (const key of keys) {
    expect(outputs[key], key).toBe(readFileSync(`${golden}${key}.svg`, 'utf8'));
  }
});

const state = (page: Page, value: string) => page.locator(`input[name="state"][value="${value}"]`);
const pick = (page: Page, group: string, value: string) =>
  page.locator(`input[name="${group}"][value="${value}"]`).check({ force: true });
const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

test('the built site works from /chara/', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', (r) => {
    if (r.url().startsWith('http://localhost:4173') && r.status() >= 400)
      failed.push(`${r.status()} ${r.url()}`);
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('');
  await expect(page.getByRole('heading', { name: 'Chara', level: 1 })).toBeVisible();
  await expect(page.locator('.theme-tabs label')).toHaveCount(3);
  await expect(page.locator('.stage svg')).toHaveCount(2);
  expect(failed).toEqual([]);
  expect(errors).toEqual([]);
});

test('typing a name updates every theme', async ({ page }) => {
  await page.goto('?v=0');
  await page.locator('#name-input').fill('Claudette');
  for (const theme of ['mecha', 'critter', 'sigil'] as const) {
    // Ids are derived from the theme, name and radius, so a matching clip id means the same avatar.
    const id = /<clipPath id="([^"]+)"/.exec(createAvatar('Claudette', { theme, radius: 24 }))![1]!;
    await expect(page.locator(`.theme-tabs label[data-theme-id="${theme}"] svg clipPath#${id}`)).toHaveCount(
      1,
    );
    await pick(page, 'theme', theme);
    await expect(page.locator(`.stage svg clipPath#${id}`)).toHaveCount(2);
  }
});

test('maximum radius shows circles', async ({ page }) => {
  await page.goto('?v=0');
  await page.locator('#radius-input').fill('50');
  const rx = await page
    .locator('.stage figure svg defs > clipPath > rect')
    .evaluateAll((els) => els.map((el) => el.getAttribute('rx')));
  expect(rx.length).toBe(2);
  expect(new Set(rx)).toEqual(new Set(['50']));
  await page.getByRole('button', { name: 'Square' }).click();
  await expect(page.locator('#radius-input')).toHaveValue('0');
});

test('the gallery follows the theme, size and count, and loads a name when picked', async ({ page }) => {
  await page.goto('?v=0');
  await pick(page, 'theme', 'sigil');
  await expect(page.locator('ul.grid')).toHaveAttribute('data-gallery-theme', 'sigil');
  await expect(page.locator('ul.grid svg')).toHaveCount(20);
  await pick(page, 'gallery-count', '80');
  await expect(page.locator('ul.grid svg')).toHaveCount(80);
  await page.locator('#gallery-size-input').fill('120');
  await expect(page.locator('ul.grid svg').first()).toHaveAttribute('width', '120');
  await page.getByRole('button', { name: 'Use Biscuit' }).click();
  await expect(page.locator('#name-input')).toHaveValue('Biscuit');
});

test('gallery and app examples animate when animation is on', async ({ page }) => {
  await page.goto('');
  await expect(page.locator('ul.grid svg[data-state="idle"]')).toHaveCount(20);
  await state(page, 'working').check({ force: true });
  await expect(page.locator('ul.grid svg[data-state="working"]')).toHaveCount(20);
  // With mixed statuses each bot has its own state; the visitor's own name follows the studio.
  await expect(page.locator('.sidebar svg[data-state="working"]')).toHaveCount(2);
  await expect(page.locator('.sidebar svg[data-state="thinking"]')).toHaveCount(1);
  await expect(page.locator('.sidebar svg[data-state="sleeping"][data-mono]')).toHaveCount(1);
  await page.locator('#statuses-input').uncheck({ force: true });
  await expect(page.locator('.sidebar svg[data-state="working"]')).toHaveCount(5);
  const running = await page.evaluate(
    () => document.querySelector('ul.grid')!.getAnimations({ subtree: true }).length,
  );
  expect(running).toBeGreaterThan(0);
  await page.locator('#animate-input').uncheck({ force: true });
  await expect(page.locator('ul.grid svg[data-state], .mocks svg[data-state]')).toHaveCount(0);
});

test('the app examples have their own icon size and surface', async ({ page }) => {
  await page.goto('');
  await expect(page.locator('.sidebar svg').first()).toHaveAttribute('width', '28');
  await page.locator('#icon-size-input').fill('56');
  for (const svg of await page.locator('.sidebar svg, .thread svg').all()) {
    await expect(svg).toHaveAttribute('width', '56');
  }
  await expect(page.locator('.stage svg').first()).toHaveAttribute('width', '200');
  await pick(page, 'tone', 'light');
  await expect(page.locator('.mocks')).toHaveClass(/light/);
});

test('backdrops', async ({ page }) => {
  await page.goto('');
  await expect(page.locator('.stage .pane')).toHaveCount(2);
  await pick(page, 'backdrop', 'clear');
  await expect(page.locator('.stage .pane.clear')).toHaveCount(1);
  await page.locator('#backdrop-color').fill('#ff0000');
  await expect(page.locator('.stage .pane.custom')).toHaveCSS('background-color', 'rgb(255, 0, 0)');
});

test('settings live in the URL and survive a reload', async ({ page }) => {
  await page.goto('');
  expect(new URL(page.url()).search).toBe('');
  await page.locator('#name-input').fill('Biscuit & co');
  await pick(page, 'theme', 'mecha');
  await page.locator('#size-input').fill('128');
  await state(page, 'sleeping').check({ force: true });
  await page.locator('#mono-input').check({ force: true });
  await expect.poll(() => new URL(page.url()).searchParams.get('n')).toBe('Biscuit & co');
  await page.reload();
  await expect(page.locator('#name-input')).toHaveValue('Biscuit & co');
  await expect(
    page.locator('.stage svg.chara-mecha[data-state="sleeping"][data-mono][width="128"]'),
  ).toHaveCount(2);
  await page.locator('#reset').click();
  await expect(page.locator('#name-input')).toHaveValue('Maple');
  await expect.poll(() => new URL(page.url()).search).toBe('');
});

test('cycling steps through the states', async ({ page }) => {
  await page.goto('');
  await page.locator('#cycle-input').check({ force: true });
  await expect(page.locator('.stage svg[data-state="thinking"]')).toHaveCount(2, { timeout: 6000 });
  await state(page, 'error').check({ force: true });
  await expect(page.locator('#cycle-input')).not.toBeChecked();
});

test('advanced options: title, id prefix and exact names', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('?v=0');
  await page.locator('summary').click();
  await expect(page.locator('.stage svg').first()).toHaveAttribute('aria-hidden', 'true');
  await page.locator('#title-input').fill('Maple the bot');
  await expect(page.locator('.stage svg[role="img"] > title')).toHaveText('Maple the bot');
  await page.locator('#prefix-input').fill('9 bad');
  await expect(page.locator('#prefix-input')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#prefix-input').fill('row_');
  await expect(page.locator('.stage svg clipPath[id^="row_"][id$="-frame"]')).toHaveCount(2);
  const before = await page.locator('.stage svg').first().innerHTML();
  await page.locator('#name-input').fill(' MAPLE ');
  expect(await page.locator('.stage svg').first().innerHTML()).toBe(before);
  await page.locator('#normalize-input').uncheck({ force: true });
  expect(await page.locator('.stage svg').first().innerHTML()).not.toBe(before);
  expect(errors).toEqual([]);
});

test('Copy SVG puts the avatar on the clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('?v=0&s=96&t=sigil');
  await pick(page, 'output', 'svg');
  await page.locator('#copy-output').click();
  await expect(page.locator('#notice')).toContainText('Copied Sigil SVG');
  expect(await clipboard(page)).toBe(createAvatar('Maple', { theme: 'sigil', size: 96, radius: 24 }));
});

test('Copy React copies a snippet with the current options', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('?v=0&s=96');
  await page.locator('#name-input').fill('Ma"p{le}');
  await page.locator('#radius-input').fill('50');
  await expect(page.locator('#output-code')).toContainText('radius={50}');
  await page.locator('#copy-output').click();
  expect(await clipboard(page)).toContain(
    '<Avatar name={"Ma\\"p{le}"} theme="critter" size={96} radius={50} />',
  );
});

test('JavaScript, data URI and link outputs', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('?t=mecha&s=64');
  await pick(page, 'output', 'js');
  await page.locator('#copy-output').click();
  await expect(page.locator('#notice')).toContainText('Copied Mecha JavaScript snippet');
  expect(await clipboard(page)).toContain(
    "createAvatar(\"Maple\", {\n  theme: 'mecha',\n  size: 64,\n  variant: 'standalone',\n  animated: true,\n});",
  );
  await pick(page, 'output', 'uri');
  await page.locator('#copy-output').click();
  await expect(page.locator('#notice')).toContainText('data URI');
  expect(await clipboard(page)).toBe(
    createAvatarDataUri('Maple', { theme: 'mecha', size: 64, variant: 'standalone', animated: true }),
  );
  await page.locator('#copy-link').click();
  await expect(page.locator('#notice')).toContainText('Copied link');
  expect(await clipboard(page)).toBe(page.url());
});

test('a refused clipboard falls back to selected text', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
    });
  });
  await page.goto('?t=mecha');
  await pick(page, 'output', 'svg');
  await page.locator('#copy-output').click();
  await expect(page.locator('#notice')).toContainText("Couldn't copy Mecha SVG automatically");
  const fallback = page.locator('#copy-fallback');
  await expect(fallback).toBeVisible();
  const selected = await fallback.evaluate((el: HTMLTextAreaElement) =>
    el.value.slice(el.selectionStart, el.selectionEnd),
  );
  expect(selected.startsWith('<svg')).toBe(true);
});

test('the page appearance can be forced', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('');
  const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await pick(page, 'appearance', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(light);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
