import { faceCss, part, scope, untagged, zzz } from '../motion.js';
import { num, type SvgNode } from '../svg.js';
import { defineTheme, type ThemeContext } from '../theme.js';

/**
 * Picks every part of the robot. Both variants call this, in this order,
 * so a name gives the same robot as a tile and as a standalone character.
 */
function build({ rand: R, hsl, el, f1 }: ThemeContext) {
  const h = R.int(360);
  const bg = hsl(h, 62, 58);
  const light = R.chance(0.6);
  const shell = light ? hsl(h + 20, 35, 95) : hsl(h + 200, 35, 22);
  const shade = light ? hsl(h + 20, 30, 80) : hsl(h + 200, 35, 13);
  const ink = light ? hsl(h + 10, 45, 16) : hsl(h + 20, 40, 95);
  const glow = hsl(h + R.pick([150, 180, 210, 40]), 90, 62);
  const st = (w: number, c = shell) => ({
    fill: 'none',
    stroke: c,
    'stroke-width': w,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });
  const circle = (cx: number, cy: number, r: number, fill: string, opacity?: number) =>
    el('circle', { cx, cy, r, fill, opacity });
  // A light: tagged so the standalone character can pulse it.
  const lamp = (cx: number, cy: number, r: number, opacity?: number) =>
    el('circle', { cx, cy, r, fill: glow, opacity, class: 'chara-glow' });

  const antenna = R.pick<() => SvgNode[]>([
    () => [],
    () => [el('path', { d: 'M50 30V17', ...st(4) }), lamp(50, 14, 5.5)],
    () => [el('path', { d: 'M40 30L34 17M60 30L66 17', ...st(3.5) }), lamp(33, 15, 4.2), lamp(67, 15, 4.2)],
    () => [el('path', { d: 'M50 30V24L43 20L57 15L50 10', ...st(3.5) })],
    () => [el('path', { d: 'M50 30V22M40 13A10 10 0 0 0 60 13', ...st(3.5) }), lamp(50, 13, 3)],
    () => [el('rect', { x: 37, y: 22, width: 26, height: 9, rx: 3, fill: shade }), lamp(50, 26, 2.2)],
  ])();
  const ears = R.pick<() => SvgNode[]>([
    () => [],
    () => [
      el('rect', { x: 14, y: 47, width: 10, height: 17, rx: 3.5, fill: shade }),
      el('rect', { x: 76, y: 47, width: 10, height: 17, rx: 3.5, fill: shade }),
    ],
    () => [circle(20, 56, 7.5, shade), circle(80, 56, 7.5, shade), lamp(15.5, 56, 2), lamp(84.5, 56, 2)],
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
  const eyes = R.pick<() => SvgNode[]>([
    () => [circle(38, 52, 5, ink), circle(62, 52, 5, ink)],
    () => [
      circle(38, 52, 8.5, ink),
      circle(62, 52, 8.5, ink),
      lamp(f1(38 + gx), f1(52 + gy), 3.5),
      lamp(f1(62 + gx), f1(52 + gy), 3.5),
    ],
    () => [
      el('rect', { x: 30, y: 45, width: 40, height: 14, rx: 7, fill: ink }),
      lamp(40, 52, 3),
      lamp(60, 52, 3),
    ],
    () => [
      el('rect', { x: 32.5, y: 46.5, width: 11, height: 11, rx: 2.5, fill: ink }),
      el('rect', { x: 56.5, y: 46.5, width: 11, height: 11, rx: 2.5, fill: ink }),
    ],
    () => [circle(50, 51, 11, ink), lamp(f1(50 + gx), f1(51 + gy), 5)],
    () => [el('path', { d: 'M32 54Q38 47 44 54M56 54Q62 47 68 54', ...st(3.5, ink) })],
    () => [circle(38, 52, 8, ink), lamp(38, 52, 3.2), circle(62, 52, 4.5, ink)],
  ])();
  const mouth = R.pick<() => SvgNode[]>([
    () => [el('path', { d: 'M42 70H58', ...st(3.5, ink) })],
    () => [el('path', { d: 'M40 67Q50 76 60 67', ...st(3.5, ink) })],
    () => [
      el('rect', { x: 38, y: 65, width: 24, height: 9, rx: 2.5, fill: ink }),
      el('path', { d: 'M44 65V74M50 65V74M56 65V74', ...st(1.8) }),
    ],
    () => [circle(50, 70, 3.5, ink)],
    () => [el('path', { d: 'M40 70L45 66L50 70L55 66L60 70', ...st(3.2, ink) })],
    () => [],
  ])();
  const extra = R.pick<() => SvgNode[]>([
    () => [],
    () => [lamp(31, 64, 3.5, 0.6), lamp(69, 64, 3.5, 0.6)],
    () => [circle(50, 38, 2.2, shade)],
  ])();
  return { bg, antenna, ears, head, eyes, mouth, extra };
}

/** The same shapes, fattened and filled with one colour: a sticker backing. */
function outline(nodes: SvgNode[], color: string, extra: number): SvgNode[] {
  return untagged(nodes).map((node) => {
    const { opacity: _opacity, ...attrs } = node.attrs;
    return {
      tag: node.tag,
      attrs: {
        ...attrs,
        fill: attrs.fill === 'none' ? 'none' : color,
        stroke: color,
        'stroke-width': num(Number(attrs['stroke-width'] ?? 0) + extra),
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round',
      },
      children: [],
    };
  });
}

const s = scope('mecha');
const animation = faceCss(
  'mecha',
  `${s.any} .chara-body{animation:${s.k('float')} 3.8s ease-in-out infinite}` +
    `${s.any} .chara-shadow{animation:${s.k('shadow')} 3.8s ease-in-out infinite}` +
    `${s.any} .chara-top{animation:${s.k('sway')} 5.2s ease-in-out infinite}`,
  `${s.in('thinking')} .chara-body{animation:${s.k('ponder')} 3.4s ease-in-out infinite}` +
    `${s.in('working')} .chara-body{animation:${s.k('float')} .6s ease-in-out infinite}` +
    `${s.in('working')} .chara-shadow{animation:${s.k('shadow')} .6s ease-in-out infinite}` +
    `${s.in('error')} .chara-top{animation:${s.k('droop')} 1.9s ease-in-out infinite}` +
    `${s.in('sleeping')} .chara-body{animation:${s.k('doze')} 5s ease-in-out infinite}` +
    `${s.in('sleeping')} .chara-shadow{animation:none;transform:scaleX(1.06)}` +
    `${s.in('sleeping')} .chara-top{animation:${s.k('droop')} 5s ease-in-out infinite}`,
  `@keyframes ${s.k('float')}{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.4px)}}` +
    `@keyframes ${s.k('shadow')}{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.86)}}` +
    `@keyframes ${s.k('ponder')}{0%,100%{transform:translateY(0) rotate(-3.5deg)}50%{transform:translateY(-1.6px) rotate(3.5deg)}}` +
    `@keyframes ${s.k('droop')}{0%,100%{transform:rotate(14deg)}50%{transform:rotate(18deg)}}` +
    `@keyframes ${s.k('doze')}{0%,100%{transform:translateY(3.2px) rotate(5deg)}50%{transform:translateY(2px) rotate(5deg)}}`,
);

/** Robot faces built from antennas, ears, heads, eyes, mouths and details. */
export const mecha = defineTheme({
  id: 'mecha',
  draw(ctx) {
    const p = build(ctx);
    return {
      background: p.bg,
      content: untagged([...p.antenna, ...p.ears, p.head, ...p.eyes, ...p.mouth, ...p.extra]),
    };
  },
  /** The head hovers over its shadow; the tile colour becomes a sticker outline. */
  character(ctx) {
    const p = build(ctx);
    return {
      content: [
        ctx.el('ellipse', {
          class: 'chara-shadow',
          cx: 50,
          cy: 95,
          rx: 21,
          ry: 3,
          fill: '#000',
          opacity: 0.16,
        }),
        part(
          'chara-body',
          part('chara-top', outline(p.antenna, p.bg, 5), p.antenna),
          outline(p.ears, p.bg, 5),
          p.ears,
          outline([p.head], p.bg, 5),
          p.head,
          part('chara-look', part('chara-eyes', p.eyes)),
          part('chara-mouth', p.mouth),
          p.extra,
        ),
        zzz(76, 26, p.bg),
      ],
    };
  },
  animation,
});
