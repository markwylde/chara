import type { SvgNode } from '../svg.js';
import { defineTheme } from '../theme.js';

/** Robot faces built from antennas, ears, heads, eyes, mouths and details. */
export const mecha = defineTheme({
  id: 'mecha',
  draw({ rand: R, hsl, el, f1 }) {
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

    const antenna = R.pick<() => SvgNode[]>([
      () => [],
      () => [el('path', { d: 'M50 30V17', ...st(4) }), circle(50, 14, 5.5, glow)],
      () => [
        el('path', { d: 'M40 30L34 17M60 30L66 17', ...st(3.5) }),
        circle(33, 15, 4.2, glow),
        circle(67, 15, 4.2, glow),
      ],
      () => [el('path', { d: 'M50 30V24L43 20L57 15L50 10', ...st(3.5) })],
      () => [el('path', { d: 'M50 30V22M40 13A10 10 0 0 0 60 13', ...st(3.5) }), circle(50, 13, 3, glow)],
      () => [
        el('rect', { x: 37, y: 22, width: 26, height: 9, rx: 3, fill: shade }),
        circle(50, 26, 2.2, glow),
      ],
    ])();
    const ears = R.pick<() => SvgNode[]>([
      () => [],
      () => [
        el('rect', { x: 14, y: 47, width: 10, height: 17, rx: 3.5, fill: shade }),
        el('rect', { x: 76, y: 47, width: 10, height: 17, rx: 3.5, fill: shade }),
      ],
      () => [
        circle(20, 56, 7.5, shade),
        circle(80, 56, 7.5, shade),
        circle(15.5, 56, 2, glow),
        circle(84.5, 56, 2, glow),
      ],
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
        circle(f1(38 + gx), f1(52 + gy), 3.5, glow),
        circle(f1(62 + gx), f1(52 + gy), 3.5, glow),
      ],
      () => [
        el('rect', { x: 30, y: 45, width: 40, height: 14, rx: 7, fill: ink }),
        circle(40, 52, 3, glow),
        circle(60, 52, 3, glow),
      ],
      () => [
        el('rect', { x: 32.5, y: 46.5, width: 11, height: 11, rx: 2.5, fill: ink }),
        el('rect', { x: 56.5, y: 46.5, width: 11, height: 11, rx: 2.5, fill: ink }),
      ],
      () => [circle(50, 51, 11, ink), circle(f1(50 + gx), f1(51 + gy), 5, glow)],
      () => [el('path', { d: 'M32 54Q38 47 44 54M56 54Q62 47 68 54', ...st(3.5, ink) })],
      () => [circle(38, 52, 8, ink), circle(38, 52, 3.2, glow), circle(62, 52, 4.5, ink)],
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
      () => [circle(31, 64, 3.5, glow, 0.6), circle(69, 64, 3.5, glow, 0.6)],
      () => [circle(50, 38, 2.2, shade)],
    ])();
    return { background: bg, content: [...antenna, ...ears, head, ...eyes, ...mouth, ...extra] };
  },
});
