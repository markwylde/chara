import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { createAvatar } from '../../../packages/chara/src/index';

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
  await expect(page.locator('section.sheet')).toHaveCount(3);
  expect(failed).toEqual([]);
  expect(errors).toEqual([]);
});

test('typing a name updates every theme', async ({ page }) => {
  await page.goto('');
  await page.locator('#name-input').fill('Claudette');
  for (const theme of ['mecha', 'critter', 'sigil'] as const) {
    const svg = page.locator(`section[data-theme-id="${theme}"] figure.light svg`);
    await expect(svg.locator('title')).toHaveText(new RegExp(`^Claudette, ${theme}`, 'i'));
    const html = await svg.evaluate((el) => el.outerHTML);
    const expected = createAvatar('Claudette', {
      theme,
      size: 96,
      radius: 24,
      title: `Claudette, ${theme[0]!.toUpperCase()}${theme.slice(1)}`,
    });
    // Ids are derived from the theme, name and radius, so a matching clip id means the same avatar.
    expect(html).toContain(/<clipPath id="([^"]+)"/.exec(expected)![1]!);
  }
});

test('maximum radius shows circles', async ({ page }) => {
  await page.goto('');
  await page.locator('#radius-input').fill('50');
  const rx = await page
    .locator('section.sheet figure svg defs > clipPath > rect')
    .evaluateAll((els) => els.map((el) => el.getAttribute('rx')));
  expect(rx.length).toBe(6);
  expect(new Set(rx)).toEqual(new Set(['50']));
});

test('the gallery follows the selected theme', async ({ page }) => {
  await page.goto('');
  await page.getByRole('radio', { name: 'Critter' }).check({ force: true });
  await expect(page.locator('ul.grid')).toHaveAttribute('data-gallery-theme', 'critter');
  const ids = await page.locator('ul.grid svg defs > clipPath').evaluateAll((els) => els.map((el) => el.id));
  expect(ids.length).toBe(40); // frame + body clip for each of the 20 names
});

test('Copy SVG puts the avatar on the clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('');
  await page.locator('#name-input').fill('Maple');
  await page.locator('section[data-theme-id="sigil"]').getByRole('button', { name: 'Copy SVG' }).click();
  await expect(page.locator('#notice')).toContainText('Copied Sigil SVG');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toBe(createAvatar('Maple', { theme: 'sigil', size: 96, radius: 24 }));
});

test('Copy React copies a snippet with the current options', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('');
  await page.locator('#name-input').fill('Ma"p{le}');
  await page.locator('#radius-input').fill('50');
  await page.locator('section[data-theme-id="critter"]').getByRole('button', { name: 'Copy React' }).click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('<Avatar name={"Ma\\"p{le}"} theme="critter" size={96} radius={50} />');
});

test('a refused clipboard falls back to selected text', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
    });
  });
  await page.goto('');
  await page.locator('section[data-theme-id="mecha"]').getByRole('button', { name: 'Copy SVG' }).click();
  await expect(page.locator('#notice')).toContainText("Couldn't copy Mecha SVG automatically");
  const fallback = page.locator('#copy-fallback');
  await expect(fallback).toBeVisible();
  const selected = await fallback.evaluate((el: HTMLTextAreaElement) =>
    el.value.slice(el.selectionStart, el.selectionEnd),
  );
  expect(selected.startsWith('<svg')).toBe(true);
});
