/** A plain SVG element node. Text is only allowed as a child of `title`. */
export interface SvgNode {
  tag: string;
  attrs: Record<string, string>;
  children: SvgChild[];
}
export type SvgChild = SvgNode | string;
export type AttrValue = string | number | undefined | null | false;

/** Formats a number for an attribute: at most 2 decimals, no trailing zeros, never "-0". */
export function num(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
}

/** Builds an element node. Numeric attributes are formatted with {@link num}; nullish/false ones are dropped. */
export function el(
  tag: string,
  attrs: Record<string, AttrValue> = {},
  ...children: (SvgChild | SvgChild[] | null | undefined | false | '')[]
): SvgNode {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    out[key] = typeof value === 'number' ? num(value) : value;
  }
  const kids: SvgChild[] = [];
  for (const child of children) {
    if (child === null || child === undefined || child === false || child === '') continue;
    if (Array.isArray(child)) kids.push(...child);
    else kids.push(child);
  }
  return { tag, attrs: out, children: kids };
}

// Characters XML 1.0 does not allow anywhere in a document.
const XML_INVALID = /[^\t\n\r\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu;

/** Removes characters that are not allowed in XML. */
export function stripInvalidXml(text: string): string {
  return text.replace(XML_INVALID, '');
}

function escapeText(text: string): string {
  return stripInvalidXml(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(text: string): string {
  return escapeText(text).replace(/"/g, '&quot;');
}

/** Serialises a node tree to SVG markup. Attribute order is insertion order, so output is stable. */
export function serialize(node: SvgChild): string {
  if (typeof node === 'string') return escapeText(node);
  let out = `<${node.tag}`;
  for (const [key, value] of Object.entries(node.attrs)) out += ` ${key}="${escapeAttr(value)}"`;
  if (node.children.length === 0) return `${out}/>`;
  out += '>';
  for (const child of node.children) out += serialize(child);
  return `${out}</${node.tag}>`;
}
