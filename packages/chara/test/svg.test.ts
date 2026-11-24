import { describe, expect, it } from 'vitest';
import { el, f1, hsl, mirrorX, num, serialize, smoothClosedPath } from '../src/index.js';

describe('num and f1', () => {
  it('formats numbers compactly', () => {
    expect(num(1)).toBe('1');
    expect(num(0.65)).toBe('0.65');
    expect(num(40.300000000000004)).toBe('40.3');
    expect(num(-0.001)).toBe('0');
    expect(f1(44.46)).toBe(44.5);
    expect(Object.is(f1(-0.04), 0)).toBe(true);
  });
});

describe('el and serialize', () => {
  it('drops empty attributes and flattens children', () => {
    const node = el(
      'g',
      { a: 1, b: undefined, c: false, d: null },
      [el('rect')],
      null,
      el('circle', { r: 2 }),
    );
    expect(serialize(node)).toBe('<g a="1"><rect/><circle r="2"/></g>');
  });

  it('escapes attributes and text and strips XML-invalid characters', () => {
    const node = el('title', { id: 'a"<&>' }, '<b>&"x"\u0001');
    expect(serialize(node)).toBe('<title id="a&quot;&lt;&amp;&gt;">&lt;b&gt;&amp;"x"</title>');
  });

  it('keeps attribute insertion order', () => {
    expect(serialize(el('rect', { y: 2, x: 1 }))).toBe('<rect y="2" x="1"/>');
  });
});

describe('hsl', () => {
  it('converts to hex', () => {
    expect(hsl(0, 100, 50)).toBe('#ff0000');
    expect(hsl(120, 100, 50)).toBe('#00ff00');
    expect(hsl(240, 100, 50)).toBe('#0000ff');
    expect(hsl(0, 0, 100)).toBe('#ffffff');
    expect(hsl(0, 0, 0)).toBe('#000000');
  });

  it('wraps hue in both directions', () => {
    expect(hsl(-120, 100, 50)).toBe(hsl(240, 100, 50));
    expect(hsl(480, 100, 50)).toBe(hsl(120, 100, 50));
  });
});

describe('geometry', () => {
  it('mirrors about the centre line', () => {
    expect(serialize(mirrorX([el('rect')]))).toBe('<g transform="translate(100 0) scale(-1 1)"><rect/></g>');
  });

  it('builds a closed smooth path', () => {
    const d = smoothClosedPath([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]);
    expect(d.startsWith('M0 0C')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d.match(/C/g)).toHaveLength(4);
    expect(() => smoothClosedPath([[0, 0]])).toThrow(RangeError);
  });
});
