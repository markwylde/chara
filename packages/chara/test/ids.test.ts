import { describe, expect, it } from 'vitest';
import { createAvatar, defineTheme, THEME_IDS } from '../src/index.js';
import { GOLDEN_NAMES, parseXml } from './helpers.js';

const definedIds = (svg: string) => {
  const doc = parseXml(svg);
  const map = new Map<string, string>();
  const walk = (node: Element) => {
    const id = node.getAttribute('id');
    if (id) map.set(id, node.toString());
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i] as Element;
      if (child.nodeType === 1) walk(child);
    }
  };
  walk(doc.documentElement as unknown as Element);
  return map;
};

describe('ids across inlined avatars', () => {
  it('never define one id with different content', () => {
    const all = new Map<string, string>();
    for (const theme of THEME_IDS) {
      for (const name of GOLDEN_NAMES.slice(0, 20)) {
        for (const radius of [0, 24, 50]) {
          for (const [id, content] of definedIds(createAvatar(name, { theme, radius }))) {
            const existing = all.get(id);
            if (existing !== undefined) expect(existing).toBe(content);
            all.set(id, content);
          }
        }
      }
    }
    expect(all.size).toBeGreaterThan(0);
  });

  it('never clash between tile, standalone and mono versions', () => {
    const all = new Map<string, string>();
    for (const theme of THEME_IDS) {
      for (const variant of ['tile', 'standalone'] as const) {
        for (const mono of [false, true]) {
          for (const animated of variant === 'standalone' ? [false, true] : [false]) {
            const svg = createAvatar('Claudette', { theme, variant, mono, animated });
            for (const [id, content] of definedIds(svg)) {
              const existing = all.get(id);
              if (existing !== undefined) expect(existing).toBe(content);
              all.set(id, content);
            }
          }
        }
      }
    }
    expect(all.size).toBeGreaterThan(6);
  });

  it('share no id for the same name at different radii', () => {
    for (const theme of THEME_IDS) {
      const a = [...definedIds(createAvatar('Claudette', { theme, radius: 0 })).keys()];
      const b = new Set(definedIds(createAvatar('Claudette', { theme, radius: 50 })).keys());
      for (const id of a) expect(b.has(id)).toBe(false);
    }
  });

  it('are identical for the same avatar', () => {
    expect([...definedIds(createAvatar('Otto', { theme: 'critter' })).keys()]).toEqual([
      ...definedIds(createAvatar('otto', { theme: 'critter' })).keys(),
    ]);
  });

  it('isolates custom gradient IDs across names, radii and prefixes', () => {
    const theme = defineTheme({
      id: 'gradient',
      draw: ({ el, id, ref, def, rand, hsl }) => {
        const gradient = id('bg');
        def(
          el(
            'linearGradient',
            { id: gradient },
            el('stop', { offset: 0, 'stop-color': hsl(rand.int(360), 50, 50) }),
          ),
        );
        return { background: ref(gradient), content: [] };
      },
    });
    const all = new Set<string>();
    for (const name of ['Claudette', 'Imagine']) {
      for (const radius of [0, 50]) {
        for (const idPrefix of ['first-', 'second-']) {
          for (const id of definedIds(createAvatar(name, { theme, radius, idPrefix })).keys()) {
            expect(id.startsWith(idPrefix)).toBe(true);
            expect(all.has(id)).toBe(false);
            all.add(id);
          }
        }
      }
    }
  });
});
