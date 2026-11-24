import {
  ALLOWED_ATTRIBUTES,
  createAvatar,
  createAvatarDataUri,
  defineTheme,
  THEME_IDS,
} from '@markwylde/chara';
import { render, renderHook } from '@testing-library/react';
import { act, createRef, StrictMode, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Avatar, reactAttributeName, useAvatarDataUri } from '../src/index.js';

/** Parses SVG markup and returns a comparable description of the tree. */
function describeTree(markup: string): unknown {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const walk = (node: Element): unknown => ({
    tag: node.tagName,
    attrs: Object.fromEntries([...node.attributes].map((a) => [a.name, a.value]).sort()),
    children: [...node.childNodes].map((c) => (c.nodeType === 1 ? walk(c as Element) : c.textContent)),
  });
  return walk(doc.documentElement);
}

const counter = { draws: 0, bump: () => {} };
const countingTheme = defineTheme({
  id: 'counting',
  draw: ({ el }) => {
    counter.draws++;
    return { background: '#123456', content: [el('circle', { cx: 50, cy: 50, r: 10, fill: '#fff' })] };
  },
});

function CountingParent() {
  const [count, setCount] = useState(0);
  counter.bump = () => setCount((c) => c + 1);
  return (
    <div data-count={count}>
      <Avatar name="Claudette" theme={countingTheme} size={32} />
    </div>
  );
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('attribute mapping', () => {
  it('maps every allowlisted attribute', () => {
    for (const name of Object.keys(ALLOWED_ATTRIBUTES)) expect(reactAttributeName(name)).toBeTruthy();
    expect(reactAttributeName('stroke-width')).toBe('strokeWidth');
    expect(reactAttributeName('clip-path')).toBe('clipPath');
    expect(() => reactAttributeName('onload')).toThrow();
  });
});

describe('Avatar', () => {
  it.each(THEME_IDS)('matches the core output for %s', (theme) => {
    for (const opts of [
      { size: 40 },
      { size: 0.001 },
      { size: Number.MAX_VALUE },
      { radius: 50, title: 'Claudette' },
      { idPrefix: 'x-' },
    ]) {
      const react = renderToStaticMarkup(<Avatar name="Claudette" theme={theme} {...opts} />);
      expect(describeTree(react)).toEqual(describeTree(createAvatar('Claudette', { theme, ...opts })));
    }
  });

  it('renders real svg elements without injected HTML', () => {
    const { container } = render(<Avatar name="Imagine" />);
    const svg = container.firstElementChild!;
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.querySelector('g')).not.toBeNull();
  });

  it('forwards className, style and ref', () => {
    const ref = createRef<SVGSVGElement>();
    const { container } = render(
      <Avatar name="Infrado" className="bot-icon" style={{ display: 'block' }} ref={ref} />,
    );
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('class')).toBe('bot-icon');
    expect(svg.style.display).toBe('block');
    expect(ref.current).toBe(svg);
  });

  it('lets callers override generated attributes', () => {
    const { container } = render(<Avatar name="Claudette" size={40} width={64} aria-label="Claudette" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('64');
    expect(svg.getAttribute('height')).toBe('40');
    expect(svg.getAttribute('aria-label')).toBe('Claudette');
  });

  it('ignores reserved props', () => {
    const props = {
      viewBox: '0 0 10 10',
      children: <circle data-testid="child" />,
      dangerouslySetInnerHTML: { __html: '<script>alert(1)</script>' },
      xmlns: 'x',
    } as Record<string, unknown>;
    const { container } = render(<Avatar name="Claudette" {...props} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
    expect(svg.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
    expect(svg.querySelector('script')).toBeNull();
    expect(container.querySelector('[data-testid="child"]')).toBeNull();
  });

  it('is decorative without a title and labelled with one', () => {
    const { container, rerender } = render(<Avatar name="Personelly" />);
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    rerender(<Avatar name="Personelly" title="Personelly" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.querySelector('title')!.textContent).toBe('Personelly');
  });

  it('hydrates server markup without mismatches, including duplicates', () => {
    const page = (
      <div>
        <Avatar name="Claudette" theme="critter" />
        <Avatar name="Claudette" theme="critter" />
        <Avatar name="Imagine" theme="sigil" radius={50} title="Imagine" />
        <Avatar name="Infrado" size={20} />
      </div>
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(page);
    document.body.appendChild(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const recoverable: unknown[] = [];
    act(() => {
      hydrateRoot(container, page, { onRecoverableError: (e) => recoverable.push(e) });
    });
    expect(recoverable).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
  });

  it('the hydration check does catch a mismatch', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Avatar name="Claudette" />);
    document.body.appendChild(container);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const recoverable: unknown[] = [];
    act(() => {
      hydrateRoot(container, <Avatar name="Imagine" />, { onRecoverableError: (e) => recoverable.push(e) });
    });
    expect(recoverable.length).toBeGreaterThan(0);
  });

  it('does not regenerate on unrelated re-renders', () => {
    counter.draws = 0;
    render(<CountingParent />);
    expect(counter.draws).toBe(1);
    act(() => counter.bump());
    act(() => counter.bump());
    expect(counter.draws).toBe(1);
  });

  it('works under StrictMode', () => {
    const { container } = render(
      <StrictMode>
        <Avatar name="Claudette" />
      </StrictMode>,
    );
    expect(container.querySelector('svg')).not.toBeNull();
  });
});

describe('useAvatarDataUri', () => {
  it('matches the core data URI', () => {
    const { result } = renderHook(() => useAvatarDataUri('Imagine', { theme: 'critter', size: 24 }));
    expect(result.current).toBe(createAvatarDataUri('Imagine', { theme: 'critter', size: 24 }));
  });
});

describe('standalone, animated and mono avatars', () => {
  const cases = THEME_IDS.flatMap((theme) => [
    { theme, variant: 'standalone' as const },
    { theme, variant: 'standalone' as const, animated: true, state: 'working' as const, mono: true },
    { theme, mono: true },
  ]);

  it.each(cases)('matches the core output for %o', (options) => {
    const markup = renderToStaticMarkup(<Avatar name="Claudette" size={40} {...options} />);
    expect(describeTree(markup)).toEqual(describeTree(createAvatar('Claudette', { size: 40, ...options })));
  });

  it('renders the stylesheet as a text child, not injected HTML', () => {
    const { container } = render(<Avatar name="Claudette" variant="standalone" animated />);
    const style = container.querySelector('svg > style')!;
    expect(style.textContent).toContain('.chara-mecha[data-state]');
    expect(style.childNodes).toHaveLength(1);
    expect(style.firstChild!.nodeType).toBe(3);
  });

  it('changes state on the same element without regenerating', () => {
    let draws = 0;
    const theme = defineTheme({
      id: 'counted',
      draw: () => ({ background: '#fff', content: [] }),
      character: ({ el }) => {
        draws++;
        return { content: [el('circle', { class: 'dot', r: 5 })] };
      },
      animation: '.chara-counted[data-state=thinking] .dot{opacity:.5}',
    });
    const { container, rerender } = render(<Avatar name="a" theme={theme} variant="standalone" animated />);
    const svg = container.querySelector('svg')!;
    const dot = container.querySelector('circle')!;
    expect(svg.getAttribute('data-state')).toBe('idle');
    rerender(<Avatar name="a" theme={theme} variant="standalone" animated state="thinking" />);
    expect(container.querySelector('svg')).toBe(svg);
    expect(container.querySelector('circle')).toBe(dot);
    expect(svg.getAttribute('data-state')).toBe('thinking');
    expect(draws).toBe(1);
  });

  it('validates the state on every render', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(<Avatar name="a" variant="standalone" animated state="idle" />);
    expect(() =>
      rerender(<Avatar name="a" variant="standalone" animated state={'dancing' as never} />),
    ).toThrow(TypeError);
    expect(() => render(<Avatar name="a" state={'dancing' as never} />)).toThrow(TypeError);
  });

  it('has no data-state unless animated', () => {
    const { container } = render(<Avatar name="a" variant="standalone" state="sleeping" />);
    expect(container.querySelector('svg')!.hasAttribute('data-state')).toBe(false);
    expect(container.querySelector('style')).toBeNull();
  });

  it('rejects an animated tile like the core does', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Avatar name="a" animated />)).toThrow(TypeError);
  });

  it('merges className with the generated classes', () => {
    const { container } = render(<Avatar name="a" variant="standalone" className="hero" />);
    const classes = container.querySelector('svg')!.getAttribute('class')!.split(' ');
    expect(classes).toEqual(expect.arrayContaining(['chara', 'chara-mecha', 'hero']));
  });

  it('reserves data-state and data-mono', () => {
    const { container } = render(
      <Avatar
        name="a"
        variant="standalone"
        animated
        state="idle"
        {...({ 'data-state': 'error', 'data-mono': 'x' } as object)}
      />,
    );
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('data-state')).toBe('idle');
    expect(svg.hasAttribute('data-mono')).toBe(false);
  });

  it('hydrates animated avatars, including duplicates, without mismatches', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = (
      <div>
        {THEME_IDS.map((theme) => (
          <span key={theme}>
            <Avatar name="Claudette" theme={theme} variant="standalone" animated state="sleeping" />
            <Avatar name="Claudette" theme={theme} variant="standalone" animated state="sleeping" />
            <Avatar name="Imagine" theme={theme} variant="standalone" mono />
          </span>
        ))}
      </div>
    );
    const host = document.createElement('div');
    host.innerHTML = renderToString(app);
    document.body.append(host);
    act(() => {
      hydrateRoot(host, app, { onRecoverableError: (error) => console.error(error) });
    });
    expect(errors).not.toHaveBeenCalled();
    expect(host.querySelectorAll('svg[data-state="sleeping"]')).toHaveLength(6);
  });

  it('passes the new options through the data URI hook', () => {
    const options = {
      theme: 'critter',
      variant: 'standalone',
      animated: true,
      state: 'error',
      mono: true,
    } as const;
    const { result } = renderHook(() => useAvatarDataUri('Claudette', options));
    expect(result.current).toBe(createAvatarDataUri('Claudette', options));
  });
});
