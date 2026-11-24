import { describe, expect, it } from 'vitest';
import * as core from '../src/core.js';
import {
  createAvatar,
  createAvatarDataUri,
  createAvatarTree,
  DEFAULT_RADIUS,
  defineTheme,
  serialize,
  THEME_IDS,
} from '../src/index.js';
import { parseXml } from './helpers.js';

const circleTheme = defineTheme({
  id: 'circle',
  draw: ({ rand, el, hsl }) => ({
    background: hsl(rand.int(360), 50, 50),
    content: [el('circle', { cx: 50, cy: 50, r: 20, fill: '#fff' })],
  }),
});

const root = (svg: string) => parseXml(svg).documentElement!;

describe('output formats', () => {
  it.each(THEME_IDS)('%s produces a well-formed SVG document', (theme) => {
    const doc = root(createAvatar('Claudette', { theme }));
    expect(doc.tagName).toBe('svg');
    expect(doc.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(doc.getAttribute('viewBox')).toBe('0 0 100 100');
  });

  it('serialises the tree to the string output', () => {
    for (const theme of THEME_IDS) {
      const opts = { theme, size: 40, radius: 10, title: 'Hi' } as const;
      expect(serialize(createAvatarTree('Imagine', opts))).toBe(createAvatar('Imagine', opts));
    }
  });

  it('round-trips the data URI', () => {
    const uri = createAvatarDataUri('Infrado', { theme: 'critter', size: 32 });
    expect(uri.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    expect(decodeURIComponent(uri.slice(uri.indexOf(',') + 1))).toBe(
      createAvatar('Infrado', { theme: 'critter', size: 32 }),
    );
  });
});

describe('size', () => {
  it('writes width and height', () => {
    const doc = root(createAvatar('a', { size: 48 }));
    expect(doc.getAttribute('width')).toBe('48');
    expect(doc.getAttribute('height')).toBe('48');
  });

  it('omits them by default', () => {
    const doc = root(createAvatar('a'));
    expect(doc.hasAttribute('width')).toBe(false);
    expect(doc.hasAttribute('height')).toBe(false);
  });

  it.each([0.001, Number.MIN_VALUE, 48.123456, Number.MAX_VALUE])(
    'preserves finite positive size %s',
    (size) => {
      const doc = root(createAvatar('a', { size }));
      expect(doc.getAttribute('width')).toBe(String(size));
      expect(doc.getAttribute('height')).toBe(String(size));
    },
  );

  it.each([0, -4, Number.NaN, Number.POSITIVE_INFINITY])('rejects %s', (size) => {
    expect(() => createAvatar('a', { size })).toThrow(RangeError);
  });
});

describe('radius', () => {
  const rx = (radius?: number) =>
    /<clipPath id="[^"]+"><rect width="100" height="100" rx="([^"]+)"/.exec(
      createAvatar('a', { radius }),
    )![1];

  it('defaults to 24', () => {
    expect(DEFAULT_RADIUS).toBe(24);
    expect(rx()).toBe('24');
  });

  it('clamps to 0–50', () => {
    expect(rx(50)).toBe('50');
    expect(createAvatar('a', { radius: 80 })).toBe(createAvatar('a', { radius: 50 }));
    expect(createAvatar('a', { radius: -10 })).toBe(createAvatar('a', { radius: 0 }));
  });

  it('treats non-finite values as the default', () => {
    expect(createAvatar('a', { radius: Number.NaN })).toBe(createAvatar('a', { radius: 24 }));
    expect(createAvatar('a', { radius: Number.POSITIVE_INFINITY })).toBe(createAvatar('a'));
  });
});

describe('title', () => {
  it('adds an escaped title and role', () => {
    const svg = createAvatar('a', { title: '<b>&"x"\u0001' });
    const doc = root(svg);
    expect(doc.getAttribute('role')).toBe('img');
    expect(doc.hasAttribute('aria-hidden')).toBe(false);
    expect(doc.getElementsByTagName('title')[0]!.textContent).toBe('<b>&"x"');
  });

  it.each([undefined, '', '   '])('is decorative for %j', (title) => {
    const doc = root(createAvatar('a', { title }));
    expect(doc.getAttribute('aria-hidden')).toBe('true');
    expect(doc.hasAttribute('role')).toBe(false);
    expect(doc.getElementsByTagName('title')).toHaveLength(0);
  });
});

describe('idPrefix', () => {
  it('prefixes every id', () => {
    for (const theme of THEME_IDS) {
      const svg = createAvatar('a', { theme, idPrefix: 'nav-' });
      const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) expect(id!.startsWith('nav-')).toBe(true);
    }
  });

  it.each(['has space', 'a#b', '1abc', '-x'])('rejects %j', (idPrefix) => {
    expect(() => createAvatar('a', { idPrefix })).toThrow(/letter or underscore/);
  });
});

describe('theme selection', () => {
  it('defaults to mecha', () => {
    expect(createAvatar('Claudette')).toBe(createAvatar('Claudette', { theme: 'mecha' }));
  });

  it('names valid ids for an unknown theme', () => {
    expect(() => createAvatar('a', { theme: 'robot' as never })).toThrow(/mecha, critter, sigil/);
  });

  it('accepts theme objects', () => {
    expect(createAvatar('a', { theme: circleTheme })).toContain(
      '<circle cx="50" cy="50" r="20" fill="#fff"/>',
    );
  });

  it('core entry requires a theme object', () => {
    expect(core.createAvatar('a', { theme: circleTheme })).toBe(createAvatar('a', { theme: circleTheme }));
    expect(() => core.createAvatar('a', { theme: 'mecha' as never })).toThrow(/theme object/);
  });
});

describe('custom themes', () => {
  it('get the frame, options and determinism', () => {
    const svg = createAvatar('Claudette', { theme: circleTheme, size: 20, title: 'C', radius: 50 });
    expect(svg).toBe(createAvatar('claudette', { theme: circleTheme, size: 20, title: 'C', radius: 50 }));
    const doc = root(svg);
    expect(doc.getAttribute('width')).toBe('20');
    expect(svg).toMatch(/rx="50"/);
    expect(svg).toMatch(/<title>C<\/title>/);
  });

  it('can use a gradient background', () => {
    const gradientTheme = defineTheme({
      id: 'gradient',
      draw: ({ el, id, ref, def }) => {
        const g = id('bg');
        def(el('linearGradient', { id: g }, el('stop', { offset: 0, 'stop-color': '#000' })));
        return { background: ref(g), content: [] };
      },
    });
    const svg = createAvatar('a', { theme: gradientTheme, idPrefix: 'p' });
    const gid = /<linearGradient id="([^"]+)"/.exec(svg)![1]!;
    expect(gid.startsWith('p')).toBe(true);
    expect(svg).toContain(`fill="url(#${gid})"`);
  });

  it('rejects invalid theme ids', () => {
    expect(() => defineTheme({ id: 'My Theme', draw: () => ({ background: '#000', content: [] }) })).toThrow(
      TypeError,
    );
    expect(() => defineTheme({ id: '9a', draw: () => ({ background: '#000', content: [] }) })).toThrow(
      TypeError,
    );
  });

  it('rejects malformed drawings', () => {
    const bad = defineTheme({ id: 'bad', draw: () => ({}) as never });
    expect(() => createAvatar('a', { theme: bad })).toThrow(/must return/);
  });
});
