import { ERROR_GREY, ERROR_RED, errorGlowCss, part, scope } from '../motion.js';
import type { Random } from '../random.js';
import type { SvgNode } from '../svg.js';
import { defineTheme, type ThemeContext } from '../theme.js';

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

/**
 * Picks the glyph. Both variants call this, in this order, so a name gives
 * the same glyph as a tile and as a standalone character.
 */
function build({ rand: R }: ThemeContext) {
  const h = R.int(360);
  const h2 = h + R.pick([40, 60, -50, 150, 180]);
  const dir = R.pick([
    [0, 0, 1, 1],
    [1, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 1, 0],
  ] as const);
  const walk = walkSigil(R);
  const free: [number, number][] = [];
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 5; j++) if (!walk.visited.has(`${i},${j}`)) free.push([i, j]);
  const dot = free.length ? R.pick(free) : null;
  const border = R.pick([0, 1, 2] as const);
  return { h, h2, dir, walk, dot, border };
}

const P = (i: number) => 26 + i * 12;

const s = scope('sigil');
const animation =
  `${s.any} :is(.chara-body,.chara-dots,.chara-ring){transform-box:fill-box;transform-origin:center}` +
  `${s.any} .chara-body{animation:${s.k('pulse')} 4.2s ease-in-out infinite}` +
  `${s.any} .chara-dots{animation:${s.k('glow')} 2.8s ease-in-out infinite}` +
  `${s.in('thinking')} .chara-line{stroke-dasharray:.1 8.4;animation:${s.k('march')} .7s linear infinite}` +
  `${s.in('thinking')} .chara-dots{animation:${s.k('glow')} .9s ease-in-out infinite}` +
  `${s.in('working')} .chara-line{stroke-dasharray:17 17;animation:${s.k('draw')} 1.5s ease-in-out infinite}` +
  `${s.in('working')} .chara-ring{stroke-dasharray:9 7;animation:${s.k('spin')} 6s linear infinite}` +
  `${s.in('success')} .chara-body{animation:${s.k('pop')} 1.7s ease-out infinite}` +
  `${s.in('error')} :is(.chara-line,.chara-ring){stroke:${ERROR_RED}}` +
  `${s.in('error')} .chara-ink{fill:${ERROR_RED}}` +
  `${s.in('error')}[data-mono] :is(.chara-line,.chara-ring){stroke:${ERROR_GREY}}` +
  `${s.in('error')}[data-mono] .chara-ink{fill:${ERROR_GREY}}` +
  `${s.in('error')} .chara-line{stroke-dasharray:9 5;animation:${s.k('flicker')} 1.9s steps(1) infinite}` +
  `${s.in('sleeping')} .chara-body{animation:${s.k('dim')} 5s ease-in-out infinite}` +
  `${s.in('sleeping')} .chara-dots{animation:none;opacity:.25}` +
  errorGlowCss('sigil') +
  `@keyframes ${s.k('pulse')}{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}` +
  `@keyframes ${s.k('glow')}{0%,100%{opacity:1}50%{opacity:.45}}` +
  `@keyframes ${s.k('march')}{to{stroke-dashoffset:-8.5}}` +
  `@keyframes ${s.k('draw')}{0%{stroke-dashoffset:17}45%,60%{stroke-dashoffset:0}100%{stroke-dashoffset:-17}}` +
  `@keyframes ${s.k('spin')}{to{transform:rotate(360deg)}}` +
  `@keyframes ${s.k('pop')}{0%,62%,100%{transform:scale(1) rotate(0)}22%{transform:scale(1.16) rotate(8deg)}40%{transform:scale(.97) rotate(-3deg)}52%{transform:scale(1.03)}}` +
  `@keyframes ${s.k('shake')}{0%,30%,100%{transform:translateX(0) rotate(0)}5%{transform:translateX(-2.2px) rotate(-2deg)}10%{transform:translateX(2.2px) rotate(2deg)}15%{transform:translateX(-1.8px) rotate(-1.5deg)}20%{transform:translateX(1.4px) rotate(1deg)}25%{transform:translateX(-.8px)}}` +
  `@keyframes ${s.k('flicker')}{0%,100%{opacity:1}8%{opacity:.35}12%{opacity:1}18%{opacity:.5}24%{opacity:1}}` +
  `@keyframes ${s.k('dim')}{0%,100%{opacity:.38;transform:scale(.97)}50%{opacity:.6;transform:scale(1)}}`;

/** A mirrored line glyph walked on a 5×5 grid, over a two-stop gradient. */
export const sigil = defineTheme({
  id: 'sigil',
  draw(ctx) {
    const { hsl, el, id, ref, def, mirrorX } = ctx;
    const { h, h2, dir, walk, dot, border } = build(ctx);
    const ink = hsl(h, 60, 96);
    const d = walk.segments.map((seg) => `M${P(seg[0])} ${P(seg[1])}L${P(seg[2])} ${P(seg[3])}`).join('');
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
    if (dot) half.push(el('circle', { cx: P(dot[0]), cy: P(dot[1]), r: 3.2, fill: ink }));
    const frame: SvgNode[] = [
      [],
      [
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
      [
        el('circle', { cx: 50, cy: 10, r: 2.6, fill: ink, opacity: 0.6 }),
        el('circle', { cx: 50, cy: 90, r: 2.6, fill: ink, opacity: 0.6 }),
      ],
    ][border] as SvgNode[];
    const gradient = id('bg');
    def(
      el(
        'linearGradient',
        { id: gradient, x1: dir[0], y1: dir[1], x2: dir[2], y2: dir[3] },
        el('stop', { offset: 0, 'stop-color': hsl(h, 72, 48) }),
        el('stop', { offset: 1, 'stop-color': hsl(h2, 75, 30) }),
      ),
    );
    return { background: ref(gradient), content: [...frame, ...half, mirrorX(half)] };
  },
  /** The glyph alone, stroked with a brighter version of the tile's gradient. */
  character(ctx) {
    const { hsl, el, id, ref, def } = ctx;
    const { h, h2, dir, walk, dot, border } = build(ctx);
    const gradient = id('ink');
    const ink = ref(gradient);
    // The gradient is in user space: a straight stroke has an empty bounding box.
    const u = (v: number) => 14 + v * 72;
    def(
      el(
        'linearGradient',
        {
          id: gradient,
          gradientUnits: 'userSpaceOnUse',
          x1: u(dir[0]),
          y1: u(dir[1]),
          x2: u(dir[2]),
          y2: u(dir[3]),
        },
        el('stop', { offset: 0, 'stop-color': hsl(h, 80, 58) }),
        el('stop', { offset: 1, 'stop-color': hsl(h2, 82, 50) }),
      ),
    );
    // Mirrored by coordinates, not a transform, so one gradient spans both halves.
    let d = '';
    for (const seg of walk.segments) {
      d += `M${P(seg[0])} ${P(seg[1])}L${P(seg[2])} ${P(seg[3])}`;
      if (seg[0] < 2 || seg[2] < 2) d += `M${P(4 - seg[0])} ${P(seg[1])}L${P(4 - seg[2])} ${P(seg[3])}`;
    }
    const dots: SvgNode[] = [];
    const addDot = (x: number, y: number, r: number) => {
      dots.push(el('circle', { class: 'chara-ink', cx: P(x), cy: P(y), r, fill: ink }));
      if (x < 2) dots.push(el('circle', { class: 'chara-ink', cx: P(4 - x), cy: P(y), r, fill: ink }));
    };
    addDot(walk.end[0], walk.end[1], 5.6);
    if (dot) addDot(dot[0], dot[1], 3.2);
    const frame: SvgNode[] = [
      [],
      [
        el('circle', {
          class: 'chara-ring',
          cx: 50,
          cy: 50,
          r: 42,
          fill: 'none',
          stroke: ink,
          'stroke-width': 2.5,
          opacity: 0.45,
        }),
      ],
      [
        el('circle', { class: 'chara-ink', cx: 50, cy: 10, r: 2.6, fill: ink, opacity: 0.7 }),
        el('circle', { class: 'chara-ink', cx: 50, cy: 90, r: 2.6, fill: ink, opacity: 0.7 }),
      ],
    ][border] as SvgNode[];
    return {
      content: [
        el(
          'g',
          { transform: 'translate(-5.5 -5.5) scale(1.11)' },
          part(
            'chara-body',
            frame,
            el('path', {
              class: 'chara-line',
              d,
              fill: 'none',
              stroke: ink,
              'stroke-width': 6,
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
            }),
            part('chara-dots', dots),
          ),
        ),
      ],
    };
  },
  animation,
});
