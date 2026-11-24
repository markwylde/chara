import { hsl } from './color.js';
import { f1, mirrorX, smoothClosedPath } from './geometry.js';
import { normalizeName } from './normalize.js';
import { createRandom, cyrb128 } from './random.js';
import { validateTree } from './safety.js';
import { el, num, type SvgNode, serialize, stripInvalidXml } from './svg.js';
import type { Theme, ThemeContext } from './theme.js';

export const DEFAULT_RADIUS = 24;

/** Options shared by every way of generating an avatar. */
export interface BaseAvatarOptions {
  /** Pixel width and height. Must be a finite number above 0. Omit to scale with the container. */
  size?: number;
  /** Corner radius in viewBox units: 0 is square, 50 is a circle. Clamped to 0–50; default 24. */
  radius?: number;
  /** Accessible name. Omit (or leave blank) for a decorative avatar. */
  title?: string;
  /** Prefix for every id in the SVG: a letter or underscore, then letters, digits, "-" or "_". */
  idPrefix?: string;
  /** Normalise the name (case, spacing, Unicode form) before seeding. Default true. */
  normalize?: boolean;
}

export interface CoreAvatarOptions extends BaseAvatarOptions {
  theme: Theme;
}

const ID_PREFIX_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const LOCAL_ID_RE = /^[A-Za-z0-9_-]+$/;

function resolveRadius(radius: number | undefined): number {
  if (radius === undefined || !Number.isFinite(radius)) return DEFAULT_RADIUS;
  return Math.min(50, Math.max(0, radius));
}

function hash64(input: string): string {
  const [a, b] = cyrb128(input);
  return a.toString(36).padStart(7, '0') + b.toString(36).padStart(7, '0');
}

/** Builds the avatar as a node tree for a theme object. */
export function createAvatarTree(name: string, options: CoreAvatarOptions): SvgNode {
  const { theme, size, title, idPrefix = '', normalize = true } = options;
  if (!theme || typeof theme.draw !== 'function' || typeof theme.id !== 'string') {
    throw new TypeError('createAvatarTree() needs a theme object (see defineTheme)');
  }
  if (size !== undefined && !(typeof size === 'number' && Number.isFinite(size) && size > 0)) {
    throw new RangeError(`Avatar size must be a finite number greater than 0, got ${String(size)}`);
  }
  if (idPrefix !== '' && !ID_PREFIX_RE.test(idPrefix)) {
    throw new TypeError(
      `Invalid idPrefix ${JSON.stringify(idPrefix)}: start with a letter or underscore, then use letters, digits, "-" or "_"`,
    );
  }
  const radius = resolveRadius(options.radius);
  const seed = normalizeName(name, normalize);
  const idBase = `${idPrefix}c${hash64(`${theme.id}\0${seed}\0r${num(radius)}`)}`;
  const defs: SvgNode[] = [];

  const id = (local: string): string => {
    if (!LOCAL_ID_RE.test(local)) throw new TypeError(`Invalid local id ${JSON.stringify(local)}`);
    return `${idBase}-${local}`;
  };
  const ctx: ThemeContext = {
    rand: createRandom(`${theme.id}:${seed}`),
    hsl,
    id,
    ref: (target) => `url(#${target})`,
    def: (node) => {
      defs.push(node);
    },
    el,
    mirrorX,
    smoothClosedPath,
    f1,
  };

  const drawing = theme.draw(ctx);
  if (!drawing || typeof drawing.background !== 'string' || !Array.isArray(drawing.content)) {
    throw new TypeError(`Theme "${theme.id}" must return { background: string, content: SvgNode[] }`);
  }

  const frameId = id('frame');
  const cleanTitle = title === undefined ? '' : stripInvalidXml(String(title)).trim();
  const root = el(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 100 100',
      width: size,
      height: size,
      role: cleanTitle ? 'img' : undefined,
      'aria-hidden': cleanTitle ? undefined : 'true',
    },
    cleanTitle ? el('title', {}, cleanTitle) : null,
    el(
      'defs',
      {},
      el('clipPath', { id: frameId }, el('rect', { width: 100, height: 100, rx: radius })),
      defs,
    ),
    el(
      'g',
      { 'clip-path': `url(#${frameId})` },
      el('rect', { width: 100, height: 100, fill: drawing.background }),
      drawing.content,
    ),
  );
  validateTree(root);
  return root;
}

/** The avatar as SVG markup. */
export function createAvatar(name: string, options: CoreAvatarOptions): string {
  return serialize(createAvatarTree(name, options));
}

/** The avatar as a `data:image/svg+xml` URI, usable as an image src or CSS background. */
export function createAvatarDataUri(name: string, options: CoreAvatarOptions): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createAvatar(name, options))}`;
}
