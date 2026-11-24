/** What a standalone avatar can be doing. */
export const STATES = ['idle', 'thinking', 'working', 'success', 'error', 'sleeping'] as const;
export type AvatarState = (typeof STATES)[number];

export const VARIANTS = ['tile', 'standalone'] as const;
export type AvatarVariant = (typeof VARIANTS)[number];

/** Number of `chara_d<n>` timing-offset classes. The underscore keeps them apart from theme classes. */
export const DELAY_STEPS = 8;

/** Returns the state, defaulting to "idle". Throws a TypeError for anything else. */
export function resolveState(state: unknown): AvatarState {
  if (state === undefined) return 'idle';
  if (typeof state === 'string' && (STATES as readonly string[]).includes(state)) return state as AvatarState;
  throw new TypeError(`Unknown avatar state ${JSON.stringify(state)}. Use one of: ${STATES.join(', ')}`);
}

/** Returns the variant, defaulting to "tile". Throws a TypeError for anything else. */
export function resolveVariant(variant: unknown): AvatarVariant {
  if (variant === undefined) return 'tile';
  if (typeof variant === 'string' && (VARIANTS as readonly string[]).includes(variant))
    return variant as AvatarVariant;
  throw new TypeError(
    `Unknown avatar variant ${JSON.stringify(variant)}. Use one of: ${VARIANTS.join(', ')}`,
  );
}

/** The selector every animation rule for a theme must start with. */
export function animationScope(themeId: string): string {
  return `.chara-${themeId}[data-state]`;
}

/**
 * The rules the frame adds around a theme's animation CSS: the per-name
 * timing offset (which an `animation` shorthand cannot reset) and the
 * reduced-motion switch.
 */
export function frameCss(themeId: string, themeCss: string): string {
  const root = animationScope(themeId);
  let delays = '';
  for (let i = 1; i < DELAY_STEPS; i++) delays += `${root}.chara_d${i}{--chara-d:-${(i * 0.6).toFixed(1)}s}`;
  return (
    `${root},${root} *{animation-delay:var(--chara-d,0s)!important}${delays}${themeCss}` +
    `@media (prefers-reduced-motion:reduce){${root},${root} *{animation:none!important}}`
  );
}
