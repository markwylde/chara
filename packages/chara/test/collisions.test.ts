import { describe, expect, it } from 'vitest';
import { createAvatar, normalizeName, THEME_IDS } from '../src/index.js';
import { canonicalize, sampleNames } from './helpers.js';

const collisions = (theme: (typeof THEME_IDS)[number], count: number) => {
  const names = [...new Set(sampleNames(count).map((n) => normalizeName(n)))];
  expect(names.length).toBe(count);
  const seen = new Set<string>();
  let clashes = 0;
  for (const name of names) {
    const drawing = canonicalize(createAvatar(name, { theme }));
    if (seen.has(drawing)) clashes++;
    seen.add(drawing);
  }
  return clashes;
};

describe('distinct avatars', () => {
  it.each(THEME_IDS)('%s: no collisions across 1,000 names', (theme) => {
    expect(collisions(theme, 1_000)).toBe(0);
  });

  it.each(THEME_IDS)('%s: fewer than 1 in 1,000 collide across 10,000 names', (theme) => {
    expect(collisions(theme, 10_000)).toBeLessThan(10);
  });
});
