import { num, type SvgNode } from '../svg.js';
import { defineTheme } from '../theme.js';

// Unit vectors for -90°, -45°, 0°, 45°, 90°, written exactly so no engine's Math.cos/sin is involved.
const S = Math.SQRT1_2;
const DIRECTIONS: readonly (readonly [number, number])[] = [
  [0, -1],
  [S, -S],
  [1, 0],
  [S, S],
  [0, 1],
];

/** Soft creatures with a generated body outline, rising from the bottom edge. */
export const critter = defineTheme({
  id: 'critter',
  draw({ rand: R, hsl, el, f1, id, ref, def, smoothClosedPath }) {
    const h = R.int(360);
    const bg = hsl(h + R.pick([150, 180, 200, 40, -50]), 55, 86);
    const body = hsl(h, 68, 56);
    const dark = hsl(h, 55, 16);
    const belly = hsl(h, 70, 80);
    const accent = hsl(h + R.pick([45, -45, 180]), 82, 60);
    const white = '#fff';
    const st = (w: number, c: string) => ({
      fill: 'none',
      stroke: c,
      'stroke-width': w,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });
    const circle = (cx: number, cy: number, r: number, fill: string, opacity?: number) =>
      el('circle', { cx, cy, r, fill, opacity });

    const cx = 50;
    const cy = 64;
    const base = R.range(29, 34);
    const rad = DIRECTIONS.map(() => base * R.range(0.86, 1.1));
    const right = DIRECTIONS.map(
      ([dx, dy], i) => [cx + dx * (rad[i] as number), cy + dy * (rad[i] as number)] as const,
    );
    const mirrored = [right[3], right[2], right[1]].map(
      (p) => [100 - (p as readonly number[])[0]!, p![1]] as const,
    );
    const path = smoothClosedPath([...right, ...mirrored]);
    const t = f1(cy - (rad[0] as number));
    const n = (v: number) => num(t + v);

    const topper = R.pick<() => SvgNode[]>([
      () => [],
      () => [
        circle(30, t + 9, 9.5, body),
        circle(70, t + 9, 9.5, body),
        circle(30, t + 9, 4.5, belly),
        circle(70, t + 9, 4.5, belly),
      ],
      () => [
        el('path', {
          d: `M33 ${n(10)}L28 ${n(-7)}L43 ${n(4)}Z M67 ${n(10)}L72 ${n(-7)}L57 ${n(4)}Z`,
          fill: accent,
          stroke: accent,
          'stroke-width': 3,
          'stroke-linejoin': 'round',
        }),
      ],
      () => [
        el('path', { d: `M50 ${n(3)}V${n(-8)}`, ...st(3, dark) }),
        el('path', {
          d: `M50 ${n(-8)}q-10 -9 -15 -1q7 7 15 1Z M50 ${n(-8)}q10 -9 15 -1q-7 7 -15 1Z`,
          fill: accent,
        }),
      ],
      () => [
        el('path', {
          d: `M42 ${n(5)}Q38 ${n(-4)} 33 ${n(-7)}M58 ${n(5)}Q62 ${n(-4)} 67 ${n(-7)}`,
          ...st(3, dark),
        }),
        circle(32, t - 8, 3.8, accent),
        circle(68, t - 8, 3.8, accent),
      ],
      () => [
        el('path', {
          d: `M42 ${n(4)}L45 ${n(-8)}L50 ${n(1)}L55 ${n(-8)}L58 ${n(4)}Z`,
          fill: body,
          stroke: body,
          'stroke-width': 2.5,
          'stroke-linejoin': 'round',
        }),
      ],
    ])();
    const gx = R.range(-2.5, 2.5);
    const gy = R.range(-2, 2);
    const eyeKind = R.int(6);
    const eyes: SvgNode[] = [
      () => [circle(40, 58, 4.5, dark), circle(60, 58, 4.5, dark)],
      () => [
        circle(40, 57, 8.5, white),
        circle(60, 57, 8.5, white),
        circle(f1(40 + gx), f1(57 + gy), 4, dark),
        circle(f1(60 + gx), f1(57 + gy), 4, dark),
      ],
      () => [
        circle(50, 56, 12, white),
        circle(f1(50 + gx), f1(56 + gy), 5.5, dark),
        circle(f1(52 + gx), f1(54 + gy), 1.8, white),
      ],
      () => [circle(36, 59, 4, dark), circle(50, 54, 4, dark), circle(64, 59, 4, dark)],
      () => [el('path', { d: 'M35 60Q40 53 45 60M55 60Q60 53 65 60', ...st(3.5, dark) })],
      () => [circle(35, 58, 3.2, dark), circle(65, 58, 3.2, dark)],
    ][eyeKind]!();
    const mouthRaw = R.pick<() => SvgNode[]>([
      () => [el('path', { d: 'M44 68Q50 74 56 68', ...st(3, dark) })],
      () => [el('path', { d: 'M43 68H57A7 7 0 0 1 43 68Z', fill: dark })],
      () => [circle(50, 70, 2.3, dark)],
      () => [
        el('path', { d: 'M42 68H58', ...st(3, dark) }),
        el('path', { d: 'M46 68L48.5 73.5L51 68Z', fill: white }),
      ],
      () => [el('path', { d: 'M43 68Q46.5 73 50 68Q53.5 73 57 68', ...st(3, dark) })],
    ])();
    const mouth = el('g', { transform: `translate(0 ${eyeKind === 2 ? 7 : 0})` }, mouthRaw);
    const clip = id('body');
    def(el('clipPath', { id: clip }, el('path', { d: path })));
    const mark = R.pick<() => SvgNode[]>([
      () => [],
      () => [circle(30, 67, 4.2, accent, 0.65), circle(70, 67, 4.2, accent, 0.65)],
      () => [el('ellipse', { cx: 50, cy: 94, rx: 17, ry: 13, fill: belly })],
      () => [
        circle(29, 50, 3.5, dark, 0.28),
        circle(72, 47, 2.6, dark, 0.28),
        circle(68, 85, 4.5, dark, 0.28),
        circle(33, 88, 3, dark, 0.28),
      ],
    ])();
    return {
      background: bg,
      content: [
        ...topper,
        el('path', { d: path, fill: body }),
        el('g', { 'clip-path': ref(clip) }, mark),
        ...eyes,
        mouth,
      ],
    };
  },
});

export default critter;
