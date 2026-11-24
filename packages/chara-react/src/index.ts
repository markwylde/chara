import {
  ALLOWED_ATTRIBUTES,
  type AvatarOptions,
  type AvatarState,
  type AvatarVariant,
  createAvatarDataUri,
  createAvatarTree,
  resolveState,
  type SvgChild,
  type SvgNode,
  type Theme,
  type ThemeId,
} from '@markwylde/chara';
import { createElement, forwardRef, type ReactNode, type SVGProps, useMemo } from 'react';

export type { AvatarOptions, AvatarState, AvatarVariant, Theme, ThemeId } from '@markwylde/chara';

/** Props the component controls itself; passing them has no effect. */
const RESERVED = new Set([
  'viewBox',
  'xmlns',
  'children',
  'dangerouslySetInnerHTML',
  'data-state',
  'data-mono',
]);

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
  /** "tile" (default) or "standalone": the whole character with no background. */
  variant?: AvatarVariant;
  /** Animate a standalone avatar. Default false. */
  animated?: boolean;
  /** What an animated avatar is doing. Default "idle". Changing it does not rebuild the avatar. */
  state?: AvatarState;
  /** Draw in greys only. Default false. */
  mono?: boolean;
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
  const { name, theme, size, radius, title, idPrefix, normalize, variant, animated, state, mono, ...rest } =
    props;
  // The state is not part of the tree: every state's rules are already in the
  // stylesheet, so a change only flips data-state and nothing is rebuilt.
  const tree: SvgNode = useMemo(
    () =>
      createAvatarTree(name, { theme, size, radius, title, idPrefix, normalize, variant, animated, mono }),
    [name, theme, size, radius, title, idPrefix, normalize, variant, animated, mono],
  );
  const children = useMemo(() => renderChildren(tree.children), [tree]);
  const currentState = resolveState(state);
  const callerProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) if (!RESERVED.has(key)) callerProps[key] = value;
  const rootProps: Record<string, unknown> = toProps(tree.attrs);
  if (animated) rootProps['data-state'] = currentState;
  const className = [rootProps.className, callerProps.className].filter(Boolean).join(' ') || undefined;
  return createElement(
    'svg',
    { ...rootProps, ...callerProps, className, viewBox: rootProps.viewBox, xmlns: rootProps.xmlns, ref },
    ...children,
  );
});

/** The avatar as a `data:image/svg+xml` URI, for `<img>`, CSS backgrounds or favicons. */
export function useAvatarDataUri(name: string, options: AvatarOptions = {}): string {
  const { theme, size, radius, title, idPrefix, normalize, variant, animated, state, mono } = options;
  return useMemo(
    () =>
      createAvatarDataUri(name, {
        theme,
        size,
        radius,
        title,
        idPrefix,
        normalize,
        variant,
        animated,
        state,
        mono,
      }),
    [name, theme, size, radius, title, idPrefix, normalize, variant, animated, state, mono],
  );
}
