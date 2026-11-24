import {
  ALLOWED_ATTRIBUTES,
  type AvatarOptions,
  createAvatarDataUri,
  createAvatarTree,
  type SvgChild,
  type SvgNode,
  type Theme,
  type ThemeId,
} from '@markwylde/chara';
import { createElement, forwardRef, type ReactNode, type SVGProps, useMemo } from 'react';

export type { AvatarOptions, Theme, ThemeId } from '@markwylde/chara';

/** Props the component controls itself; passing them has no effect. */
const RESERVED = new Set(['viewBox', 'xmlns', 'children', 'dangerouslySetInnerHTML']);

type ForwardedSvgProps = Omit<
  SVGProps<SVGSVGElement>,
  'ref' | 'children' | 'dangerouslySetInnerHTML' | 'viewBox' | 'xmlns' | 'radius'
>;

export interface AvatarProps extends ForwardedSvgProps {
  /** The name to draw an avatar for. */
  name: string;
  /** A built-in theme id or a theme object. Default "mecha". */
  theme?: ThemeId | Theme;
  /** Pixel width and height. Omit to scale with the container. */
  size?: number;
  /** Corner radius in viewBox units: 0 square, 50 circle. Default 24. */
  radius?: number;
  /** Accessible name. Omit for a decorative avatar (aria-hidden). */
  title?: string;
  /** Prefix for every id inside the SVG. */
  idPrefix?: string;
  /** Normalise the name before seeding. Default true. */
  normalize?: boolean;
}

/** Converts a Chara attribute name to the prop name React expects. */
export function reactAttributeName(name: string): string {
  const mapped = ALLOWED_ATTRIBUTES[name];
  if (mapped === undefined) throw new Error(`Chara attribute "${name}" has no React mapping`);
  return mapped;
}

function toProps(attrs: Record<string, string>): Record<string, string> {
  const props: Record<string, string> = {};
  for (const [name, value] of Object.entries(attrs)) props[reactAttributeName(name)] = value;
  return props;
}

function renderChildren(children: SvgChild[]): ReactNode[] {
  return children.map((child, index) => renderNode(child, index));
}

/** Renders a Chara node tree as React elements. */
export function renderNode(node: SvgChild, key?: number): ReactNode {
  if (typeof node === 'string') return node;
  return createElement(node.tag, { ...toProps(node.attrs), key }, ...renderChildren(node.children));
}

/** Renders the avatar for a name as an inline SVG. */
export const Avatar = forwardRef<SVGSVGElement, AvatarProps>(function Avatar(props, ref) {
  const { name, theme, size, radius, title, idPrefix, normalize, ...rest } = props;
  const tree: SvgNode = useMemo(
    () => createAvatarTree(name, { theme, size, radius, title, idPrefix, normalize }),
    [name, theme, size, radius, title, idPrefix, normalize],
  );
  const callerProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) if (!RESERVED.has(key)) callerProps[key] = value;
  const rootProps = toProps(tree.attrs);
  return createElement(
    'svg',
    { ...rootProps, ...callerProps, viewBox: rootProps.viewBox, xmlns: rootProps.xmlns, ref },
    ...renderChildren(tree.children),
  );
});

/** The avatar as a `data:image/svg+xml` URI, for `<img>`, CSS backgrounds or favicons. */
export function useAvatarDataUri(name: string, options: AvatarOptions = {}): string {
  const { theme, size, radius, title, idPrefix, normalize } = options;
  return useMemo(
    () => createAvatarDataUri(name, { theme, size, radius, title, idPrefix, normalize }),
    [name, theme, size, radius, title, idPrefix, normalize],
  );
}
