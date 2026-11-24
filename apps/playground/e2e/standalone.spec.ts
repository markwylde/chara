import { expect, type Page, test } from '@playwright/test';
import { createAvatar } from '../../../packages/chara/src/index';

const GREY = /^rgba?\((\d+), \1, \1(, [\d.]+)?\)$/;

const pick = (page: Page, group: string, value: string) =>
  page.locator(`input[name="${group}"][value="${value}"]`).check({ force: true });
const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());
/** Everything that follows the studio's look; the state picker itself always shows animated previews. */
const FOLLOWERS = '.stage svg, .mocks svg, ul.grid svg';

async function lab(page: Page) {
  await page.goto('lab.html');
  await expect(page.locator('body[data-ready="true"]')).toBeAttached();
}

test.describe('playground controls', () => {
  test('standalone previews have no background', async ({ page }) => {
    await page.goto('?v=0');
    await expect(page.locator('.stage svg clipPath[id$="-frame"]')).toHaveCount(2);
    await pick(page, 'variant', 'standalone');
    await expect(page.locator('.stage svg.chara')).toHaveCount(2);
    await expect(page.locator('.stage svg rect[width="100"][height="100"]')).toHaveCount(0);
    await expect(page.locator('.stage svg clipPath[id$="-frame"]')).toHaveCount(0);
    // the gallery and the app examples follow the variant
    await expect(page.locator('ul.grid svg.chara')).toHaveCount(20);
    await expect(page.locator('.sidebar svg.chara')).toHaveCount(5);
  });

  test('a chosen state applies to the stage', async ({ page }) => {
    await page.goto('?t=mecha');
    await pick(page, 'state', 'sleeping');
    await expect(page.locator('.stage svg[data-state="sleeping"]')).toHaveCount(2);
    await expect(page.locator('.stage .pane.light .chara-zzz')).toHaveCSS('display', 'block');
    // every state is previewed in the picker, whatever is selected
    await expect(page.locator('.states svg[data-state]')).toHaveCount(6);
  });

  test('animation is off for tiles until a state is picked', async ({ page }) => {
    await page.goto('?v=0');
    await expect(page.locator('#animate-input')).toBeDisabled();
    await expect(page.locator('#cycle-input')).toBeDisabled();
    await expect(page.locator('#radius-input')).toBeEnabled();
    await expect(page.locator(FOLLOWERS).and(page.locator('[data-state]'))).toHaveCount(0);
    await pick(page, 'state', 'working');
    await expect(page.locator('input[name="variant"][value="standalone"]')).toBeChecked();
    await expect(page.locator('#animate-input')).toBeEnabled();
    await expect(page.locator('#animate-input')).toBeChecked();
    await expect(page.locator('#radius-input')).toBeDisabled();
    await expect(page.locator('.stage svg[data-state="working"]')).toHaveCount(2);
  });

  test('going back to tiles after animating draws and copies plain tiles', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('?t=mecha');
    await pick(page, 'state', 'working');
    await pick(page, 'variant', 'tile');
    await expect(page.locator('.stage svg')).toHaveCount(2);
    await expect(page.locator(FOLLOWERS).and(page.locator('[data-state], .chara'))).toHaveCount(0);
    await pick(page, 'output', 'svg');
    await page.locator('#copy-output').click();
    await expect(page.locator('#notice')).toContainText('Copied Mecha SVG');
    expect(await clipboard(page)).toBe(createAvatar('Maple', { theme: 'mecha', size: 200, radius: 24 }));
    await pick(page, 'output', 'react');
    await page.locator('#copy-output').click();
    await expect(page.locator('#notice')).toContainText('React snippet');
    const snippet = await clipboard(page);
    expect(snippet).toContain('<Avatar name={"Maple"} theme="mecha" size={200} radius={24} />');
    expect(snippet).not.toMatch(/variant|animated|state|mono/);
    expect(errors).toEqual([]);
  });

  test('no colour draws every preview in greys', async ({ page }) => {
    for (const query of ['?v=0', '']) {
      await page.goto(query);
      await page.locator('#mono-input').check({ force: true });
      const colours = await page.evaluate((selector) => {
        const out: string[] = [];
        for (const svg of document.querySelectorAll(
          `${selector}, .theme-tabs svg, .states svg, .wordmark svg`,
        )) {
          for (const node of svg.querySelectorAll('*')) {
            if (node.closest('defs') && node.tagName !== 'stop') continue;
            const style = getComputedStyle(node);
            for (const value of [style.fill, style.stroke, style.stopColor]) {
              if (value.startsWith('rgb')) out.push(value);
            }
          }
        }
        return out;
      }, FOLLOWERS);
      expect(colours.length).toBeGreaterThan(100);
      for (const colour of colours) expect(colour, query).toMatch(GREY);
    }
  });

  test('copy output reflects the new options', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('?s=96');
    await pick(page, 'state', 'working');
    await page.locator('#mono-input').check({ force: true });
    await page.locator('#copy-output').click();
    await expect(page.locator('#notice')).toContainText('React snippet');
    expect(await clipboard(page)).toContain(
      '<Avatar name={"Maple"} theme="critter" size={96} variant="standalone" animated state="working" mono />',
    );
    await pick(page, 'output', 'svg');
    await page.locator('#copy-output').click();
    await expect(page.locator('#notice')).toContainText('Copied Critter SVG');
    expect(await clipboard(page)).toBe(
      createAvatar('Maple', {
        theme: 'critter',
        size: 96,
        variant: 'standalone',
        animated: true,
        state: 'working',
        mono: true,
      }),
    );
  });

  test('the largest sizes do not scroll sideways on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await page.goto('');
    await pick(page, 'state', 'success');
    await page.locator('#size-input').fill('400');
    await page.locator('#icon-size-input').fill('72');
    await page.locator('#gallery-size-input').fill('160');
    await expect(page.locator('.stage .pane.light svg')).toHaveAttribute('width', '400');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    ).toBeLessThanOrEqual(0);
    const box = await page.locator('.stage .pane.light svg').boundingBox();
    expect(box!.width).toBeLessThanOrEqual(400);
    expect(Math.abs(box!.width - box!.height)).toBeLessThan(1);
  });
});

test.describe('animation in the browser', () => {
  test('a still avatar next to an animated one stays still, with hidden Zs', async ({ page }) => {
    await lab(page);
    const result = await page.evaluate(() => {
      const { createAvatar, THEME_IDS } = window.chara;
      const stage = document.getElementById('stage')!;
      const out: Record<string, { still: number; moving: number; z: string; fill: string; alone: string }> =
        {};
      for (const theme of THEME_IDS) {
        stage.innerHTML = createAvatar('Claudette', { theme, variant: 'standalone' });
        const alone = getComputedStyle(stage.querySelector('.chara-body')!).animationName;
        stage.innerHTML =
          createAvatar('Claudette', { theme, variant: 'standalone', animated: true, state: 'sleeping' }) +
          createAvatar('Claudette', { theme, variant: 'standalone' });
        const [moving, still] = [...stage.querySelectorAll('svg')] as SVGSVGElement[];
        const z = still!.querySelector('.chara-zzz');
        out[theme] = {
          still: still!.getAnimations({ subtree: true }).length,
          moving: moving!.getAnimations({ subtree: true }).length,
          z: z ? getComputedStyle(z).display : 'none',
          fill: getComputedStyle(still!.querySelector('.chara-body')!).animationName,
          alone,
        };
      }
      return out;
    });
    for (const [theme, r] of Object.entries(result)) {
      expect(r.still, theme).toBe(0);
      expect(r.moving, theme).toBeGreaterThan(0);
      expect(r.z, theme).toBe('none');
      expect(r.fill, theme).toBe(r.alone);
    }
  });

  test('two custom themes with the same animation name do not affect each other', async ({ page }) => {
    await lab(page);
    const result = await page.evaluate(() => {
      const { createAvatar, defineTheme } = window.chara;
      const make = (id: string, opacity: string) =>
        defineTheme({
          id,
          draw: () => ({ background: '#fff', content: [] }),
          character: ({ el }) => ({
            content: [el('circle', { class: 'dot', cx: 50, cy: 50, r: 20, fill: '#333' })],
          }),
          animation:
            `.chara-${id}[data-state] .dot{animation:chara-${id}_wobble 1000s linear infinite}` +
            `@keyframes chara-${id}_wobble{from,to{opacity:${opacity}}}`,
        });
      const stage = document.getElementById('stage')!;
      stage.innerHTML =
        createAvatar('a', { theme: make('one', '.25'), variant: 'standalone', animated: true }) +
        createAvatar('a', { theme: make('two', '.75'), variant: 'standalone', animated: true });
      return [...stage.querySelectorAll('.dot')].map((dot) => {
        const style = getComputedStyle(dot);
        return { name: style.animationName, opacity: style.opacity };
      });
    });
    expect(result).toEqual([
      { name: 'chara-one_wobble', opacity: '0.25' },
      { name: 'chara-two_wobble', opacity: '0.75' },
    ]);
  });

  test('timing offsets differ between names, before and after a state change', async ({ page }) => {
    await lab(page);
    const result = await page.evaluate(() => {
      const { createAvatar } = window.chara;
      const names = ['Claudette', 'Imagine', 'Infrado', 'Personelly', 'Atlas', 'Biscuit', 'Cobalt', 'Dexter'];
      const stage = document.getElementById('stage')!;
      stage.innerHTML = names
        .map((name) => createAvatar(name, { theme: 'critter', variant: 'standalone', animated: true }))
        .join('');
      const delays = () =>
        [...stage.querySelectorAll('.chara-body')].map((body) => getComputedStyle(body).animationDelay);
      const idle = delays();
      for (const svg of stage.querySelectorAll('svg')) svg.setAttribute('data-state', 'working');
      return {
        idle,
        working: delays(),
        names: [...stage.querySelectorAll('.chara-body')].map((b) => getComputedStyle(b).animationName),
      };
    });
    expect(new Set(result.idle).size).toBeGreaterThanOrEqual(2);
    expect(result.working).toEqual(result.idle);
    expect(new Set(result.names)).toEqual(new Set(['chara-critter_bounce']));
  });

  test('the error state adds a red glow and keeps the colours; mono makes it grey', async ({ page }) => {
    await lab(page);
    const result = await page.evaluate(async () => {
      const { createAvatar } = window.chara;
      const stage = document.getElementById('stage')!;
      const read = (options: { state?: 'error'; mono?: boolean }) => {
        stage.innerHTML = createAvatar('Claudette', {
          theme: 'critter',
          variant: 'standalone',
          animated: true,
          ...options,
        });
        const body = stage.querySelector('.chara-body')!;
        const style = getComputedStyle(body);
        return { filter: style.filter, fill: getComputedStyle(body.querySelector(':scope > path')!).fill };
      };
      return { idle: read({}), error: read({ state: 'error' }), mono: read({ state: 'error', mono: true }) };
    });
    expect(result.idle.filter).toBe('none');
    expect(result.error.filter).toContain('drop-shadow');
    expect(result.error.filter).toContain('rgb(255, 82, 71)');
    expect(result.error.fill).toBe(result.idle.fill);
    expect(result.mono.filter).toContain('rgb(140, 140, 140)');
    expect(result.mono.filter).not.toContain('rgb(255, 82, 71)');
  });

  test('reduced motion stops every animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await lab(page);
    const running = await page.evaluate(() => {
      const { createAvatar, THEME_IDS, STATES } = window.chara;
      const stage = document.getElementById('stage')!;
      stage.innerHTML = THEME_IDS.flatMap((theme) =>
        STATES.map((state) =>
          createAvatar('Claudette', { theme, variant: 'standalone', animated: true, state }),
        ),
      ).join('');
      return stage.getAnimations({ subtree: true }).length;
    });
    expect(running).toBe(0);
  });

  test('an animated avatar runs as an image', async ({ page }) => {
    await lab(page);
    await page.evaluate(() => {
      const { createAvatarDataUri } = window.chara;
      const img = document.createElement('img');
      img.id = 'as-image';
      img.width = 200;
      img.height = 200;
      img.src = createAvatarDataUri('Claudette', {
        theme: 'critter',
        variant: 'standalone',
        animated: true,
        state: 'working',
      });
      document.getElementById('stage')!.replaceChildren(img);
      return img.decode();
    });
    const img = page.locator('#as-image');
    expect(await img.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
    const frames = new Set<string>();
    for (let i = 0; i < 6; i++) {
      frames.add((await img.screenshot()).toString('base64'));
      await page.waitForTimeout(90);
    }
    expect(frames.size).toBeGreaterThan(1);
  });
});

test('reduced motion also stops an animation on the root of a custom theme', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await lab(page);
  const running = await page.evaluate(() => {
    const { createAvatar, defineTheme } = window.chara;
    const theme = defineTheme({
      id: 'rooty',
      draw: () => ({ background: '#fff', content: [] }),
      character: ({ el }) => ({ content: [el('circle', { cx: 50, cy: 50, r: 20, fill: '#333' })] }),
      animation:
        '.chara-rooty[data-state]{animation:chara-rooty_spin 2s linear infinite}' +
        '@keyframes chara-rooty_spin{to{transform:rotate(360deg)}}',
    });
    const stage = document.getElementById('stage')!;
    stage.innerHTML = createAvatar('a', { theme, variant: 'standalone', animated: true });
    return stage.getAnimations({ subtree: true }).length;
  });
  expect(running).toBe(0);
});
