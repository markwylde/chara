import { describe, expect, it } from 'vitest';
import {
  CharaSafetyError,
  checkAnimationCss,
  createAvatar,
  createAvatarTree,
  defineTheme,
  STATES,
  THEME_IDS,
  toGrey,
  validateTree,
} from '../src/index.js';
import { GOLDEN_NAMES } from './helpers.js';

const standalone = { variant: 'standalone' } as const;
const hexColours = (svg: string) => svg.match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi) ?? [];
const isGrey = (hex: string) => {
  const h = hex.slice(1).toLowerCase();
  return h.length === 3
    ? h[0] === h[1] && h[1] === h[2]
    : h.slice(0, 2) === h.slice(2, 4) && h.slice(2, 4) === h.slice(4);
};

describe('golden standalone outputs', () => {
  for (const theme of THEME_IDS) {
    for (const name of GOLDEN_NAMES) {
      it(`${theme}/${name}`, async () => {
        await expect(createAvatar(name, { theme, ...standalone })).toMatchFileSnapshot(
          `__golden__/${theme}-standalone/${name.toLowerCase()}.svg`,
        );
        await expect(createAvatar(name, { theme, ...standalone, mono: true })).toMatchFileSnapshot(
          `__golden__/${theme}-standalone-mono/${name.toLowerCase()}.svg`,
        );
      });
    }
    it(`${theme} animated`, async () => {
      await expect(
        createAvatar('Claudette', { theme, ...standalone, animated: true, state: 'thinking' }),
      ).toMatchFileSnapshot(`__golden__/${theme}-animated/claudette.svg`);
    });
  }
});

describe('options', () => {
  it('rejects an unknown variant or state', () => {
    expect(() => createAvatar('a', { variant: 'poster' as never })).toThrow(TypeError);
    expect(() => createAvatar('a', { state: 'dancing' as never })).toThrow(TypeError);
    expect(() => createAvatar('a', { ...standalone, animated: true, state: 'dancing' as never })).toThrow(
      TypeError,
    );
  });

  it('rejects an animated tile', () => {
    expect(() => createAvatar('a', { animated: true })).toThrow(TypeError);
    expect(() => createAvatar('a', { variant: 'tile', animated: true })).toThrow(/standalone/);
  });

  it('ignores state without animated', () => {
    for (const theme of THEME_IDS) {
      expect(createAvatar('Claudette', { theme, ...standalone, state: 'sleeping' })).toBe(
        createAvatar('Claudette', { theme, ...standalone }),
      );
    }
  });

  it('ignores radius for standalone avatars', () => {
    expect(createAvatar('Claudette', { ...standalone, radius: 0 })).toBe(
      createAvatar('Claudette', { ...standalone, radius: 50 }),
    );
  });

  it('applies size and title', () => {
    const svg = createAvatar('Claudette', { ...standalone, size: 240, title: 'Claudette' });
    expect(svg).toContain('width="240" height="240" role="img"');
    expect(svg).toContain('<title>Claudette</title>');
  });
});

describe('standalone variant', () => {
  it('has no background, no frame clip and is not animated by default', () => {
    for (const theme of THEME_IDS) {
      for (const name of GOLDEN_NAMES) {
        const svg = createAvatar(name, { theme, ...standalone });
        expect(svg).not.toContain('<rect width="100" height="100"');
        expect(svg).not.toMatch(/-frame"/);
        expect(svg).not.toContain('<style');
        expect(svg).not.toContain('data-state');
        expect(svg).toContain(`class="chara chara-${theme} chara_d`);
      }
    }
  });

  it('leaves tile output without any animation hooks', () => {
    for (const theme of THEME_IDS) {
      const svg = createAvatar('Claudette', { theme });
      expect(svg).not.toMatch(/class=|display=|data-|<style|overflow=/);
    }
  });

  it('keeps Mecha parts and colours from the tile', () => {
    const strip = (s: string) => s.replace(/ class="[^"]*"/g, '');
    for (const name of GOLDEN_NAMES) {
      const tile = createAvatar(name, { theme: 'mecha' });
      const figure = strip(createAvatar(name, { theme: 'mecha', ...standalone }));
      // every drawn element of the tile (after its background rect) appears unchanged in the character
      const elements = tile
        .slice(tile.indexOf('/>', tile.indexOf('<g clip-path')) + 2, tile.lastIndexOf('</g>'))
        .match(/<[^>]+\/>/g)!;
      expect(elements.length).toBeGreaterThan(1);
      for (const element of elements) expect(figure).toContain(element);
    }
  });

  it('keeps the Critter body, face and colours from the tile', () => {
    for (const name of GOLDEN_NAMES) {
      const tile = createAvatar(name, { theme: 'critter' });
      const figure = createAvatar(name, { theme: 'critter', ...standalone });
      const body = /<path d="(M[^"]+Z)" fill="(#[0-9a-f]{6})"\/><g clip-path/.exec(tile)!;
      expect(figure).toContain(`<path d="${body[1]}" fill="${body[2]}"/>`);
    }
  });

  it('draws a whole Critter inside the canvas, with feet and arms', () => {
    for (const name of GOLDEN_NAMES) {
      const figure = createAvatar(name, { theme: 'critter', ...standalone });
      expect(figure.match(/class="chara-arm chara-arm-[lr]"/g)).toHaveLength(2);
      const ellipses = [
        ...figure.matchAll(/<ellipse[^>]* cx="([\d.]+)" cy="([\d.]+)" rx="([\d.]+)" ry="([\d.]+)"/g),
      ];
      expect(ellipses.length).toBeGreaterThanOrEqual(5); // shadow, two arms, two feet
      for (const [, cx, cy, rx, ry] of ellipses) {
        // the figure sits in translate(3.5 -3.5) scale(0.93)
        expect((Number(cy) + Number(ry)) * 0.93 - 3.5).toBeLessThanOrEqual(100);
        expect((Number(cx) + Number(rx) + 4) * 0.93 + 3.5).toBeLessThanOrEqual(100);
        expect((Number(cx) - Number(rx) - 4) * 0.93 + 3.5).toBeGreaterThanOrEqual(0);
      }
      const top = Math.min(
        ...[...figure.matchAll(/c[xy]="[\d.]+" cy="(-?[\d.]+)"/g)].map((m) => Number(m[1])),
      );
      expect(top * 0.93 - 3.5).toBeGreaterThanOrEqual(0);
    }
  });

  it('strokes the Sigil with its gradient and keeps the same segments', () => {
    const segments = (d: string) => d.match(/M[\d.]+ [\d.]+L[\d.]+ [\d.]+/g)!;
    const mirror = (seg: string) => seg.replace(/([ML])([\d.]+)/g, (_, c, x) => `${c}${100 - Number(x)}`);
    for (const name of GOLDEN_NAMES) {
      const tile = createAvatar(name, { theme: 'sigil' });
      const figure = createAvatar(name, { theme: 'sigil', ...standalone });
      expect(figure).toMatch(/stroke="url\(#[^)]+-ink\)"/);
      expect(figure).not.toMatch(/stroke="#/);
      const half = segments(/<path d="([^"]+)"/.exec(tile)![1]!);
      const whole = new Set(segments(/class="chara-line" d="([^"]+)"/.exec(figure)![1]!));
      expect(whole).toEqual(new Set([...half, ...half.map(mirror)]));
    }
  });

  it('hides state-only parts in the markup itself', () => {
    for (const theme of ['mecha', 'critter'] as const) {
      expect(createAvatar('Claudette', { theme, ...standalone })).toContain(
        '<g class="chara-zzz" display="none">',
      );
    }
  });
});

describe('animation', () => {
  it('carries a stylesheet for every state and sets data-state', () => {
    for (const theme of THEME_IDS) {
      const svg = createAvatar('Claudette', { theme, ...standalone, animated: true, state: 'thinking' });
      expect(svg).toContain('data-state="thinking"');
      const css = /<style>([^<]*)<\/style>/.exec(svg)![1]!;
      for (const state of STATES.filter((s) => s !== 'idle')) {
        expect(css).toContain(`.chara-${theme}[data-state=${state}]`);
      }
      // idle is the base every state builds on
      expect(css).toContain(`.chara-${theme}[data-state] .chara-body{`);
      expect(css).toContain('@media (prefers-reduced-motion:reduce)');
      expect(css).toContain('animation:none!important');
      expect(css).toContain('animation-delay:var(--chara-d,0s)!important');
      // both frame rules cover the root itself as well as its descendants
      expect(css).toContain(
        `.chara-${theme}[data-state],.chara-${theme}[data-state] *{animation:none!important}`,
      );
      // every keyframes block is owned by the theme
      for (const [, name] of css.matchAll(/@keyframes ([^{]+)\{/g))
        expect(name).toMatch(new RegExp(`^chara-${theme}_`));
      // every animation refers to keyframes that exist
      const defined = new Set([...css.matchAll(/@keyframes ([^{]+)\{/g)].map((m) => m[1]));
      for (const [, name] of css.matchAll(/(chara-[a-z]+_[a-z-]+) [\d.]+s/g)) expect(defined).toContain(name);
    }
  });

  it('differs between states only in data-state', () => {
    const a = createAvatar('Claudette', { ...standalone, animated: true, state: 'idle' });
    const b = createAvatar('Claudette', { ...standalone, animated: true, state: 'error' });
    expect(b).toBe(a.replace('data-state="idle"', 'data-state="error"'));
  });

  it('passes the published tree check', () => {
    for (const theme of THEME_IDS) {
      expect(() =>
        validateTree(createAvatarTree('Claudette', { theme, ...standalone, animated: true })),
      ).not.toThrow();
    }
  });

  it('gives the error state a red glow, grey for mono, and never dims', () => {
    for (const theme of THEME_IDS) {
      const css = /<style>([^<]*)<\/style>/.exec(
        createAvatar('a', { theme, ...standalone, animated: true }),
      )![1]!;
      expect(css).toContain(`@keyframes chara-${theme}_alarm{0%,100%{filter:drop-shadow(0 0 1.5px #ff5247)`);
      expect(css).toContain(`.chara-${theme}[data-state=error][data-mono] .chara-body{`);
      expect(css).toContain(
        `@keyframes chara-${theme}_alarm-mono{0%,100%{filter:drop-shadow(0 0 1.5px #8c8c8c)`,
      );
      expect(css).not.toMatch(/saturate|brightness|grayscale/);
      // every red rule has a mono override that comes later
      const reds = [...css.matchAll(/(\.chara-[a-z]+\[data-state=error\]) ([^{]+)\{[^}]*#ff5247/g)];
      for (const [, root, rest] of reds) expect(css).toContain(`${root}[data-mono] ${rest}{`);
    }
  });

  it('picks a deterministic timing offset that varies between names', () => {
    const offset = (name: string) =>
      /chara_d(\d)/.exec(createAvatar(name, { ...standalone, animated: true }))![1];
    expect(offset('Claudette')).toBe(offset('claudette '));
    expect(new Set(GOLDEN_NAMES.map(offset)).size).toBeGreaterThan(3);
    // the offset does not change the drawing
    const drawing = (name: string) => createAvatar(name, { ...standalone }).replace(/chara_d\d/, '');
    expect(drawing('Claudette')).toBe(drawing('Claudette'));
  });
});

describe('mono', () => {
  it('draws built-in themes in greys only, in both variants', () => {
    for (const theme of THEME_IDS) {
      for (const name of GOLDEN_NAMES) {
        for (const variant of ['tile', 'standalone'] as const) {
          const svg = createAvatar(name, { theme, variant, mono: true });
          const colours = hexColours(svg);
          expect(colours.length).toBeGreaterThan(1);
          for (const colour of colours)
            expect(isGrey(colour), `${theme}/${name}/${variant} ${colour}`).toBe(true);
        }
      }
    }
  });

  it('converts to the grey of equal luma', () => {
    expect(toGrey('#ffffff')).toBe('#ffffff');
    expect(toGrey('#000000')).toBe('#000000');
    expect(toGrey('#ff0000')).toBe('#4c4c4c');
    expect(toGrey('#00ff00')).toBe('#969696');
  });

  it('marks the root so the stylesheet can swap its error colour', () => {
    expect(createAvatar('a', { ...standalone, mono: true })).toContain('data-mono=""');
    expect(createAvatar('a', { ...standalone })).not.toContain('data-mono');
  });

  it('leaves a custom theme literal colour alone', () => {
    const theme = defineTheme({
      id: 'custom',
      draw: ({ el, hsl }) => ({
        background: hsl(200, 80, 50),
        content: [el('circle', { r: 5, fill: '#123456' })],
      }),
    });
    const svg = createAvatar('a', { theme, mono: true });
    expect(svg).toContain('fill="#123456"');
    expect(
      hexColours(svg)
        .filter((c) => c !== '#123456')
        .every(isGrey),
    ).toBe(true);
  });
});

describe('custom theme characters', () => {
  const base = { draw: () => ({ background: '#fff', content: [] }) };

  it('needs a character for the standalone variant', () => {
    const theme = defineTheme({ id: 'plain', ...base });
    expect(() => createAvatar('a', { theme, ...standalone })).toThrow(/"plain" has no standalone character/);
  });

  it('needs animation CSS to be animated', () => {
    const theme = defineTheme({
      id: 'still',
      ...base,
      character: ({ el }) => ({ content: [el('circle', { r: 4 })] }),
    });
    expect(createAvatar('a', { theme, ...standalone })).toContain('<circle r="4"/>');
    expect(() => createAvatar('a', { theme, ...standalone, animated: true })).toThrow(TypeError);
  });

  it('includes custom animation CSS', () => {
    const css =
      '.chara-wob[data-state] .spin{animation:chara-wob_spin 2s linear infinite}@keyframes chara-wob_spin{to{transform:rotate(360deg)}}';
    const theme = defineTheme({
      id: 'wob',
      ...base,
      character: ({ el }) => ({ content: [el('circle', { class: 'spin', r: 4 })] }),
      animation: css,
    });
    expect(createAvatar('a', { theme, ...standalone, animated: true })).toContain(css);
  });

  it('rejects unsafe animation CSS when used', () => {
    const make = (animation: string) =>
      defineTheme({ id: 'bad', ...base, character: () => ({ content: [] }), animation });
    for (const css of [
      '@import "x.css";',
      '.chara-bad[data-state] a{background:url(https://example.com/x)}',
      '.chara-bad[data-state] a{color:r\\65 d}',
      'body{display:none}',
      '.chara-bad[data-state] a,body{display:none}',
      '@keyframes spin{to{opacity:0}}',
    ]) {
      expect(() => createAvatar('a', { theme: make(css), ...standalone, animated: true }), css).toThrow(
        CharaSafetyError,
      );
    }
  });

  it('rejects a theme that emits a stylesheet, an unsafe class or a display value', () => {
    const make = (node: Parameters<typeof validateTree>[0]) =>
      defineTheme({ id: 'bad', ...base, character: () => ({ content: [node] }) });
    const el = (tag: string, attrs: Record<string, string>, ...children: string[]) => ({
      tag,
      attrs,
      children,
    });
    expect(() =>
      createAvatar('a', { theme: make(el('style', {}, '.chara-bad[data-state]{opacity:0}')), ...standalone }),
    ).toThrow(CharaSafetyError);
    expect(() => createAvatar('a', { theme: make(el('g', { class: 'a;b{}' })), ...standalone })).toThrow(
      CharaSafetyError,
    );
    expect(() => createAvatar('a', { theme: make(el('g', { display: 'inline' })), ...standalone })).toThrow(
      CharaSafetyError,
    );
    expect(() =>
      createAvatar('a', { theme: make(el('g', { 'data-state': 'idle' })), ...standalone }),
    ).toThrow(CharaSafetyError);
    expect(() => createAvatar('a', { theme: make(el('g', { style: 'color:red' })), ...standalone })).toThrow(
      CharaSafetyError,
    );
  });
});

describe('theme and timing classes cannot collide', () => {
  it('keeps the timing class out of reach of a theme called d3', () => {
    const theme = defineTheme({
      id: 'd3',
      draw: () => ({ background: '#fff', content: [] }),
      character: () => ({ content: [] }),
      animation: '.chara-d3[data-state] *{opacity:0}',
    });
    // the theme's own scope is fine, but no other theme's root carries the class chara-d3
    expect(createAvatar('a', { theme, variant: 'standalone', animated: true })).toContain(
      'chara chara-d3 chara_d',
    );
    for (const name of GOLDEN_NAMES) {
      expect(createAvatar(name, { variant: 'standalone' })).not.toMatch(/class="[^"]*chara-d\d/);
    }
  });
});

describe('checkAnimationCss', () => {
  const ok =
    '.chara-t[data-state=idle] .a,.chara-t[data-state] :is(.b,.c){animation:chara-t_x 1s cubic-bezier(.3,.6,.4,1) infinite}@keyframes chara-t_x{0%,50%{opacity:1}to{opacity:0}}@media (prefers-reduced-motion:reduce){.chara-t[data-state] *{animation:none}}';

  it('accepts scoped rules, prefixed keyframes and @media', () => {
    expect(() => checkAnimationCss(ok, 't')).not.toThrow();
    expect(() => checkAnimationCss('', 't')).not.toThrow();
  });

  it.each([
    ['backslash', '.chara-t[data-state] a{color:\\72 ed}'],
    ['markup', '.chara-t[data-state] a{}</style><script>'],
    ['comment', '.chara-t[data-state] a{}/* x */'],
    ['url', '.chara-t[data-state] a{fill:URL(#x)}'],
    ['image-set', '.chara-t[data-state] a{background:image-set("a" 1x)}'],
    ['import', '@import "a";'],
    ['font-face', '@font-face{font-family:x}'],
    ['unscoped rule', 'body{display:none}'],
    ['another theme', '.chara-u[data-state] a{opacity:0}'],
    ['scope without data-state', '.chara-t a{opacity:0}'],
    ['second selector unscoped', '.chara-t[data-state] a, body{opacity:0}'],
    ['sibling combinator', '.chara-t[data-state] ~ div{opacity:0}'],
    ['adjacent combinator', '.chara-t[data-state] + div{opacity:0}'],
    ['unscoped rule in media', '@media screen{body{opacity:0}}'],
    ['nested media', '@media screen{@media print{.chara-t[data-state] a{opacity:0}}}'],
    ['unprefixed keyframes', '@keyframes spin{to{opacity:0}}'],
    ['other theme keyframes', '@keyframes chara-u_spin{to{opacity:0}}'],
    ['keyframes of a theme whose id extends this one', '@keyframes chara-t-x_spin{to{opacity:0}}'],
    ['hyphen-separated keyframes', '@keyframes chara-t-spin{to{opacity:0}}'],
    [
      'NUL that the serializer would strip',
      '.chara-t[data-state] a{background:u\u0000rl(https://example.invalid/x)}',
    ],
    ['quoted parenthesis hiding a selector', '.chara-t[data-state="("],body{opacity:.2}'],
    [
      'quoted brace hiding a rule',
      '@keyframes chara-t_x{from{content:"{"}} body{opacity:.3} .chara-t[data-state]{content:"}"}',
    ],
    ['single quotes', ".chara-t[data-state] a{content:'x'}"],
    ['nested rule', '.chara-t[data-state] a{b{opacity:0}}'],
    ['unbalanced', '.chara-t[data-state] a{opacity:0'],
    ['stray brace', '.chara-t[data-state] a{opacity:0}}'],
    ['trailing text', '.chara-t[data-state] a{opacity:0} body'],
  ])('rejects %s', (_, css) => {
    expect(() => checkAnimationCss(css, 't')).toThrow(CharaSafetyError);
  });
});
