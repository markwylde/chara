import type { hsl } from './color.js';
import type { f1, mirrorX, smoothClosedPath } from './geometry.js';
import type { Random } from './random.js';
import type { el, SvgNode } from './svg.js';

/** What a theme's draw function returns. */
export interface ThemeDrawing {
  /** A colour, or `ctx.ref(id)` pointing at a gradient registered with `ctx.def`. */
  background: string;
  /** Nodes drawn inside the avatar's rounded clip, on top of the background. */
  content: SvgNode[];
}

/** Everything a theme gets to draw with. */
export interface ThemeContext {
  /** Seeded randomness. Call it in a fixed order so output stays stable. */
  rand: Random;
  /** HSL → `#rrggbb`. */
  hsl: typeof hsl;
  /** A document-unique, deterministic id for a definition, e.g. `ctx.id('body')`. */
  id(local: string): string;
  /** `url(#id)` for an id from {@link ThemeContext.id}. */
  ref(id: string): string;
  /** Registers a gradient or clip path in the avatar's `<defs>`. */
  def(node: SvgNode): void;
  el: typeof el;
  mirrorX: typeof mirrorX;
  smoothClosedPath: typeof smoothClosedPath;
  f1: typeof f1;
}

export interface Theme {
  readonly id: string;
  draw(ctx: ThemeContext): ThemeDrawing;
}

const THEME_ID_RE = /^[a-z][a-z0-9-]*$/;

/** Defines a theme. Ids are lowercase letters, digits and hyphens, starting with a letter. */
export function defineTheme(theme: { id: string; draw(ctx: ThemeContext): ThemeDrawing }): Theme {
  if (typeof theme?.id !== 'string' || !THEME_ID_RE.test(theme.id)) {
    throw new TypeError(
      `Invalid theme id ${JSON.stringify(theme?.id)}: use lowercase letters, digits and hyphens, starting with a letter`,
    );
  }
  if (typeof theme.draw !== 'function') throw new TypeError(`Theme "${theme.id}" needs a draw function`);
  return Object.freeze({ id: theme.id, draw: theme.draw });
}
