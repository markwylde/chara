/** cyrb128: a fast, integer-only 128-bit string hash. Bit-identical on every JS engine. */
export function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/** A seeded source of randomness handed to themes. */
export interface Random {
  /** A float in [0, 1). */
  f(): number;
  /** An integer in [0, n). */
  int(n: number): number;
  /** One element of a non-empty array. */
  pick<T>(items: readonly T[]): T;
  /** A float in [lo, hi). */
  range(lo: number, hi: number): number;
  /** True with probability p. */
  chance(p: number): boolean;
}

/** Wraps any [0,1) generator in the {@link Random} helpers. */
export function randomFrom(next: () => number): Random {
  return {
    f: next,
    int: (n) => Math.floor(next() * n),
    pick: (items) => {
      if (items.length === 0) throw new RangeError('pick() needs at least one item');
      return items[Math.floor(next() * items.length)] as (typeof items)[number];
    },
    range: (lo, hi) => lo + next() * (hi - lo),
    chance: (p) => next() < p,
  };
}

/** sfc32 seeded from cyrb128(seed), warmed up by 12 rounds. */
export function createRandom(seed: string): Random {
  let [a, b, c, d] = cyrb128(seed);
  const next = (): number => {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 12; i++) next();
  return randomFrom(next);
}
