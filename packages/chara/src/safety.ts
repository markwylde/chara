import { type SvgChild, type SvgNode, stripInvalidXml } from './svg.js';

/** Elements a Chara avatar may contain. `svg` is only allowed as the root. */
export const ALLOWED_TAGS: ReadonlySet<string> = new Set([
  'svg',
  'title',
  // Only as a direct child of the root, where only the frame can put it.
  'style',
  'defs',
  'g',
  'clipPath',
  'linearGradient',
  'radialGradient',
  'stop',
  'rect',
  'circle',
  'ellipse',
  'path',
  'line',
  'polyline',
  'polygon',
]);

/**
 * Attributes a Chara avatar may use, mapped to the prop name React expects.
 * Anything not listed here (event handlers, `style`, `href`, …) is rejected.
 */
export const ALLOWED_ATTRIBUTES: Readonly<Record<string, string>> = Object.freeze({
  // root
  xmlns: 'xmlns',
  viewBox: 'viewBox',
  role: 'role',
  'aria-hidden': 'aria-hidden',
  overflow: 'overflow',
  'data-state': 'data-state',
  'data-mono': 'data-mono',
  // hooks for animation
  class: 'className',
  display: 'display',
  // identity
  id: 'id',
  // geometry
  x: 'x',
  y: 'y',
  width: 'width',
  height: 'height',
  rx: 'rx',
  ry: 'ry',
  cx: 'cx',
  cy: 'cy',
  r: 'r',
  d: 'd',
  points: 'points',
  x1: 'x1',
  y1: 'y1',
  x2: 'x2',
  y2: 'y2',
  fx: 'fx',
  fy: 'fy',
  transform: 'transform',
  // paint
  fill: 'fill',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  stroke: 'stroke',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-opacity': 'strokeOpacity',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-miterlimit': 'strokeMiterlimit',
  opacity: 'opacity',
  // clipping
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  clipPathUnits: 'clipPathUnits',
  // gradients
  offset: 'offset',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  gradientUnits: 'gradientUnits',
  gradientTransform: 'gradientTransform',
  spreadMethod: 'spreadMethod',
});

const ID_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const CLASS_RE = /^[A-Za-z0-9_-]+(?: [A-Za-z0-9_-]+)*$/;
const THEME_CLASS_RE = /(?:^| )chara-([a-z][a-z0-9-]*)(?: |$)/;
const ROOT_ONLY: Readonly<Record<string, RegExp>> = {
  overflow: /^visible$/,
  'data-state': /^[a-z]+$/,
  'data-mono': /^$/,
};
const LOCAL_URL_RE = /^url\(#([A-Za-z_][A-Za-z0-9_-]*)\)$/;

// Inspect the value after XML cleanup and CSS token escapes, as a consumer
// would. Only the original, canonical url(#id) spelling is accepted below.
function decodedCss(value: string): string {
  return stripInvalidXml(value)
    .replace(/\r\n?|\f/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\\([0-9a-f]{1,6})[ \t\r\n\f]?|\\([^\r\n\f])/gi, (_, hex: string, char: string) => {
      if (!hex) return char;
      const code = Number.parseInt(hex, 16);
      return code === 0 || code > 0x10ffff ? '\uFFFD' : String.fromCodePoint(code);
    });
}

/** Thrown when an avatar would contain an element, attribute or reference outside the allowlist. */
export class CharaSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CharaSafetyError';
  }
}

const CSS_FORBIDDEN = ['\\', '<', '>', '&', '/*', 'url(', 'image(', 'image-set(', 'expression('];

function splitSelectors(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const ch = list[i];
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if (ch === ',' && depth === 0) {
      out.push(list.slice(start, i));
      start = i + 1;
    }
  }
  out.push(list.slice(start));
  return out;
}

/**
 * Checks animation CSS for a theme. It may not load anything external or
 * use escapes, its only at-rules are `@keyframes` and `@media`, every
 * selector must start with `.chara-<themeId>[data-state` and every
 * keyframes name with `chara-<themeId>-`. That keeps one theme's animation
 * from touching the host page, another theme, or a still avatar.
 */
export function checkAnimationCss(css: string, themeId: string): void {
  const fail = (why: string): never => {
    throw new CharaSafetyError(`Animation CSS for theme "${themeId}" ${why}`);
  };
  if (typeof css !== 'string') fail('must be a string');
  const lower = css.toLowerCase();
  for (const bad of CSS_FORBIDDEN) if (lower.includes(bad)) fail(`must not contain "${bad}"`);
  const scope = `.chara-${themeId}[data-state`;
  const keyframes = new RegExp(`^chara-${themeId}-[a-z0-9-]+$`);

  const walk = (src: string, inMedia: boolean): void => {
    let i = 0;
    while (i < src.length) {
      const open = src.indexOf('{', i);
      if (open < 0) {
        if (src.slice(i).trim() !== '') fail('has text outside a rule');
        return;
      }
      const prelude = src.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      for (; j < src.length && depth > 0; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') depth--;
      }
      if (depth !== 0) fail('has unbalanced braces');
      const body = src.slice(open + 1, j - 1);
      if (prelude.startsWith('@')) {
        const at = /^@(keyframes|media)\s+(\S[\s\S]*)$/i.exec(prelude);
        if (!at) fail(`uses a disallowed at-rule "${prelude.split(/\s/)[0]}"`);
        else if (at[1]?.toLowerCase() === 'keyframes') {
          if (!keyframes.test(at[2] as string))
            fail(`must name keyframes "chara-${themeId}-…", got "${at[2]}"`);
          if (body.includes('@')) fail('has an at-rule inside keyframes');
        } else if (inMedia) fail('nests @media rules');
        else walk(body, true);
      } else {
        if (prelude === '' || /[}~+;]/.test(prelude)) fail(`has an invalid selector "${prelude}"`);
        if (body.includes('{') || body.includes('@')) fail('nests rules inside a style rule');
        for (const selector of splitSelectors(prelude)) {
          if (!selector.trim().startsWith(scope))
            fail(`has a selector outside ${scope}]: "${selector.trim()}"`);
        }
      }
      i = j;
    }
  };
  walk(css, false);
}

/**
 * Checks a whole avatar tree against the allowlist: allowed tags and
 * attributes only, `svg` only at the root, text only inside `title`, unique
 * IDs, and every `url(...)` pointing at an ID defined in the same tree.
 * When supplied, idNamespace restricts IDs to the avatar's generated prefix.
 */
export function validateTree(root: SvgNode, idNamespace?: string): void {
  const defined = new Set<string>();
  const referenced: string[] = [];

  const visit = (node: SvgChild, parent: SvgNode | null): void => {
    if (typeof node === 'string') {
      if (parent?.tag !== 'title' && parent?.tag !== 'style') {
        throw new CharaSafetyError(
          `Text is only allowed inside <title>, found it inside <${parent?.tag ?? 'root'}>`,
        );
      }
      return;
    }
    if (!ALLOWED_TAGS.has(node.tag)) throw new CharaSafetyError(`Element <${node.tag}> is not allowed`);
    if (node.tag === 'svg' && parent !== null)
      throw new CharaSafetyError('Nested <svg> elements are not allowed');
    if (node.tag === 'style') {
      if (parent !== root)
        throw new CharaSafetyError('<style> is only allowed as a direct child of the root');
      const themeId = THEME_CLASS_RE.exec(root.attrs.class ?? '')?.[1];
      if (themeId === undefined || node.children.some((child) => typeof child !== 'string')) {
        throw new CharaSafetyError('<style> needs a root theme class and text content only');
      }
      checkAnimationCss(node.children.join(''), themeId);
    }
    for (const [name, value] of Object.entries(node.attrs)) {
      if (!Object.hasOwn(ALLOWED_ATTRIBUTES, name)) {
        throw new CharaSafetyError(`Attribute "${name}" on <${node.tag}> is not allowed`);
      }
      if (name === 'xmlns' && (parent !== null || value !== 'http://www.w3.org/2000/svg')) {
        throw new CharaSafetyError(
          'Attribute "xmlns" is only allowed on the SVG root with the SVG namespace',
        );
      }
      const rootOnly = ROOT_ONLY[name];
      if (rootOnly !== undefined && (parent !== null || !rootOnly.test(value))) {
        throw new CharaSafetyError(`Attribute "${name}" is only allowed on the SVG root with a fixed value`);
      }
      if (name === 'class' && !CLASS_RE.test(value)) {
        throw new CharaSafetyError(`Class "${value}" may only use letters, digits, "-", "_" and spaces`);
      }
      if (name === 'display' && value !== 'none') {
        throw new CharaSafetyError('Attribute "display" only allows the value "none"');
      }
      if (name === 'id') {
        if (!ID_RE.test(value)) throw new CharaSafetyError(`Element id "${value}" is not a valid id`);
        if (idNamespace !== undefined && !value.startsWith(idNamespace)) {
          throw new CharaSafetyError(`Element id "${value}" must be generated with ctx.id(local)`);
        }
        if (defined.has(value)) throw new CharaSafetyError(`Element id "${value}" is defined more than once`);
        defined.add(value);
      }
      if (decodedCss(value).toLowerCase().includes('url(')) {
        const match = LOCAL_URL_RE.exec(value);
        if (!match) {
          throw new CharaSafetyError(
            `Attribute "${name}" value "${value}" must be a local url(#id) reference`,
          );
        }
        referenced.push(match[1] as string);
      }
    }
    for (const child of node.children) visit(child, node);
  };

  if (root.tag !== 'svg') throw new CharaSafetyError('The root element must be <svg>');
  visit(root, null);
  for (const id of referenced) {
    if (!defined.has(id))
      throw new CharaSafetyError(`Reference url(#${id}) does not match any element in the avatar`);
  }
}
