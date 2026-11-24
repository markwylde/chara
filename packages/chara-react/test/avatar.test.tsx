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
    for (const opts of [{ size: 40 }, { radius: 50, title: 'Claudette' }, { idPrefix: 'x-' }]) {
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
    const props = { viewBox: '0 0 10 10', children: <circle data-testid="child" />, xmlns: 'x' } as Record<
      string,
      unknown
    >;
    const { container } = render(<Avatar name="Claudette" {...props} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
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
