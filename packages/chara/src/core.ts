export {
  type AvatarState,
  type AvatarVariant,
  resolveState,
  resolveVariant,
  STATES,
  VARIANTS,
} from './animation.js';
export { hsl, hslMono, toGrey } from './color.js';
export { f1, mirrorX, smoothClosedPath } from './geometry.js';
export { FALLBACK_SEED, normalizeName } from './normalize.js';
export { createRandom, cyrb128, type Random, randomFrom } from './random.js';
export {
  type BaseAvatarOptions,
  type CoreAvatarOptions,
  createAvatar,
  createAvatarDataUri,
  createAvatarTree,
  DEFAULT_RADIUS,
} from './render.js';
export {
  ALLOWED_ATTRIBUTES,
  ALLOWED_TAGS,
  CharaSafetyError,
  checkAnimationCss,
  validateTree,
} from './safety.js';
export { type AttrValue, el, num, type SvgChild, type SvgNode, serialize } from './svg.js';
export {
  defineTheme,
  type Theme,
  type ThemeCharacter,
  type ThemeContext,
  type ThemeDefinition,
  type ThemeDrawing,
} from './theme.js';
