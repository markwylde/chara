import type { AvatarState, ThemeId } from '@markwylde/chara';

/** The options that differ from the defaults; absent keys mean "default". */
export interface LookOptions {
  variant?: 'standalone';
  animated?: true;
  state?: AvatarState;
  mono?: true;
}

/**
 * Turns the control values into the options actually used. Animation and
 * state only apply to standalone avatars, whatever the disabled controls
 * still hold, and anything left at its default is omitted.
 */
export function effectiveOptions(controls: {
  standalone: boolean;
  animate: boolean;
  state: AvatarState;
  mono: boolean;
}): LookOptions {
  const out: LookOptions = {};
  if (controls.standalone) {
    out.variant = 'standalone';
    if (controls.animate) {
      out.animated = true;
      if (controls.state !== 'idle') out.state = controls.state;
    }
  }
  if (controls.mono) out.mono = true;
  return out;
}

export interface SnippetOptions extends LookOptions {
  name: string;
  theme: ThemeId;
  size: number;
  radius: number;
}

/** A JSX snippet for the React package. The name goes in a JS string, so quotes, braces and newlines stay safe. */
export function buildReactSnippet(options: SnippetOptions): string {
  const { name, theme, size, radius, variant, animated, state, mono } = options;
  const props = [`name={${JSON.stringify(name)}}`, `theme="${theme}"`, `size={${size}}`];
  // A standalone avatar has no frame, so radius would do nothing.
  if (variant === 'standalone') props.push('variant="standalone"');
  else props.push(`radius={${radius}}`);
  if (animated) props.push('animated');
  if (animated && state) props.push(`state="${state}"`);
  if (mono) props.push('mono');
  return ["import { Avatar } from '@markwylde/chara-react';", '', `<Avatar ${props.join(' ')} />`].join('\n');
}
