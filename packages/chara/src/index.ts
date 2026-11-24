import {
  type BaseAvatarOptions,
  createAvatar as coreCreateAvatar,
  createAvatarDataUri as coreCreateAvatarDataUri,
  createAvatarTree as coreCreateAvatarTree,
} from './render.js';
import type { SvgNode } from './svg.js';
import type { Theme } from './theme.js';
import { critter } from './themes/critter.js';
import { mecha } from './themes/mecha.js';
import { sigil } from './themes/sigil.js';

export * from './core.js';
export { critter, mecha, sigil };

/** The built-in themes, by id. */
export const themes = Object.freeze({ mecha, critter, sigil });
export type ThemeId = keyof typeof themes;
export const THEME_IDS = Object.freeze(Object.keys(themes) as ThemeId[]);
export const DEFAULT_THEME: ThemeId = 'mecha';

export interface AvatarOptions extends BaseAvatarOptions {
  /** A built-in theme id or a theme object. Default "mecha". */
  theme?: ThemeId | Theme;
}

/** Resolves a theme id or object to a theme object. Throws for unknown ids. */
export function resolveTheme(theme: ThemeId | Theme | undefined = DEFAULT_THEME): Theme {
  if (typeof theme === 'object' && theme !== null) return theme;
  if (typeof theme === 'string' && Object.hasOwn(themes, theme)) return themes[theme as ThemeId];
  throw new TypeError(`Unknown Chara theme ${JSON.stringify(theme)}. Use one of: ${THEME_IDS.join(', ')}`);
}

/** The avatar as a node tree. */
export function createAvatarTree(name: string, options: AvatarOptions = {}): SvgNode {
  return coreCreateAvatarTree(name, { ...options, theme: resolveTheme(options.theme) });
}

/** The avatar as SVG markup. */
export function createAvatar(name: string, options: AvatarOptions = {}): string {
  return coreCreateAvatar(name, { ...options, theme: resolveTheme(options.theme) });
}

/** The avatar as a `data:image/svg+xml` URI. */
export function createAvatarDataUri(name: string, options: AvatarOptions = {}): string {
  return coreCreateAvatarDataUri(name, { ...options, theme: resolveTheme(options.theme) });
}
