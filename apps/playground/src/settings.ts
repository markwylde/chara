import { type AvatarState, STATES, THEME_IDS, type ThemeId } from '@markwylde/chara';

export const BACKDROPS = ['split', 'light', 'dark', 'clear', 'custom'] as const;
export type Backdrop = (typeof BACKDROPS)[number];
export const GALLERY_COUNTS = [20, 40, 80] as const;
export type GalleryCount = (typeof GALLERY_COUNTS)[number];
export type Tone = 'dark' | 'light';

/** Everything the page lets a visitor change. The whole object round-trips through the URL. */
export interface Settings {
  name: string;
  theme: ThemeId;
  standalone: boolean;
  size: number;
  radius: number;
  animate: boolean;
  state: AvatarState;
  cycle: boolean;
  mono: boolean;
  backdrop: Backdrop;
  backdropColor: string;
  title: string;
  idPrefix: string;
  normalize: boolean;
  iconSize: number;
  tone: Tone;
  statuses: boolean;
  gallerySize: number;
  galleryCount: GalleryCount;
}

export const LIMITS = {
  size: [16, 400],
  radius: [0, 50],
  iconSize: [16, 72],
  gallerySize: [32, 160],
} as const;

export const DEFAULTS: Settings = {
  name: 'Maple',
  theme: 'critter',
  standalone: true,
  size: 200,
  radius: 24,
  animate: true,
  state: 'idle',
  cycle: false,
  mono: false,
  backdrop: 'split',
  backdropColor: '#ffd9a8',
  title: '',
  idPrefix: '',
  normalize: true,
  iconSize: 28,
  tone: 'dark',
  statuses: true,
  gallerySize: 72,
  galleryCount: 20,
};

/** The library's rule for `idPrefix`; anything else would make it throw. */
export const isValidIdPrefix = (value: string) => value === '' || /^[A-Za-z_][A-Za-z0-9_-]*$/.test(value);

// Short keys keep shared links readable.
const KEYS: Record<keyof Settings, string> = {
  name: 'n',
  theme: 't',
  standalone: 'v',
  size: 's',
  radius: 'r',
  animate: 'a',
  state: 'st',
  cycle: 'cy',
  mono: 'm',
  backdrop: 'bg',
  backdropColor: 'bc',
  title: 'ti',
  idPrefix: 'id',
  normalize: 'nz',
  iconSize: 'is',
  tone: 'ct',
  statuses: 'ls',
  gallerySize: 'gs',
  galleryCount: 'gc',
};

/** A query string holding only the settings that differ from the defaults. */
export function toQuery(settings: Settings): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(KEYS) as (keyof Settings)[]) {
    const value = settings[key];
    if (value === DEFAULTS[key]) continue;
    params.set(KEYS[key], typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
  }
  return params.toString();
}

const clamp = (raw: string, [min, max]: readonly [number, number], fallback: number) => {
  const value = Number(raw);
  return Number.isFinite(value) && raw.trim() !== ''
    ? Math.min(max, Math.max(min, Math.round(value)))
    : fallback;
};
const oneOf = <T extends string | number>(raw: T, allowed: readonly T[], fallback: T) =>
  allowed.includes(raw) ? raw : fallback;

/** Reads settings from a query string. Anything missing, unknown or out of range falls back to its default. */
export function fromQuery(search: string): Settings {
  const params = new URLSearchParams(search);
  const out: Settings = { ...DEFAULTS };
  const text = (key: keyof Settings) => params.get(KEYS[key]);
  const flag = (key: keyof Settings, fallback: boolean) => {
    const raw = text(key);
    return raw === '1' ? true : raw === '0' ? false : fallback;
  };
  const name = text('name');
  if (name !== null) out.name = name.slice(0, 64);
  out.theme = oneOf((text('theme') ?? '') as ThemeId, THEME_IDS, DEFAULTS.theme);
  out.standalone = flag('standalone', DEFAULTS.standalone);
  out.size = clamp(text('size') ?? '', LIMITS.size, DEFAULTS.size);
  out.radius = clamp(text('radius') ?? '', LIMITS.radius, DEFAULTS.radius);
  out.animate = flag('animate', DEFAULTS.animate);
  out.state = oneOf((text('state') ?? '') as AvatarState, STATES, DEFAULTS.state);
  out.cycle = flag('cycle', DEFAULTS.cycle);
  out.mono = flag('mono', DEFAULTS.mono);
  out.backdrop = oneOf((text('backdrop') ?? '') as Backdrop, BACKDROPS, DEFAULTS.backdrop);
  const color = text('backdropColor') ?? '';
  if (/^#[0-9a-f]{6}$/i.test(color)) out.backdropColor = color.toLowerCase();
  out.title = (text('title') ?? '').slice(0, 80);
  const prefix = text('idPrefix') ?? '';
  if (isValidIdPrefix(prefix)) out.idPrefix = prefix.slice(0, 32);
  out.normalize = flag('normalize', DEFAULTS.normalize);
  out.iconSize = clamp(text('iconSize') ?? '', LIMITS.iconSize, DEFAULTS.iconSize);
  out.tone = oneOf((text('tone') ?? '') as Tone, ['dark', 'light'] as const, DEFAULTS.tone);
  out.statuses = flag('statuses', DEFAULTS.statuses);
  out.gallerySize = clamp(text('gallerySize') ?? '', LIMITS.gallerySize, DEFAULTS.gallerySize);
  out.galleryCount = oneOf(
    Number(text('galleryCount')) as GalleryCount,
    GALLERY_COUNTS,
    DEFAULTS.galleryCount,
  );
  return out;
}
