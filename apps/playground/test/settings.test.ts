import { describe, expect, it } from 'vitest';
import { DEFAULTS, fromQuery, isValidIdPrefix, type Settings, toQuery } from '../src/settings';
import { buildJsSnippet, buildReactSnippet, byteSize, extraOptions } from '../src/snippet';

describe('settings in the URL', () => {
  it('writes nothing for the defaults', () => {
    expect(toQuery(DEFAULTS)).toBe('');
    expect(fromQuery('')).toEqual(DEFAULTS);
  });

  it('round-trips every setting', () => {
    const custom: Settings = {
      name: 'Ma"p le & co',
      theme: 'sigil',
      standalone: false,
      size: 333,
      radius: 50,
      animate: false,
      state: 'sleeping',
      cycle: true,
      mono: true,
      backdrop: 'custom',
      backdropColor: '#12ab9f',
      title: 'Maple the bot',
      idPrefix: 'row_1',
      normalize: false,
      iconSize: 64,
      tone: 'light',
      statuses: false,
      gallerySize: 120,
      galleryCount: 80,
    };
    expect(fromQuery(`?${toQuery(custom)}`)).toEqual(custom);
  });

  it('keeps an empty name', () => {
    expect(fromQuery(`?${toQuery({ ...DEFAULTS, name: '' })}`).name).toBe('');
  });

  it('falls back to defaults for anything unknown or out of range', () => {
    const parsed = fromQuery(
      '?t=dragon&s=99999&r=-4&st=dancing&bg=plaid&bc=red&id=1bad&is=abc&gc=7&ct=sepia&a=yes',
    );
    expect(parsed).toEqual({ ...DEFAULTS, size: 400, radius: 0 });
  });
});

describe('advanced options', () => {
  it('validates id prefixes the way the library does', () => {
    expect(['', 'a', '_x-1', 'Row_2'].every(isValidIdPrefix)).toBe(true);
    expect(['1a', '-a', 'a b', 'a.b', 'é'].some(isValidIdPrefix)).toBe(false);
  });

  it('leaves out defaults', () => {
    expect(extraOptions({ title: '  ', idPrefix: '', normalize: true })).toEqual({});
    expect(extraOptions({ title: ' Hi ', idPrefix: 'p', normalize: false })).toEqual({
      title: 'Hi',
      idPrefix: 'p',
      normalize: false,
    });
  });

  it('adds them to both snippets', () => {
    const options = {
      name: 'Maple',
      theme: 'mecha',
      size: 64,
      radius: 24,
      title: 'Say "hi"',
      idPrefix: 'p',
      normalize: false,
    } as const;
    expect(buildReactSnippet(options)).toContain(
      '<Avatar name={"Maple"} theme="mecha" size={64} radius={24} title={"Say \\"hi\\""} idPrefix="p" normalize={false} />',
    );
    expect(buildJsSnippet(options)).toContain(
      '  title: "Say \\"hi\\"",\n  idPrefix: \'p\',\n  normalize: false,\n});',
    );
  });
});

describe('buildJsSnippet', () => {
  it('evaluates to the same options the page uses', () => {
    const snippet = buildJsSnippet({
      // biome-ignore lint/suspicious/noTemplateCurlyInString: a literal ${x} is the input under test
      name: "it's `${x}`\n",
      theme: 'critter',
      size: 200,
      radius: 24,
      variant: 'standalone',
      animated: true,
      state: 'working',
      mono: true,
    });
    const body = snippet.split('\n').slice(2).join('\n').replace('const svg = ', 'return ');
    const seen = new Function('createAvatar', body)((name: string, options: unknown) => ({ name, options }));
    expect(seen).toEqual({
      // biome-ignore lint/suspicious/noTemplateCurlyInString: a literal ${x} is the input under test
      name: "it's `${x}`\n",
      options: {
        theme: 'critter',
        size: 200,
        variant: 'standalone',
        animated: true,
        state: 'working',
        mono: true,
      },
    });
  });

  it('uses radius for tiles and never animation', () => {
    const snippet = buildJsSnippet({ name: 'a', theme: 'sigil', size: 20, radius: 50 });
    expect(snippet).toContain('radius: 50');
    expect(snippet).not.toMatch(/variant|animated|state|mono/);
  });
});

describe('byteSize', () => {
  it('formats bytes and kilobytes', () => {
    expect(byteSize('abc')).toBe('3 B');
    expect(byteSize('é')).toBe('2 B');
    expect(byteSize('x'.repeat(5325))).toBe('5.2 KB');
  });
});
