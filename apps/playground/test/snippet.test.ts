import { transformSync } from 'esbuild';
import { describe, expect, it } from 'vitest';
import { buildReactSnippet, effectiveOptions } from '../src/snippet';

/** Compiles the snippet's JSX line and evaluates it with a fake createElement to read the props back. */
function evaluate(snippet: string): Record<string, unknown> {
  const jsx = snippet.split('\n').at(-1)!;
  const { code } = transformSync(`out = ${jsx}`, { loader: 'jsx', jsx: 'transform', jsxFactory: 'h' });
  const h = (_type: unknown, props: Record<string, unknown>) => props;
  const scope: { out?: Record<string, unknown> } = {};
  new Function('h', 'Avatar', 'scope', code.replace('out =', 'scope.out ='))(h, 'Avatar', scope);
  return scope.out!;
}

describe('buildReactSnippet', () => {
  // biome-ignore lint/suspicious/noTemplateCurlyInString: a literal ${x} is the input under test
  it.each(['Maple', 'Ma"p{le}', "it's\nmultiline", '</script>', '`${x}`'])('round-trips %j', (name) => {
    const props = evaluate(buildReactSnippet({ name, theme: 'critter', size: 48, radius: 50 }));
    expect(props).toEqual({ name, theme: 'critter', size: 48, radius: 50 });
  });

  it('imports the React package', () => {
    expect(buildReactSnippet({ name: 'a', theme: 'mecha', size: 1, radius: 0 })).toMatch(
      /^import \{ Avatar \} from '@markwylde\/chara-react';/,
    );
  });
});

describe('effectiveOptions', () => {
  it('omits everything at its default', () => {
    expect(effectiveOptions({ standalone: false, animate: false, state: 'idle', mono: false })).toEqual({});
  });

  it('drops animation and state for tiles, whatever the controls hold', () => {
    expect(effectiveOptions({ standalone: false, animate: true, state: 'sleeping', mono: true })).toEqual({
      mono: true,
    });
  });

  it('keeps state only when animated, and idle is the default', () => {
    expect(effectiveOptions({ standalone: true, animate: false, state: 'error', mono: false })).toEqual({
      variant: 'standalone',
    });
    expect(effectiveOptions({ standalone: true, animate: true, state: 'idle', mono: false })).toEqual({
      variant: 'standalone',
      animated: true,
    });
    expect(effectiveOptions({ standalone: true, animate: true, state: 'working', mono: true })).toEqual({
      variant: 'standalone',
      animated: true,
      state: 'working',
      mono: true,
    });
  });
});

describe('buildReactSnippet with the new options', () => {
  it('writes an animated, mono, standalone avatar as valid JSX', () => {
    const snippet = buildReactSnippet({
      name: 'Maple',
      theme: 'critter',
      size: 200,
      radius: 24,
      variant: 'standalone',
      animated: true,
      state: 'working',
      mono: true,
    });
    expect(snippet).toContain(
      '<Avatar name={"Maple"} theme="critter" size={200} variant="standalone" animated state="working" mono />',
    );
    expect(evaluate(snippet)).toEqual({
      name: 'Maple',
      theme: 'critter',
      size: 200,
      variant: 'standalone',
      animated: true,
      state: 'working',
      mono: true,
    });
  });

  it('leaves the new props out at their defaults', () => {
    const snippet = buildReactSnippet({ name: 'a', theme: 'mecha', size: 96, radius: 24 });
    expect(snippet).not.toMatch(/variant|animated|state|mono/);
  });
});
