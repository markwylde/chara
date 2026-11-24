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
