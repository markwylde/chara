import { describe, expect, it } from 'vitest';
import { CharaSafetyError, createAvatar, defineTheme, el, type ThemeDrawing } from '../src/index.js';
import { GOLDEN_NAMES } from './helpers.js';

const themeReturning = (
  drawing: (ctx: Parameters<Parameters<typeof defineTheme>[0]['draw']>[0]) => ThemeDrawing,
) => defineTheme({ id: 'probe', draw: drawing });

const render = (drawing: Parameters<typeof themeReturning>[0]) => () =>
  createAvatar('x', { theme: themeReturning(drawing) });

describe('allowlist', () => {
  it('rejects scripts', () => {
    expect(render(() => ({ background: '#000', content: [el('script', {})] }))).toThrow(
      /<script> is not allowed/,
    );
  });

  it('rejects foreignObject', () => {
    expect(render(() => ({ background: '#000', content: [el('foreignObject')] }))).toThrow(CharaSafetyError);
  });

  it('rejects event handlers, style and href', () => {
    for (const attr of ['onload', 'onclick', 'style', 'href', 'xlink:href']) {
      expect(render(() => ({ background: '#000', content: [el('rect', { [attr]: 'x' })] }))).toThrow(
        new RegExp(`"${attr}"`),
      );
    }
  });

  it('rejects external url references', () => {
    expect(
      render(() => ({ background: '#000', content: [el('rect', { fill: 'url(https://example.com/x)' })] })),
    ).toThrow(/local url\(#id\)/);
    expect(render(() => ({ background: 'url(https://example.com/x)', content: [] }))).toThrow(
      CharaSafetyError,
    );
  });

  it('rejects dangling local references', () => {
    expect(render(() => ({ background: '#000', content: [el('rect', { fill: 'url(#nope)' })] }))).toThrow(
      /does not match any element/,
    );
  });

  it.each([
    String.raw`u\72l(https://example.com/x)`,
    String.raw`\75\72\6c(https://example.com/x)`,
    String.raw`u\000072 l(https://example.com/x)`,
    'u\\72\r\nl(https://example.com/x)',
    'u\u0001rl(https://example.com/x)',
    'u/**/rl(https://example.com/x)',
    'URL(https://example.com/x)',
  ])('rejects obfuscated URL value %j before serialization', (fill) => {
    expect(render(() => ({ background: fill, content: [] }))).toThrow(CharaSafetyError);
    expect(render(() => ({ background: '#000', content: [el('rect', { stroke: fill })] }))).toThrow(
      CharaSafetyError,
    );
  });

  it('rejects hard-coded theme IDs even when their references resolve locally', () => {
    expect(
      render(({ el, def }) => {
        def(el('linearGradient', { id: 'bg' }));
        return { background: 'url(#bg)', content: [] };
      }),
    ).toThrow(/ctx.id/);
  });

  it('rejects namespace overrides on theme nodes', () => {
    expect(
      render(() => ({
        background: '#000',
        content: [el('g', { xmlns: 'http://www.w3.org/1999/xhtml' }, el('title', {}, 'hello'))],
      })),
    ).toThrow(/xmlns/);
  });

  it('rejects duplicate ids and nested svg and stray text', () => {
    expect(render((ctx) => ({ background: '#000', content: [el('rect', { id: ctx.id('frame') })] }))).toThrow(
      /more than once/,
    );
    expect(render(() => ({ background: '#000', content: [el('svg')] }))).toThrow(/Nested/);
    expect(render(() => ({ background: '#000', content: [el('g', {}, 'hello')] }))).toThrow(
      /Text is only allowed/,
    );
  });

  it('accepts every built-in avatar', () => {
    for (const theme of ['mecha', 'critter', 'sigil'] as const) {
      for (const name of GOLDEN_NAMES) {
        const svg = createAvatar(name, { theme, title: name });
        expect(svg).not.toMatch(/<script|\son[a-z]+=|https?:\/\/(?!www\.w3\.org\/2000\/svg")/i);
      }
    }
  });
});
