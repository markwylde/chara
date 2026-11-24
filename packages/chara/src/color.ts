/**
 * Converts HSL to a `#rrggbb` hex string. Hue wraps around the colour wheel and
 * is rounded to a whole degree; saturation and lightness are percentages.
 */
export function hsl(h: number, s: number, l: number): string {
  const hue = (((Math.round(h) % 360) + 360) % 360) / 360;
  const sat = Math.min(100, Math.max(0, s)) / 100;
  const lig = Math.min(100, Math.max(0, l)) / 100;
  const k = (n: number) => (n + hue * 12) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const channel = (n: number) => {
    const v = lig - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/** The grey with the same perceived lightness (Rec. 601 luma) as a `#rrggbb` colour. */
export function toGrey(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const luma = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  const c = Math.round(luma).toString(16).padStart(2, '0');
  return `#${c}${c}${c}`;
}

/** {@link hsl}, but returning the grey of equal lightness. Used for the `mono` option. */
export function hslMono(h: number, s: number, l: number): string {
  return toGrey(hsl(h, s, l));
}
