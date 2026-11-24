import type { Random } from '../random.js';
import type { SvgNode } from '../svg.js';
import { defineTheme } from '../theme.js';

/** A segment on the 5×5 lattice: [x1, y1, x2, y2], with x in 0–2 (the left half and centre column). */
export type SigilSegment = [number, number, number, number];
export interface SigilWalk {
  segments: SigilSegment[];
  end: [number, number];
  visited: Set<string>;
  /** True when the seeded walk failed and the fixed fallback was used. */
  fallback: boolean;
}

export const SIGIL_ATTEMPTS = 30;
export const SIGIL_MIN_OFF_CENTRE = 3;
const FALLBACK_POINTS: [number, number][] = [
  [2, 0],
  [1, 1],
  [0, 2],
  [1, 3],
  [2, 4],
];

/** Counts segments that touch a column left of the centre line. */
export function offCentreStrokes(segments: readonly SigilSegment[]): number {
  return segments.filter((s) => s[0] < 2 || s[2] < 2).length;
}

/**
 * Walks a path over the left half of a 5×5 lattice. Retries up to
 * {@link SIGIL_ATTEMPTS} times for a walk with at least
 * {@link SIGIL_MIN_OFF_CENTRE} off-centre strokes, then falls back to a fixed walk.
 */
export function walkSigil(R: Random): SigilWalk {
  for (let attempt = 0; attempt < SIGIL_ATTEMPTS; attempt++) {
    const segments: SigilSegment[] = [];
    const visited = new Set<string>();
    const used = new Set<string>();
    let x = 2;
    let y = R.int(5);
    let off = 0;
    const steps = 6 + R.int(3);
    visited.add(`${x},${y}`);
    for (let s = 0, guard = 0; s < steps && guard < 80; guard++) {
      const dx = R.int(3) - 1;
      const dy = R.int(3) - 1;
      const nx = x + dx;
      const ny = y + dy;
      if ((!dx && !dy) || nx < 0 || nx > 2 || ny < 0 || ny > 4) continue;
      const key = `${x},${y},${nx},${ny}`;
      const reverse = `${nx},${ny},${x},${y}`;
      if (used.has(key) || used.has(reverse)) continue;
      used.add(key);
      segments.push([x, y, nx, ny]);
      if (x < 2 || nx < 2) off++;
      x = nx;
      y = ny;
      visited.add(`${x},${y}`);
      s++;
    }
    if (off >= SIGIL_MIN_OFF_CENTRE) return { segments, end: [x, y], visited, fallback: false };
  }
  const segments: SigilSegment[] = [];
  for (let i = 1; i < FALLBACK_POINTS.length; i++) {
    const [ax, ay] = FALLBACK_POINTS[i - 1]!;
    const [bx, by] = FALLBACK_POINTS[i]!;
    segments.push([ax, ay, bx, by]);
  }
  return {
    segments,
    end: [2, 4],
    visited: new Set(FALLBACK_POINTS.map(([px, py]) => `${px},${py}`)),
    fallback: true,
  };
}

/** A mirrored line glyph walked on a 5×5 grid, over a two-stop gradient. */
export const sigil = defineTheme({
  id: 'sigil',
  draw({ rand: R, hsl, el, id, ref, def, mirrorX }) {
    const h = R.int(360);
    const h2 = h + R.pick([40, 60, -50, 150, 180]);
    const dir = R.pick([
      [0, 0, 1, 1],
      [1, 0, 0, 1],
      [0, 0, 0, 1],
      [0, 0, 1, 0],
    ] as const);
    const ink = hsl(h, 60, 96);
    const P = (i: number) => 26 + i * 12;

    const walk = walkSigil(R);
    const d = walk.segments.map((s) => `M${P(s[0])} ${P(s[1])}L${P(s[2])} ${P(s[3])}`).join('');
    const half: SvgNode[] = [
      el('path', {
        d,
        fill: 'none',
        stroke: ink,
        'stroke-width': 6,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
      el('circle', { cx: P(walk.end[0]), cy: P(walk.end[1]), r: 5.6, fill: ink }),
    ];
    const free: [number, number][] = [];
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 5; j++) if (!walk.visited.has(`${i},${j}`)) free.push([i, j]);
    if (free.length) {
      const [px, py] = R.pick(free);
      half.push(el('circle', { cx: P(px), cy: P(py), r: 3.2, fill: ink }));
    }
    const border = R.pick<() => SvgNode[]>([
      () => [],
      () => [
        el('circle', {
          cx: 50,
          cy: 50,
          r: 42,
          fill: 'none',
          stroke: ink,
          'stroke-width': 2.5,
          opacity: 0.32,
        }),
      ],
      () => [
        el('circle', { cx: 50, cy: 10, r: 2.6, fill: ink, opacity: 0.6 }),
        el('circle', { cx: 50, cy: 90, r: 2.6, fill: ink, opacity: 0.6 }),
      ],
    ])();
    const gradient = id('bg');
    def(
      el(
        'linearGradient',
        { id: gradient, x1: dir[0], y1: dir[1], x2: dir[2], y2: dir[3] },
        el('stop', { offset: 0, 'stop-color': hsl(h, 72, 48) }),
        el('stop', { offset: 1, 'stop-color': hsl(h2, 75, 30) }),
      ),
    );
    return { background: ref(gradient), content: [...border, ...half, mirrorX(half)] };
  },
});

export default sigil;
