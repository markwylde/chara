import { expect, type Page, test } from '@playwright/test';
import { createAvatar } from '../../../packages/chara/src/index';

const GREY = /^rgba?\((\d+), \1, \1(, [\d.]+)?\)$/;

async function standalone(page: Page) {
  await page.goto('');
  await page.getByRole('radio', { name: 'Standalone' }).check({ force: true });
}

async function lab(page: Page) {
  await page.goto('lab.html');
  await expect(page.locator('body[data-ready="true"]')).toBeAttached();
}

test.describe('playground controls', () => {
  test('standalone previews have no background', async ({ page }) => {
    await standalone(page);
    const previews = page.locator('section.sheet .surface svg');
    await expect(previews).toHaveCount(6);
    await expect(page.locator('section.sheet .surface svg.chara')).toHaveCount(6);
    await expect(page.locator('section.sheet .surface svg rect[width="100"][height="100"]')).toHaveCount(0);
    await expect(page.locator('section.sheet .surface svg clipPath[id$="-frame"]')).toHaveCount(0);
    // the gallery and sidebars follow the variant
    await expect(page.locator('section.gallery svg.chara')).toHaveCount(20);
  });

  test('a chosen state applies to the sheets but never the gallery', async ({ page }) => {
    await standalone(page);
    await page.locator('#animate-input').check();
    await page.locator('#state-input').selectOption('sleeping');
    await expect(page.locator('section.sheet .surface svg[data-state="sleeping"]')).toHaveCount(6);
    await expect(page.locator('section.gallery svg[data-state]')).toHaveCount(0);
    await expect(page.locator('.sidebars svg[data-state]')).toHaveCount(0);
    // the Zs are showing
    const z = page.locator('section[data-theme-id="mecha"] .surface.light .chara-zzz');
    await expect(z).toHaveCSS('display', 'block');
  });

  test('animation and state controls are disabled for tiles', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('#animate-input')).toBeDisabled();
    await expect(page.locator('#state-input')).toBeDisabled();
    await page.getByRole('radio', { name: 'Standalone' }).check({ force: true });
    await expect(page.locator('#animate-input')).toBeEnabled();
    await expect(page.locator('#state-input')).toBeDisabled();
    await page.locator('#animate-input').check();
    await expect(page.locator('#state-input')).toBeEnabled();
  });

  test('going back to tiles after animating draws and copies plain tiles', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await standalone(page);
    await page.locator('#animate-input').check();
    await page.locator('#state-input').selectOption('working');
    await page.getByRole('radio', { name: 'Tile' }).check({ force: true });
    await expect(page.locator('section.sheet .surface svg')).toHaveCount(6);
    await expect(page.locator('section.sheet svg[data-state], section.sheet svg.chara')).toHaveCount(0);
    const sheet = page.locator('section[data-theme-id="mecha"]');
    await sheet.getByRole('button', { name: 'Copy SVG' }).click();
    await expect(page.locator('#notice')).toContainText('Copied Mecha SVG');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      createAvatar('Maple', { theme: 'mecha', size: 96, radius: 24 }),
    );
    await sheet.getByRole('button', { name: 'Copy React' }).click();
    await expect(page.locator('#notice')).toContainText('React snippet');
    const snippet = await page.evaluate(() => navigator.clipboard.readText());
    expect(snippet).toContain('<Avatar name={"Maple"} theme="mecha" size={96} radius={24} />');
    expect(snippet).not.toMatch(/variant|animated|state|mono/);
    expect(errors).toEqual([]);
  });

  test('no colour draws every preview in greys', async ({ page }) => {
    for (const variant of ['Tile', 'Standalone']) {
      await page.goto('');
      await page.getByRole('radio', { name: variant }).check({ force: true });
      await page.locator('#mono-input').check();
      const colours = await page.evaluate(() => {
        const out: string[] = [];
        for (const node of document.querySelectorAll('section.sheet .surface svg *')) {
          if (node.closest('defs') && node.tagName !== 'stop') continue;
          const style = getComputedStyle(node);
          for (const value of [style.fill, style.stroke, style.stopColor]) {
            if (value.startsWith('rgb')) out.push(value);
          }
        }
        return out;
      });
      expect(colours.length).toBeGreaterThan(20);
      for (const colour of colours) expect(colour, variant).toMatch(GREY);
    }
  });

  test('copy output reflects the new options', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await standalone(page);
    await page.locator('#animate-input').check();
    await page.locator('#state-input').selectOption('working');
    await page.locator('#mono-input').check();
    const sheet = page.locator('section[data-theme-id="critter"]');
    await sheet.getByRole('button', { name: 'Copy React' }).click();
    await expect(page.locator('#notice')).toContainText('React snippet');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
      '<Avatar name={"Maple"} theme="critter" size={96} variant="standalone" animated state="working" mono />',
    );
    await sheet.getByRole('button', { name: 'Copy SVG' }).click();
    await expect(page.locator('#notice')).toContainText('Copied Critter SVG');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      createAvatar('Maple', {
        theme: 'critter',
        size: 96,
        radius: 24,
        variant: 'standalone',
        animated: true,
        state: 'working',
        mono: true,
      }),
    );
  });

  test('the largest size does not scroll sideways on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await standalone(page);
    await page.locator('#animate-input').check();
    await page.locator('#state-input').selectOption('success');
    await page.locator('#size-input').fill('360');
    await expect(page.locator('section[data-theme-id="mecha"] .surface.light svg')).toHaveAttribute(
      'width',
      '360',
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    ).toBeLessThanOrEqual(0);
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
