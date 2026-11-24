/** Seed used when a name is empty after normalisation. */
export const FALLBACK_SEED = 'chara';

/**
 * Turns a display name into the string that seeds an avatar.
 *
 * With normalisation on: NFC, trim, collapse whitespace runs to one space and
 * lowercase without depending on the host locale. An empty result (with or
 * without normalisation) becomes {@link FALLBACK_SEED}.
 */
export function normalizeName(name: string, normalize = true): string {
  const value = normalize
    ? String(name).normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()
    : String(name);
  return value === '' ? FALLBACK_SEED : value;
}
