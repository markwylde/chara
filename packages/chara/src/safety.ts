import { type SvgChild, type SvgNode, stripInvalidXml } from './svg.js';

/** Elements a Chara avatar may contain. `svg` is only allowed as the root. */
export const ALLOWED_TAGS: ReadonlySet<string> = new Set([
  'svg',
  'title',
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
      if (parent?.tag !== 'title') {
        throw new CharaSafetyError(
          `Text is only allowed inside <title>, found it inside <${parent?.tag ?? 'root'}>`,
        );
      }
      return;
    }
    if (!ALLOWED_TAGS.has(node.tag)) throw new CharaSafetyError(`Element <${node.tag}> is not allowed`);
    if (node.tag === 'svg' && parent !== null)
      throw new CharaSafetyError('Nested <svg> elements are not allowed');
    for (const [name, value] of Object.entries(node.attrs)) {
      if (!Object.hasOwn(ALLOWED_ATTRIBUTES, name)) {
        throw new CharaSafetyError(`Attribute "${name}" on <${node.tag}> is not allowed`);
      }
      if (name === 'xmlns' && (parent !== null || value !== 'http://www.w3.org/2000/svg')) {
        throw new CharaSafetyError(
          'Attribute "xmlns" is only allowed on the SVG root with the SVG namespace',
        );
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
