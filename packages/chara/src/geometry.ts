import { el, type SvgNode } from './svg.js';

/** Rounds to one decimal place. Every generated coordinate goes through this. */
export function f1(n: number): number {
  const r = Math.round(n * 10) / 10;
  return Object.is(r, -0) ? 0 : r;
}

/** Wraps nodes in a group mirrored about the vertical centre line of the 100×100 canvas. */
export function mirrorX(nodes: SvgNode[]): SvgNode {
  return el('g', { transform: 'translate(100 0) scale(-1 1)' }, nodes);
}

/** A closed Catmull-Rom spline through the points, as SVG path data with 1-decimal coordinates. */
export function smoothClosedPath(points: readonly (readonly [number, number])[]): string {
  const n = points.length;
  if (n < 3) throw new RangeError('smoothClosedPath() needs at least three points');
  const p = (i: number) => points[((i % n) + n) % n] as readonly [number, number];
  let d = `M${f1(p(0)[0])} ${f1(p(0)[1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return `${d}Z`;
}
