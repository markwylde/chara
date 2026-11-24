import { describe, expect, it } from 'vitest';
import { createAvatar, createRandom, cyrb128, randomFrom } from '../src/index.js';

describe('cyrb128', () => {
  it('is stable for known inputs', () => {
    expect(cyrb128('')).toEqual(cyrb128(''));
    expect(cyrb128('mecha:claudette')).toMatchInlineSnapshot(`
      [
        843371703,
        1048688941,
        591122245,
        2171973836,
      ]
    `);
  });
});

describe('createRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createRandom('x');
    const b = createRandom('x');
    const seqA = Array.from({ length: 20 }, () => a.f());
    const seqB = Array.from({ length: 20 }, () => b.f());
    expect(seqA).toEqual(seqB);
    for (const v of seqA) expect(v >= 0 && v < 1).toBe(true);
  });

  it('differs between seeds', () => {
    expect(createRandom('a').f()).not.toBe(createRandom('b').f());
  });

  it('provides bounded helpers', () => {
    const r = createRandom('helpers');
    for (let i = 0; i < 200; i++) {
      const n = r.int(5);
      expect(Number.isInteger(n) && n >= 0 && n < 5).toBe(true);
      const v = r.range(-2, 3);
      expect(v >= -2 && v < 3).toBe(true);
      expect(['a', 'b']).toContain(r.pick(['a', 'b']));
      expect(typeof r.chance(0.5)).toBe('boolean');
    }
    expect(() => r.pick([])).toThrow(RangeError);
  });

  it('wraps any generator', () => {
    const r = randomFrom(() => 0.5);
    expect(r.int(4)).toBe(2);
    expect(r.chance(0.6)).toBe(true);
  });
});

describe('determinism', () => {
  it('is independent of call order', () => {
    const first = [createAvatar('Imagine'), createAvatar('Infrado')];
    const second = [createAvatar('Infrado'), createAvatar('Imagine')];
    expect(second[1]).toBe(first[0]);
    expect(second[0]).toBe(first[1]);
  });

  it('repeats byte-identically', () => {
    expect(createAvatar('Claudette', { theme: 'mecha' })).toBe(createAvatar('Claudette', { theme: 'mecha' }));
  });

  it('namespaces the seed per theme', () => {
    // Same hue is drawn first by every theme; with per-theme seeds the hues differ.
    const hue = (id: string) => createRandom(`${id}:claudette`).int(360);
    expect(new Set([hue('mecha'), hue('critter'), hue('sigil')]).size).toBeGreaterThan(1);
  });
});
