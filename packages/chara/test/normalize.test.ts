import { describe, expect, it } from 'vitest';
import { createAvatar, FALLBACK_SEED, normalizeName } from '../src/index.js';

describe('normalizeName', () => {
  it('ignores case, outer whitespace and whitespace runs', () => {
    expect(normalizeName('Claudette')).toBe('claudette');
    expect(normalizeName(' claudette ')).toBe('claudette');
    expect(normalizeName('CLAUDETTE')).toBe('claudette');
    expect(normalizeName('clau   dette')).toBe(normalizeName('clau dette'));
    expect(normalizeName('a\t\n b')).toBe('a b');
  });

  it('applies NFC so composed and decomposed forms match', () => {
    expect(normalizeName('café')).toBe(normalizeName('café'));
  });

  it('lowercases without the host locale', () => {
    expect(normalizeName('I')).toBe('i');
    expect(normalizeName('İ')).toBe('İ'.toLowerCase());
  });

  it('falls back for empty names, with or without normalisation', () => {
    expect(normalizeName('')).toBe(FALLBACK_SEED);
    expect(normalizeName('   ')).toBe(FALLBACK_SEED);
    expect(normalizeName('', false)).toBe(FALLBACK_SEED);
    expect(normalizeName('  ', false)).toBe('  ');
  });

  it('leaves the raw string when normalisation is off', () => {
    expect(normalizeName('Claudette', false)).toBe('Claudette');
  });
});

describe('normalisation in avatars', () => {
  it('gives the same avatar for case and spacing variants', () => {
    const a = createAvatar('Claudette');
    expect(createAvatar(' claudette ')).toBe(a);
    expect(createAvatar('CLAUDETTE')).toBe(a);
    expect(createAvatar('clau   dette')).toBe(createAvatar('clau dette'));
  });

  it('gives the same avatar for Unicode-equivalent names', () => {
    expect(createAvatar('café', { theme: 'sigil' })).toBe(createAvatar('café', { theme: 'sigil' }));
  });

  it('treats empty names as the same valid avatar', () => {
    expect(createAvatar('')).toBe(createAvatar('   '));
    expect(createAvatar('', { normalize: false })).toBe(createAvatar(''));
  });

  it('distinguishes case when normalisation is off', () => {
    expect(createAvatar('Claudette', { normalize: false })).not.toBe(
      createAvatar('claudette', { normalize: false }),
    );
  });
});
