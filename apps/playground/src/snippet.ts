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

/** The less common options. Empty strings and `normalize: true` mean "default" and are left out. */
export interface ExtraOptions {
  title?: string;
  idPrefix?: string;
  normalize?: false;
}

export function extraOptions(controls: {
  title: string;
  idPrefix: string;
  normalize: boolean;
}): ExtraOptions {
  const out: ExtraOptions = {};
  if (controls.title.trim()) out.title = controls.title.trim();
  if (controls.idPrefix) out.idPrefix = controls.idPrefix;
  if (!controls.normalize) out.normalize = false;
  return out;
}

export interface SnippetOptions extends LookOptions, ExtraOptions {
  name: string;
  theme: ThemeId;
  size: number;
  radius: number;
}

/** A JSX snippet for the React package. The name goes in a JS string, so quotes, braces and newlines stay safe. */
export function buildReactSnippet(options: SnippetOptions): string {
  const { name, theme, size, radius, variant, animated, state, mono, title, idPrefix, normalize } = options;
  const props = [`name={${JSON.stringify(name)}}`, `theme="${theme}"`, `size={${size}}`];
  // A standalone avatar has no frame, so radius would do nothing.
  if (variant === 'standalone') props.push('variant="standalone"');
  else props.push(`radius={${radius}}`);
  if (animated) props.push('animated');
  if (animated && state) props.push(`state="${state}"`);
  if (mono) props.push('mono');
  if (title) props.push(`title={${JSON.stringify(title)}}`);
  if (idPrefix) props.push(`idPrefix="${idPrefix}"`);
  if (normalize === false) props.push('normalize={false}');
  return ["import { Avatar } from '@markwylde/chara-react';", '', `<Avatar ${props.join(' ')} />`].join('\n');
}

/** The same avatar as a call to the core library. */
export function buildJsSnippet(options: SnippetOptions): string {
  const { name, theme, size, radius, variant, animated, state, mono, title, idPrefix, normalize } = options;
  const lines = [`theme: '${theme}'`, `size: ${size}`];
  if (variant === 'standalone') lines.push("variant: 'standalone'");
  else lines.push(`radius: ${radius}`);
  if (animated) lines.push('animated: true');
  if (animated && state) lines.push(`state: '${state}'`);
  if (mono) lines.push('mono: true');
  if (title) lines.push(`title: ${JSON.stringify(title)}`);
  if (idPrefix) lines.push(`idPrefix: '${idPrefix}'`);
  if (normalize === false) lines.push('normalize: false');
  return [
    "import { createAvatar } from '@markwylde/chara';",
    '',
    `const svg = createAvatar(${JSON.stringify(name)}, {`,
    ...lines.map((line) => `  ${line},`),
    '});',
  ].join('\n');
}

/** "5.2 KB" style size of a string once encoded as UTF-8. */
export function byteSize(text: string): string {
  const bytes = new TextEncoder().encode(text).length;
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}
