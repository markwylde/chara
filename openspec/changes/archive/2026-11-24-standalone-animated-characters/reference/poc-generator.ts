import { hsl } from '/var/lib/terminay/Documents/Projects/chara/packages/chara/src/color.js';
import { f1, smoothClosedPath } from '/var/lib/terminay/Documents/Projects/chara/packages/chara/src/geometry.js';
import { createAvatar } from '/var/lib/terminay/Documents/Projects/chara/packages/chara/src/index.js';
import { normalizeName } from '/var/lib/terminay/Documents/Projects/chara/packages/chara/src/normalize.js';
import { createRandom, cyrb128, type Random } from '/var/lib/terminay/Documents/Projects/chara/packages/chara/src/random.js';
import { el, num, type SvgNode, serialize } from '/var/lib/terminay/Documents/Projects/chara/packages/chara/src/svg.js';
import { walkSigil } from '/var/lib/terminay/Documents/Projects/chara/packages/chara/src/themes/sigil.js';

type Nodes = SvgNode[];
const g = (cls: string, ...kids: (SvgNode | Nodes)[]) => el('g', { class: cls }, ...kids);
const circle = (cx: number, cy: number, r: number, fill: string, opacity?: number) =>
  el('circle', { cx, cy, r, fill, opacity });

/** A "sticker" backing: the same shapes, fattened and filled with one colour. */
function outline(nodes: Nodes, color: string, extra: number): Nodes {
  return nodes.map((n) => {
    const attrs: Record<string, string> = { ...n.attrs };
    delete attrs.opacity;
    delete attrs.class;
    if (n.tag !== 'g') {
      attrs.fill = attrs.fill === 'none' ? 'none' : color;
      attrs.stroke = color;
      attrs['stroke-width'] = num(Number(attrs['stroke-width'] ?? 0) + extra);
      attrs['stroke-linejoin'] = 'round';
      attrs['stroke-linecap'] = 'round';
    }
    return { tag: n.tag, attrs, children: outline(n.children as Nodes, color, extra) };
  });
}
function zzz(x: number, y: number, color: string): SvgNode {
  const z = (dx: number, dy: number, s: number, i: number) =>
    el('g', { transform: `translate(${num(x + dx)} ${num(y + dy)}) scale(${s})` },
      el('path', { class: `c-z z${i}`, d: 'M0 0H5L0 6H5', fill: 'none', stroke: color, 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  return g('c-zzz', z(0, 0, 0.8, 1), z(5, -7, 1.05, 2), z(11, -16, 1.35, 3));
}
function tag(nodes: Nodes, fill: string, cls: string): Nodes {
  return nodes.map((n) => (n.attrs.fill === fill ? { ...n, attrs: { ...n.attrs, class: cls } } : n));
}

function mecha(R: Random): Nodes {
  const h = R.int(360);
  const bg = hsl(h, 62, 58);
  const light = R.chance(0.6);
  const shell = light ? hsl(h + 20, 35, 95) : hsl(h + 200, 35, 22);
  const shade = light ? hsl(h + 20, 30, 80) : hsl(h + 200, 35, 13);
  const ink = light ? hsl(h + 10, 45, 16) : hsl(h + 20, 40, 95);
  const glow = hsl(h + R.pick([150, 180, 210, 40]), 90, 62);
  const st = (w: number, c = shell) => ({ fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const antenna = R.pick<() => Nodes>([
    () => [],
    () => [el('path', { d: 'M50 30V17', ...st(4) }), circle(50, 14, 5.5, glow)],
    () => [el('path', { d: 'M40 30L34 17M60 30L66 17', ...st(3.5) }), circle(33, 15, 4.2, glow), circle(67, 15, 4.2, glow)],
    () => [el('path', { d: 'M50 30V24L43 20L57 15L50 10', ...st(3.5) })],
    () => [el('path', { d: 'M50 30V22M40 13A10 10 0 0 0 60 13', ...st(3.5) }), circle(50, 13, 3, glow)],
    () => [el('rect', { x: 37, y: 22, width: 26, height: 9, rx: 3, fill: shade }), circle(50, 26, 2.2, glow)],
  ])();
  const ears = R.pick<() => Nodes>([
    () => [],
    () => [el('rect', { x: 14, y: 47, width: 10, height: 17, rx: 3.5, fill: shade }), el('rect', { x: 76, y: 47, width: 10, height: 17, rx: 3.5, fill: shade })],
    () => [circle(20, 56, 7.5, shade), circle(80, 56, 7.5, shade), circle(15.5, 56, 2, glow), circle(84.5, 56, 2, glow)],
  ])();
  const outlined = { fill: shell, stroke: shell, 'stroke-width': 6, 'stroke-linejoin': 'round' };
  const head = R.pick<() => SvgNode>([
    () => el('rect', { x: 22, y: 30, width: 56, height: 52, rx: 12, fill: shell }),
    () => el('rect', { x: 22, y: 30, width: 56, height: 52, rx: 26, fill: shell }),
    () => el('rect', { x: 18, y: 34, width: 64, height: 46, rx: 16, fill: shell }),
    () => el('path', { d: 'M22 56A28 28 0 0 1 78 56V74Q78 82 70 82H30Q22 82 22 74Z', fill: shell }),
    () => el('path', { d: 'M35 33H65L77 56L65 79H35L23 56Z', ...outlined }),
    () => el('path', { d: 'M30 33H70L77 79H23Z', ...outlined }),
  ])();
  const gx = R.range(-2.5, 2.5);
  const gy = R.range(-2, 2);
  const eyes = R.pick<() => Nodes>([
    () => [circle(38, 52, 5, ink), circle(62, 52, 5, ink)],
    () => [circle(38, 52, 8.5, ink), circle(62, 52, 8.5, ink), circle(f1(38 + gx), f1(52 + gy), 3.5, glow), circle(f1(62 + gx), f1(52 + gy), 3.5, glow)],
    () => [el('rect', { x: 30, y: 45, width: 40, height: 14, rx: 7, fill: ink }), circle(40, 52, 3, glow), circle(60, 52, 3, glow)],
    () => [el('rect', { x: 32.5, y: 46.5, width: 11, height: 11, rx: 2.5, fill: ink }), el('rect', { x: 56.5, y: 46.5, width: 11, height: 11, rx: 2.5, fill: ink })],
    () => [circle(50, 51, 11, ink), circle(f1(50 + gx), f1(51 + gy), 5, glow)],
    () => [el('path', { d: 'M32 54Q38 47 44 54M56 54Q62 47 68 54', ...st(3.5, ink) })],
    () => [circle(38, 52, 8, ink), circle(38, 52, 3.2, glow), circle(62, 52, 4.5, ink)],
  ])();
  const mouth = R.pick<() => Nodes>([
    () => [el('path', { d: 'M42 70H58', ...st(3.5, ink) })],
    () => [el('path', { d: 'M40 67Q50 76 60 67', ...st(3.5, ink) })],
    () => [el('rect', { x: 38, y: 65, width: 24, height: 9, rx: 2.5, fill: ink }), el('path', { d: 'M44 65V74M50 65V74M56 65V74', ...st(1.8) })],
    () => [circle(50, 70, 3.5, ink)],
    () => [el('path', { d: 'M40 70L45 66L50 70L55 66L60 70', ...st(3.2, ink) })],
    () => [],
  ])();
  const extra = R.pick<() => Nodes>([
    () => [],
    () => [circle(31, 64, 3.5, glow, 0.6), circle(69, 64, 3.5, glow, 0.6)],
    () => [circle(50, 38, 2.2, shade)],
  ])();
  const T = (n: Nodes) => tag(n, glow, 'c-glow');
  return [
    el('ellipse', { class: 'c-shadow', cx: 50, cy: 95, rx: 21, ry: 3, fill: '#000', opacity: 0.16 }),
    g('c-body',
      g('c-top', outline(antenna, bg, 5), T(antenna)),
      outline(ears, bg, 5), T(ears),
      outline([head], bg, 5), head,
      g('c-look', g('c-eyes', T(eyes))),
      g('c-mouth', mouth),
      T(extra)),
    zzz(76, 26, bg),
  ];
}

const S = Math.SQRT1_2;
const DIRECTIONS = [[0, -1], [S, -S], [1, 0], [S, S], [0, 1]] as const;

function critter(R: Random, uid: string): Nodes {
  const h = R.int(360);
  R.pick([150, 180, 200, 40, -50]); // the tile colour: unused here, but keeps the sequence aligned
  const body = hsl(h, 68, 56);
  const dark = hsl(h, 55, 16);
  const belly = hsl(h, 70, 80);
  const limb = hsl(h, 64, 44);
  const accent = hsl(h + R.pick([45, -45, 180]), 82, 60);
  const white = '#fff';
  const st = (w: number, c: string) => ({ fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const cx = 50;
  const cy = 64;
  const base = R.range(29, 34);
  const rad = DIRECTIONS.map(() => base * R.range(0.86, 1.1));
  const right = DIRECTIONS.map(([dx, dy], i) => [cx + dx * rad[i]!, cy + dy * rad[i]!] as const);
  const mirrored = [right[3]!, right[2]!, right[1]!].map((p) => [100 - p[0], p[1]] as const);
  const path = smoothClosedPath([...right, ...mirrored]);
  const t = f1(cy - rad[0]!);
  const bottom = f1(cy + rad[4]!);
  const n = (v: number) => num(t + v);
  const topper = R.pick<() => Nodes>([
    () => [],
    () => [circle(30, t + 9, 9.5, body), circle(70, t + 9, 9.5, body), circle(30, t + 9, 4.5, belly), circle(70, t + 9, 4.5, belly)],
    () => [el('path', { d: `M33 ${n(10)}L28 ${n(-7)}L43 ${n(4)}Z M67 ${n(10)}L72 ${n(-7)}L57 ${n(4)}Z`, fill: accent, stroke: accent, 'stroke-width': 3, 'stroke-linejoin': 'round' })],
    () => [el('path', { d: `M50 ${n(3)}V${n(-8)}`, ...st(3, dark) }), el('path', { d: `M50 ${n(-8)}q-10 -9 -15 -1q7 7 15 1Z M50 ${n(-8)}q10 -9 15 -1q-7 7 -15 1Z`, fill: accent })],
    () => [el('path', { d: `M42 ${n(5)}Q38 ${n(-4)} 33 ${n(-7)}M58 ${n(5)}Q62 ${n(-4)} 67 ${n(-7)}`, ...st(3, dark) }), circle(32, t - 8, 3.8, accent), circle(68, t - 8, 3.8, accent)],
    () => [el('path', { d: `M42 ${n(4)}L45 ${n(-8)}L50 ${n(1)}L55 ${n(-8)}L58 ${n(4)}Z`, fill: body, stroke: body, 'stroke-width': 2.5, 'stroke-linejoin': 'round' })],
  ])();
  const gx = R.range(-2.5, 2.5);
  const gy = R.range(-2, 2);
  const eyeKind = R.int(6);
  const eyes: Nodes = [
    () => [circle(40, 58, 4.5, dark), circle(60, 58, 4.5, dark)],
    () => [circle(40, 57, 8.5, white), circle(60, 57, 8.5, white), circle(f1(40 + gx), f1(57 + gy), 4, dark), circle(f1(60 + gx), f1(57 + gy), 4, dark)],
    () => [circle(50, 56, 12, white), circle(f1(50 + gx), f1(56 + gy), 5.5, dark), circle(f1(52 + gx), f1(54 + gy), 1.8, white)],
    () => [circle(36, 59, 4, dark), circle(50, 54, 4, dark), circle(64, 59, 4, dark)],
    () => [el('path', { d: 'M35 60Q40 53 45 60M55 60Q60 53 65 60', ...st(3.5, dark) })],
    () => [circle(35, 58, 3.2, dark), circle(65, 58, 3.2, dark)],
  ][eyeKind]!();
  const mouthRaw = R.pick<() => Nodes>([
    () => [el('path', { d: 'M44 68Q50 74 56 68', ...st(3, dark) })],
    () => [el('path', { d: 'M43 68H57A7 7 0 0 1 43 68Z', fill: dark })],
    () => [circle(50, 70, 2.3, dark)],
    () => [el('path', { d: 'M42 68H58', ...st(3, dark) }), el('path', { d: 'M46 68L48.5 73.5L51 68Z', fill: white })],
    () => [el('path', { d: 'M43 68Q46.5 73 50 68Q53.5 73 57 68', ...st(3, dark) })],
  ])();
  const mouth = el('g', { transform: `translate(0 ${eyeKind === 2 ? 7 : 0})` }, mouthRaw);
  const clip = `${uid}-body`;
  const mark = R.pick<() => Nodes>([
    () => [],
    () => [circle(30, 67, 4.2, accent, 0.65), circle(70, 67, 4.2, accent, 0.65)],
    () => [el('ellipse', { cx: 50, cy: 94, rx: 17, ry: 13, fill: belly })],
    () => [circle(29, 50, 3.5, dark, 0.28), circle(72, 47, 2.6, dark, 0.28), circle(68, 85, 4.5, dark, 0.28), circle(33, 88, 3, dark, 0.28)],
  ])();
  const ax = f1(rad[2]! - 1);
  const arm = (side: 1 | -1) =>
    g(`c-arm ${side === 1 ? 'r' : 'l'}`, el('ellipse', { cx: 50 + side * ax, cy: 73, rx: 6, ry: 10, fill: limb, transform: `rotate(${-side * 24} ${50 + side * ax} 73)` }));
  return [
    el('defs', {}, el('clipPath', { id: clip }, el('path', { d: path }))),
    el('g', { transform: 'translate(3.5 -3.5) scale(0.93)' },
      el('ellipse', { class: 'c-shadow', cx: 50, cy: bottom + 3.4, rx: 25, ry: 3.4, fill: '#000', opacity: 0.16 }),
      g('c-body',
        arm(-1), arm(1),
        el('ellipse', { cx: 39, cy: bottom - 0.5, rx: 9, ry: 4.6, fill: limb }),
        el('ellipse', { cx: 61, cy: bottom - 0.5, rx: 9, ry: 4.6, fill: limb }),
        g('c-top', topper),
        el('path', { d: path, fill: body }),
        el('g', { 'clip-path': `url(#${clip})` }, mark),
        g('c-look', g('c-eyes', eyes)),
        g('c-mouth', mouth)),
      zzz(76, t + 2, accent)),
  ];
}

function sigil(R: Random, uid: string): Nodes {
  const h = R.int(360);
  const h2 = h + R.pick([40, 60, -50, 150, 180]);
  const dir = R.pick([[0, 0, 1, 1], [1, 0, 0, 1], [0, 0, 0, 1], [0, 0, 1, 0]] as const);
  const P = (i: number) => 26 + i * 12;
  const walk = walkSigil(R);
  const grad = `${uid}-ink`;
  const ink = `url(#${grad})`;
  let d = '';
  for (const s of walk.segments) {
    d += `M${P(s[0])} ${P(s[1])}L${P(s[2])} ${P(s[3])}`;
    if (s[0] < 2 || s[2] < 2) d += `M${P(4 - s[0])} ${P(s[1])}L${P(4 - s[2])} ${P(s[3])}`;
  }
  const dots: Nodes = [];
  const dot = (x: number, y: number, r: number) => {
    dots.push(el('circle', { cx: P(x), cy: P(y), r, fill: ink }));
    if (x < 2) dots.push(el('circle', { cx: P(4 - x), cy: P(y), r, fill: ink }));
  };
  dot(walk.end[0], walk.end[1], 5.6);
  const free: [number, number][] = [];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 5; j++) if (!walk.visited.has(`${i},${j}`)) free.push([i, j]);
  if (free.length) {
    const [px, py] = R.pick(free);
    dot(px, py, 3.2);
  }
  const border = R.pick<() => Nodes>([
    () => [],
    () => [el('circle', { class: 's-ring', cx: 50, cy: 50, r: 42, fill: 'none', stroke: ink, 'stroke-width': 2.5, opacity: 0.45 })],
    () => [el('circle', { cx: 50, cy: 10, r: 2.6, fill: ink, opacity: 0.7 }), el('circle', { cx: 50, cy: 90, r: 2.6, fill: ink, opacity: 0.7 })],
  ])();
  const u = (v: number) => 14 + v * 72;
  return [
    el('defs', {}, el('linearGradient', { id: grad, gradientUnits: 'userSpaceOnUse', x1: u(dir[0]), y1: u(dir[1]), x2: u(dir[2]), y2: u(dir[3]) },
      el('stop', { offset: 0, 'stop-color': hsl(h, 80, 58) }),
      el('stop', { offset: 1, 'stop-color': hsl(h2, 82, 50) }))),
    el('g', { transform: 'translate(-5.5 -5.5) scale(1.11)' },
      g('c-body',
        border,
        el('path', { class: 's-line', d, fill: 'none', stroke: ink, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
        g('s-dots', dots))),
  ];
}

export type ThemeId = 'mecha' | 'critter' | 'sigil';
export function standalone(name: string, theme: ThemeId, opts: { size?: number; state?: string; live?: boolean; mono?: boolean } = {}): string {
  const seed = normalizeName(name);
  const uid = `s${cyrb128(`${theme}\0${seed}`)[0].toString(36)}`;
  const R = createRandom(`${theme}:${seed}`);
  const content = theme === 'mecha' ? mecha(R) : theme === 'critter' ? critter(R, uid) : sigil(R, uid);
  const delay = createRandom(`anim:${seed}`).range(0, 4);
  return serialize(
    el('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 100 100',
      width: opts.size,
      height: opts.size,
      class: `chara t-${theme}`,
      'data-state': opts.state ?? 'idle',
      'data-live': opts.live ? '' : undefined,
      'data-mono': opts.mono ? '' : undefined,
      style: `--d:-${num(delay)}s`,
      'aria-hidden': 'true',
    }, content),
  );
}
export function tile(name: string, theme: ThemeId, size: number): string {
  return createAvatar(name, { theme, size });
}
