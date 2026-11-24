import { describe, expect, it } from 'vitest';
import { createAvatar, randomFrom, THEME_IDS } from '../src/index.js';
import { createRandom } from '../src/random.js';
import { offCentreStrokes, SIGIL_MIN_OFF_CENTRE, walkSigil } from '../src/themes/sigil.js';
import { GOLDEN_NAMES, parseXml, sampleNames } from './helpers.js';

describe('golden outputs', () => {
  for (const theme of THEME_IDS) {
    for (const name of GOLDEN_NAMES) {
      it(`${theme}/${name}`, async () => {
        await expect(createAvatar(name, { theme })).toMatchFileSnapshot(
          `__golden__/${theme}/${name.toLowerCase()}.svg`,
        );
      });
    }
  }
});

describe('mecha', () => {
  it('always has a background, head and eyes', () => {
    for (const name of GOLDEN_NAMES) {
      const doc = parseXml(createAvatar(name, { theme: 'mecha' }));
      const g = doc.getElementsByTagName('g')[0]!;
      // background rect + head + at least one eye element
      expect(g.childNodes.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('critter', () => {
  const outline = (name: string) =>
    /<clipPath id="[^"]+-body"><path d="([^"]+)"/.exec(createAvatar(name, { theme: 'critter' }))![1]!;

  it('has a horizontally symmetric body outline', () => {
    for (const name of GOLDEN_NAMES) {
      const nums = outline(name)
        .match(/-?[\d.]+/g)!
        .map(Number);
      const xs = nums.filter((_, i) => i % 2 === 0);
      // every x coordinate has a mirror partner (100 - x) within rounding
      for (const x of xs) expect(xs.some((other) => Math.abs(other - (100 - x)) <= 0.11)).toBe(true);
    }
  });

  it('differs between names', () => {
    expect(outline('Claudette')).not.toBe(outline('Imagine'));
  });
});

describe('sigil', () => {
  it('mirrors the glyph about the centre line', () => {
    for (const name of GOLDEN_NAMES) {
      const svg = createAvatar(name, { theme: 'sigil' });
      expect(svg).toContain('<g transform="translate(100 0) scale(-1 1)">');
    }
  });

  it('has at least three off-centre strokes for 1,000 names', () => {
    for (const name of sampleNames(1000)) {
      const walk = walkSigil(createRandom(`sigil:${name}`));
      expect(offCentreStrokes(walk.segments)).toBeGreaterThanOrEqual(SIGIL_MIN_OFF_CENTRE);
    }
  });

  it('falls back when every attempt stays on the centre column', () => {
    // int(3) - 1 === 0 for dx always (0.5 * 3 = 1.5 → 1), so the walk can only move vertically.
    const walk = walkSigil(randomFrom(() => 0.5));
    expect(walk.fallback).toBe(true);
    expect(offCentreStrokes(walk.segments)).toBeGreaterThanOrEqual(SIGIL_MIN_OFF_CENTRE);
  });
});
